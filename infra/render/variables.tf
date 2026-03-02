variable "render_api_key" {
  description = "Render API key"
  type        = string
  sensitive   = true
}

variable "render_owner_id" {
  description = "Render owner ID (starts with usr- or tea-)"
  type        = string
}

variable "openai_api_key" {
  description = "OpenAI API key passed to Render service env"
  type        = string
  sensitive   = true
}

variable "service_name" {
  description = "Render service name"
  type        = string
  default     = "vokabeln-app"
}

variable "repo_url" {
  description = "Git repository URL to deploy from"
  type        = string
  default     = "https://github.com/marcbey/vocabeln"
}

variable "repo_branch" {
  description = "Git branch to deploy from"
  type        = string
  default     = "main"
}

variable "plan" {
  description = "Render plan for the web service"
  type        = string
  default     = "starter"
}

variable "region" {
  description = "Render deployment region"
  type        = string
  default     = "oregon"
}

variable "auto_deploy_trigger" {
  description = "Auto deploy behavior for Git-based services (commit, checks_passed, off)"
  type        = string
  default     = "commit"

  validation {
    condition = contains(
      ["commit", "checks_passed", "off"],
      var.auto_deploy_trigger
    )
    error_message = "auto_deploy_trigger must be one of: commit, checks_passed, off."
  }
}

variable "openai_tts_model" {
  description = "OpenAI TTS model name"
  type        = string
  default     = "gpt-4o-mini-tts"
}

variable "openai_stt_model" {
  description = "OpenAI STT model name"
  type        = string
  default     = "gpt-4o-mini-transcribe"
}

variable "openai_text_model" {
  description = "OpenAI text model name for example sentence generation"
  type        = string
  default     = "gpt-4o-mini"
}

variable "persistent_disk_enabled" {
  description = "Attach a Render persistent disk to the web service"
  type        = bool
  default     = true
}

variable "persistent_disk_name" {
  description = "Name of the Render persistent disk"
  type        = string
  default     = "tts-cache-disk"
}

variable "persistent_disk_mount_path" {
  description = "Absolute mount path for the persistent disk"
  type        = string
  default     = "/var/data"

  validation {
    condition     = startswith(var.persistent_disk_mount_path, "/")
    error_message = "persistent_disk_mount_path must be an absolute path."
  }
}

variable "persistent_disk_size_gb" {
  description = "Size of the persistent disk in GB"
  type        = number
  default     = 1

  validation {
    condition     = var.persistent_disk_size_gb >= 1
    error_message = "persistent_disk_size_gb must be at least 1 GB."
  }
}

variable "tts_cache_dir" {
  description = "Directory used by the app for TTS audio cache (used when persistent_disk_enabled=true)"
  type        = string
  default     = "/var/data/tts-cache"

  validation {
    condition     = startswith(var.tts_cache_dir, "/")
    error_message = "tts_cache_dir must be an absolute path."
  }
}
