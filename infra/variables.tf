variable "region" {
  type    = string
  default = "ap-northeast-1"
}

variable "domain_name" {
  description = "bootstrapと同じ保有している独自ドメイン"
  type        = string
}

variable "azs" {
  description = "使うアベイラビリティゾーン。 RDSのサブネットグループが2つ要求する"
  type        = list(string)
  default     = ["ap-northeast-1a", "ap-northeast-1c"]
}

variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "dev_allow_cidrs" {
  description = "開発中にALBへ直接つなぐ CIDR。 完成したら空にする"
  type        = list(string)
  default     = []
}
