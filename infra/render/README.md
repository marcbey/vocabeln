# Render provisioning via Terraform

This folder provisions the Render web service for this app.

## Prerequisites

- Terraform installed
- `.env` in project root with:
  - `RENDER_API_KEY`
  - `OPENAI_API_KEY`
- Render service is connected to GitHub and has access to this repo.
  - Without the Render GitHub integration/webhook, `auto_deploy=commit` will not
    receive push events and only manual deploys will run.

## Quick start

```bash
cd infra/render
cp terraform.tfvars.example terraform.tfvars
# set render_owner_id in terraform.tfvars
# optional: auto_deploy_trigger = "commit"
```

Run:

```bash
set -a
source ../../.env
set +a

export TF_VAR_render_api_key="$RENDER_API_KEY"
export TF_VAR_openai_api_key="$OPENAI_API_KEY"

terraform init
terraform plan
terraform apply
```

After apply:

```bash
terraform output service_url
```

## TTS cache disk (1GB)

The Terraform config can attach a Render persistent disk and pass the cache
directory into the service env (`TTS_CACHE_DIR`).

Defaults:

- `persistent_disk_enabled = true`
- `persistent_disk_size_gb = 1`
- `persistent_disk_mount_path = "/var/data"`
- `tts_cache_dir = "/var/data/tts-cache"`
- `openai_text_model = "gpt-4o-mini"`

Adjust these values in `terraform.tfvars` if needed.
If `persistent_disk_enabled = false`, Terraform sets `TTS_CACHE_DIR` to
`/tmp/tts-cache` automatically.

After deploy, you can verify on the service shell:

```bash
echo "$TTS_CACHE_DIR"
ls -la /var/data
```

## Auto-deploy notes

Terraform config in this folder explicitly sets:

- `runtime_source.native_runtime.auto_deploy = true`
- `runtime_source.native_runtime.auto_deploy_trigger` (default: `commit`)
- `runtime_source.native_runtime.branch = "main"` (by default)

If push-based deploys do not fire, check the GitHub connection in Render and
verify that a Render webhook exists in the GitHub repository settings.
