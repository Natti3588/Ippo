resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "ippo-vpc"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "ippo-igw"
  }
}

resource "aws_subnet" "app" {
  count = length(var.azs)

  vpc_id            = aws_vpc.main.id
  availability_zone = var.azs[count.index]
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 21)

  tags = {
    Name = "ippo-app-${var.azs[count.index]}"
  }
}

resource "aws_route_table" "app" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "ippo-app-rt"
  }
}

resource "aws_route_table_association" "app" {
  count = length(aws_subnet.app)

  subnet_id      = aws_subnet.app[count.index].id
  route_table_id = aws_route_table.app.id
}

resource "aws_subnet" "public" {
  count = length(var.azs)

  vpc_id            = aws_vpc.main.id
  availability_zone = var.azs[count.index]
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 1)

  tags = {
    Name = "ippo-public-${var.azs[count.index]}"
  }
}

# RDSだけ置く
resource "aws_subnet" "database" {
  count = length(var.azs)

  vpc_id            = aws_vpc.main.id
  availability_zone = var.azs[count.index]
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 11)

  tags = {
    Name = "ippo-db-${var.azs[count.index]}"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "ippo-public-rt"
  }
}

resource "aws_route_table" "database" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "ippo-db-rt"
  }
}

resource "aws_route_table_association" "public" {
  count = length(aws_subnet.public)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "database" {
  count = length(aws_subnet.database)

  subnet_id      = aws_subnet.database[count.index].id
  route_table_id = aws_route_table.database.id
}

moved {
  from = aws_subnet.private
  to   = aws_subnet.database
}

moved {
  from = aws_route_table.private
  to   = aws_route_table.database
}

moved {
  from = aws_route_table_association.private
  to   = aws_route_table_association.database
}
