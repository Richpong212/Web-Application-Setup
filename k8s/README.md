# Kubernetes Deployment Template

This folder is a reusable Kubernetes/Kustomize template for a web application with:

- backend API
- admin client
- Redis
- CloudNativePG Postgres
- ingress-nginx ingress
- cert-manager TLS
- Argo CD deployment

Before using it for your own app, replace the sample values below.

## Required Replacements

| Location | Replace | Example |
| --- | --- | --- |
| `k8s/overlays/dev/kustomization.yml` | `sample-app-dev` | `my-app-dev` |
| `k8s/overlays/dev/kustomization.yml` | `sample-app` label | `my-app` |
| `k8s/overlays/dev/kustomization.yml` | `ghcr.io/your-org/your-repo/backend` | `ghcr.io/acme/my-app/backend` |
| `k8s/overlays/dev/kustomization.yml` | `ghcr.io/your-org/your-repo/admin` | `ghcr.io/acme/my-app/admin` |
| `k8s/base/backend/ingress.yml` | `api.example.com` | `api.my-app.com` |
| `k8s/base/admin/ingress.yml` | `admin.example.com` | `admin.my-app.com` |
| `k8s/argocd/app.yml` | `https://github.com/your-org/your-repo.git` | your public repo URL |

## Secrets

The checked-in secret manifests contain placeholder values only. Replace these before applying to a real cluster:

- `k8s/base/backend/secret.yml`
- `k8s/base/postgres/owner-secret.yml`
- `k8s/base/redis/secret.yml`

For production, prefer creating secrets through your secret manager, External Secrets, Sealed Secrets, SOPS, or your CI/CD system instead of committing real secret values.

## App Configuration

Update `k8s/base/backend/configmap.yml` for your app:

- Postgres database/user names
- allowed origins and client URL
- S3 bucket settings
- SMTP sender settings
- cookie name

Update `k8s/base/admin/configmap.yml` with the public API URL used by your admin client.

## Render Locally

```sh
kubectl kustomize k8s/overlays/dev
```

or:

```sh
kustomize build k8s/overlays/dev
```
