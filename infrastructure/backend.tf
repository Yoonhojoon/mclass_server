terraform {
  backend "s3" {
    bucket         = "mclass-terraform-state-20250731"
    key            = "infrastructure/terraform.tfstate"
    region         = "ap-northeast-2"
    dynamodb_table = "terraform-lock"
    encrypt        = true
  }
}
