# Environment Variables
variable "database_url" {
  description = "Database connection URL"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT secret key"
  type        = string
  sensitive   = true
}

variable "redis_url" {
  description = "Redis connection URL"
  type        = string
  sensitive   = true
}

variable "kakao_client_id" {
  description = "Kakao OAuth client ID"
  type        = string
  sensitive   = true
}

variable "kakao_client_secret" {
  description = "Kakao OAuth client secret"
  type        = string
  sensitive   = true
}

variable "google_client_id" {
  description = "Google OAuth client ID"
  type        = string
  sensitive   = true
}

variable "google_client_secret" {
  description = "Google OAuth client secret"
  type        = string
  sensitive   = true
}

variable "naver_client_id" {
  description = "Naver OAuth client ID"
  type        = string
  sensitive   = true
}

variable "naver_client_secret" {
  description = "Naver OAuth client secret"
  type        = string
  sensitive   = true
}

# 초기 관리자 관련 변수들 추가
variable "initial_admin_email" {
  description = "Initial admin email"
  type        = string
  sensitive   = true
}

variable "initial_admin_password" {
  description = "Initial admin password"
  type        = string
  sensitive   = true
}

variable "initial_admin_name" {
  description = "Initial admin name"
  type        = string
  sensitive   = true
} 