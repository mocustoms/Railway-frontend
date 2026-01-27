# Deploying the Frontend on Railway

This guide explains how to deploy the Tenzen/EasyMauzo React frontend to [Railway](https://railway.app) using the included config-as-code files.

## Files Involved

| File | Purpose |
|------|---------|
| `railway.toml` | Railway config (build + deploy). Use this **or** `railway.json`, not both. |
| `railway.json` | Same as above, JSON format. |
| `package.json` | `npm run build` → CRA build into `build/`; `serve` used to serve it in production. |

## Quick Setup

### 1. Add the Frontend service

1. In your [Railway](https://railway.app) project, add a new service.
2. Choose **Deploy from GitHub repo** and select your repository.
3. Set **Root Directory** to `Tenzen_Frontend` (so the service root is the frontend folder).
4. Railway will detect `railway.toml` or `railway.json` in that root.

### 2. Deploy flow

Each deploy will:

1. **Build** – run `npm run build` (Create React App writes static files to `build/`).
2. **Start** – run `npx serve -s build -l $PORT` to serve the `build/` folder on Railway’s `PORT`.
3. **Health check** – HTTP GET `/` (timeout 60s).

The `-s` flag makes `serve` treat the app as an SPA (all routes fall back to `index.html` for client-side routing).

### 3. Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `REACT_APP_API_URL` | No* | Backend API base URL. Set this when the frontend and backend are on different origins. |
| `PORT` | No | Set by Railway. Used by `serve -l $PORT`. |

\* If the frontend is served from the **same** Railway app/URL as the backend (e.g. backend serves the built frontend), you can leave `REACT_APP_API_URL` unset; `src/services/api.ts` will use the same origin + `/api`.

If the frontend is a **separate** Railway service (its own URL), set:

```
REACT_APP_API_URL=https://your-backend-url.railway.app/api
```

Use your actual backend public URL. Build-time vars must be set **before** you run `npm run build`, so set them in Railway **Variables** for this service and redeploy after changing them.

### 4. Generate a public URL

1. Open the Frontend service in Railway.
2. Go to **Settings** → **Networking** (or **Variables** → **Networking**).
3. Click **Generate Domain** to get a public URL (e.g. `https://your-frontend.railway.app`).

### 5. Backend CORS

If the frontend URL is different from the backend, set the backend’s **CORS_ORIGIN** to the frontend URL, e.g.:

```
CORS_ORIGIN=https://your-frontend.railway.app
```

You can use multiple origins separated by commas.

## Optional: `start:prod` script

`package.json` includes:

```json
"start:prod": "serve -s build -l ${PORT:-3000}"
```

Useful for running the production build locally (after `npm run build`):

```bash
npm run start:prod
```

Railway uses the command in `railway.toml` / `railway.json` (`npx serve -s build -l $PORT`), so you don’t need to change anything for deploy.

## Troubleshooting

- **Blank page or 404 on refresh** – `serve -s` is required so non-root routes are served `index.html`. The config already uses `-s`.
- **API calls fail (CORS / wrong URL)** – Set `REACT_APP_API_URL` to the backend URL and ensure the backend has `CORS_ORIGIN` set to the frontend URL.
- **Build fails** – Check that **Root Directory** is `Tenzen_Frontend` and that `npm run build` succeeds locally.
- **Health check fails** – The app serves on `PORT`. Railway sets `PORT`; the start command uses `-l $PORT`. If you changed the start command, ensure it still listens on `$PORT`.
