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
  default     = "vocabeln-app"
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
