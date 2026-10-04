data "aws_ssm_parameter" "al2023_arm64" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-arm64"
}

resource "aws_security_group" "nat" {
  name        = "ippo-nat-sg"
  description = "NAT instance. Allow 443 from app subnets only"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "ippo-nat-sg"
  }
}

# ECS が外へ出る通信は HTTPS だけ。SSH は開けない。中の確認は SSM で行う。
resource "aws_vpc_security_group_ingress_rule" "nat_from_app" {
  count = length(aws_subnet.app)

  security_group_id = aws_security_group.nat.id
  description       = "HTTPS from app subnet"
  cidr_ipv4         = aws_subnet.app[count.index].cidr_block
  ip_protocol       = "tcp"
  from_port         = 443
  to_port           = 443
}

# 中継する通信と、起動時の dnf・SSM エージェントが使う。
resource "aws_vpc_security_group_egress_rule" "nat_https" {
  security_group_id = aws_security_group.nat.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "tcp"
  from_port         = 443
  to_port           = 443
}

resource "aws_vpc_security_group_egress_rule" "nat_http" {
  security_group_id = aws_security_group.nat.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "tcp"
  from_port         = 80
  to_port           = 80
}

# SSM で入るための権限。SSH を閉じたので、これが無いと中を確かめる手段が無くなる。
data "aws_iam_policy_document" "nat_assume" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "nat" {
  name               = "ippo-nat-role"
  assume_role_policy = data.aws_iam_policy_document.nat_assume.json
}

resource "aws_iam_role_policy_attachment" "nat_ssm" {
  role       = aws_iam_role.nat.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "nat" {
  name = "ippo-nat-profile"
  role = aws_iam_role.nat.name
}

resource "aws_instance" "nat" {
  ami           = data.aws_ssm_parameter.al2023_arm64.insecure_value
  instance_type = "t4g.nano"
  subnet_id     = aws_subnet.public[0].id

  # パブリックサブネットは自動で公開 IP を付けない。無いと NAT 自身が外へ出られない。
  associate_public_ip_address = true

  # 自分宛てでない通信を受け取って中継するため。有効のままだと、届いた通信を捨てる。
  source_dest_check = false

  vpc_security_group_ids = [aws_security_group.nat.id]
  iam_instance_profile   = aws_iam_instance_profile.nat.name

  # AWS 公式の手順（VPC ユーザーガイド「NAT インスタンス」）を、AMI を作らずに起動時に流す。
  # 途中で失敗したら止める。どこで止まったかは /var/log/cloud-init-output.log に残る。
  # 中で heredoc を使わない。行頭の EOF でこの user_data 自体が終わってしまう。
  user_data = <<-EOF
    #!/bin/bash
    set -euxo pipefail

    # AL2023 には iptables が入っていない。
    dnf install -y iptables-services
    systemctl enable --now iptables

    # 自分宛てでない通信を中継する。ファイルに書くのは、再起動しても残すため。
    echo 'net.ipv4.ip_forward=1' > /etc/sysctl.d/90-nat.conf
    sysctl -p /etc/sysctl.d/90-nat.conf

    # 外へ出るインターフェース。t4g では ens5 が多いが、決め打ちしない。
    IFACE=$(ip route show default | awk '{print $5; exit}')

    # 外へ出るとき、送信元をこのインスタンスの IP に書き換える。
    iptables -t nat -A POSTROUTING -o "$IFACE" -j MASQUERADE

    # iptables-services の初期設定は、FORWARD の最後に「全部拒否」を入れている。
    # 残したまま後ろに足すと、先の拒否に当たって何も通らない。いったん消してから組み直す。
    iptables -F FORWARD
    iptables -P FORWARD DROP
    iptables -A FORWARD -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
    iptables -A FORWARD -s ${var.vpc_cidr} -o "$IFACE" -j ACCEPT

    # 再起動しても残す。
    service iptables save
  EOF

  # user_data は初回の起動でしか流れない。中身を変えたら作り直さないと反映されない。
  user_data_replace_on_change = true

  metadata_options {
    http_tokens = "required"
  }

  # t4g は既定で unlimited。CPU を使い続けると、クレジットを超えた分が課金される。
  credit_specification {
    cpu_credits = "standard"
  }

  # 作るときは最新の AMI を使う。動かしている途中で新しい AMI が出ても、入れ替えない。
  # 入れ替えると NAT が止まり、その間 ECS が外へ出られなくなる。
  lifecycle {
    ignore_changes = [ami]
  }

  tags = {
    Name = "ippo-nat"
  }
}

# アプリ用サブネットから外へ出る通信を、NAT インスタンスのネットワークインターフェースへ向ける。
resource "aws_route" "app_default" {
  route_table_id         = aws_route_table.app.id
  destination_cidr_block = "0.0.0.0/0"
  network_interface_id   = aws_instance.nat.primary_network_interface_id
}
