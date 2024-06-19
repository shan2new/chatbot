variable "frontend_env_vars" {
  type        = map(string)
  description = "Environment variables for the frontend container"
}

variable "backend_env_vars" {
  type        = map(string)
  description = "Environment variables for the backend container"
}

variable "domain_name" {
  type        = string
  description = "Domain name for the SSL certificate"
}

variable "acm_certificate_arn" {
  type        = string
  description = "ARN of the manually created ACM certificate"
}
