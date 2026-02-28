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

## Auto-deploy notes

Terraform config in this folder explicitly sets:

- `runtime_source.native_runtime.auto_deploy = true`
- `runtime_source.native_runtime.auto_deploy_trigger` (default: `commit`)
- `runtime_source.native_runtime.branch = "main"` (by default)

If push-based deploys do not fire, check the GitHub connection in Render and
verify that a Render webhook exists in the GitHub repository settings.
