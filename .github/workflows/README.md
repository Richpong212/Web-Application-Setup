# CI/CD Workflow Template

These workflows build, scan, publish, sign, and update the dev Kustomize image tag for backend and admin images.

## Repository Variables

Optional repository variables:

- `BACKEND_IMAGE_NAME`: full backend image name. Defaults to `ghcr.io/<owner>/<repo>/backend`.
- `ADMIN_IMAGE_NAME`: full admin image name. Defaults to `ghcr.io/<owner>/<repo>/admin`.
- `DEV_API_URL`: admin build-time API URL. Defaults to `https://api.example.com`.
- `DEV_ADMIN_URL`: admin public base URL. Defaults to `https://admin.example.com`.
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `VITE_GA_MEASUREMENT_ID`
- `VITE_REDDIT_PIXEL_ID`
- `VITE_META_PIXEL_ID`

## Expected Repository Layout

The workflows assume these paths exist:

- `backend/`
- `admin/`
- `k8s/overlays/dev/kustomization.yml`

If your app uses different folder names, update `BUILD_CONTEXT`, `DOCKERFILE_PATH`, workflow `paths`, and the Kustomize image names.

## Permissions

The workflows use `GITHUB_TOKEN` for GHCR publishing and committing updated image tags back to the `dev` branch. Make sure the repository has:

- Actions write permission for contents
- package write permission
- workflow permissions that allow GitHub Actions to create commits
