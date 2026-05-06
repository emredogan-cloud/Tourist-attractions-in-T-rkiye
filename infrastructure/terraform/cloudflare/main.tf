terraform {
  required_version = ">= 1.7"
  required_providers {
    cloudflare = { source = "cloudflare/cloudflare", version = "~> 4.0" }
  }
}

variable "account_id" { type = string }
variable "zone_name"  { type = string, default = "turkiye-tourism.app" }

provider "cloudflare" { account_id = var.account_id }

data "cloudflare_zone" "main" {
  name = var.zone_name
}

# WAF: block known bad bots
resource "cloudflare_ruleset" "waf" {
  zone_id     = data.cloudflare_zone.main.id
  name        = "Bot & abuse blocks"
  description = "Block scrapers and known-bad UAs"
  kind        = "zone"
  phase       = "http_request_firewall_custom"

  rules {
    expression = "(cf.client.bot) or (lower(http.user_agent) contains \"scrapy\") or (lower(http.user_agent) contains \"masscan\")"
    action     = "block"
    description = "Block bots & scrapers"
    enabled    = true
  }
}

# Rate-limit: 60 req/min/IP for unauth /api/v1
resource "cloudflare_rate_limit" "public_api" {
  zone_id     = data.cloudflare_zone.main.id
  threshold   = 60
  period      = 60
  match {
    request {
      url_pattern = "${var.zone_name}/api/v1/*"
      schemes     = ["HTTP", "HTTPS"]
      methods     = ["GET", "POST"]
    }
  }
  action {
    mode    = "challenge"
    timeout = 600
  }
  description = "Public API per-IP rate limit"
}

# DDoS: enable advanced protection
resource "cloudflare_zone_settings_override" "main" {
  zone_id = data.cloudflare_zone.main.id
  settings {
    always_use_https        = "on"
    automatic_https_rewrites = "on"
    ssl                     = "strict"
    min_tls_version         = "1.2"
    security_level          = "medium"
    challenge_ttl           = 1800
    waf                     = "on"
    bot_management          = { fight_mode = true }
    brotli                  = "on"
    early_hints             = "on"
  }
}

# R2 bucket for media (zero egress)
resource "cloudflare_r2_bucket" "media" {
  account_id = var.account_id
  name       = "turkiye-tourism-media"
  location   = "EEUR"
}

output "r2_bucket" { value = cloudflare_r2_bucket.media.name }
