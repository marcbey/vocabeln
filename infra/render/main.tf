terraform {
  required_version = ">= 1.5.0"

  required_providers {
    render = {
      source  = "render-oss/render"
      version = "~> 1.8"
    }
  }
}

provider "render" {
  api_key                          = var.render_api_key
  owner_id                         = var.render_owner_id
  wait_for_deploy_completion       = true
  skip_deploy_after_service_update = false
}

resource "render_web_service" "vocabeln" {
  name              = var.service_name
  plan              = var.plan
  region            = var.region
  health_check_path = "/api/health"
  start_command     = "NODE_ENV=production npm run start"

  runtime_source = {
    native_runtime = {
      auto_deploy   = true
      branch        = var.repo_branch
      build_command = "npm ci && npm run build"
      repo_url      = var.repo_url
      runtime       = "node"
    }
  }

  env_vars = {
    OPENAI_API_KEY   = { value = var.openai_api_key }
    OPENAI_TTS_MODEL = { value = var.openai_tts_model }
    OPENAI_STT_MODEL = { value = var.openai_stt_model }
  }
}

output "service_id" {
  description = "Render service ID"
  value       = render_web_service.vocabeln.id
}

output "service_slug" {
  description = "Render service slug"
  value       = render_web_service.vocabeln.slug
}

output "service_url" {
  description = "Public Render URL"
  value       = render_web_service.vocabeln.url
}
