# Render provisioning via Terraform

This folder provisions the Render web service for this app.

## Prerequisites

- Terraform installed
- `.env` in project root with:
  - `RENDER_API_KEY`
  - `OPENAI_API_KEY`

## Quick start

```bash
cd infra/render
cp terraform.tfvars.example terraform.tfvars
# set render_owner_id in terraform.tfvars
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
