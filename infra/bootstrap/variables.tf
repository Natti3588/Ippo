variable "region" {
  description = "主に使用するリージョン"
  type        = string
  default     = "ap-northeast-1"
}

variable "domain_name" {
  description = "保有している独自ドメイン"
  type        = string
}

variable "github_repository" {
  description = "CD を動かす GitHub のリポジトリ（オーナー/名前）"
  type        = string
  default     = "Natti3588/Ippo"
}
