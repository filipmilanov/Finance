# Deployment

Verdant deploys as a split stack:

| Component | Host | Trigger |
|-----------|------|---------|
| Frontend (`web/`) | [Vercel](https://vercel.com) | GitHub Actions on push to `main` |
| Backend (`server/`) | [Render](https://render.com) | GitHub Actions deploy hook |
| Database | [Supabase](https://supabase.com) Postgres | Manual setup |

## 1. Supabase database

1. Create a Supabase project.
2. Copy the **Connection string** (URI mode, port 5432).
3. Use the **Transaction pooler** URL for serverless-friendly connections if you prefer.

## 2. Render (backend)

1. Create a **Web Service** from this repo (or apply `render.yaml`).
2. Set **Root directory** to `server`.
3. Environment variables:

   | Variable | Example |
   |----------|---------|
   | `DATABASE_URL` | `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres` |
   | `JWT_SECRET` | long random string |
   | `CLIENT_ORIGIN` | `https://your-app.vercel.app` |
   | `PORT` | `10000` (Render default) |

4. Build command: `npm install && npm run build && npm run db:migrate`
5. Start command: `npm start`
6. Health check path: `/api/health`
7. Create a **Deploy Hook** (Settings → Deploy Hook) and save the URL.

### Upgrading from node-pg-migrate

If your database already has tables from the old migrator, `npm run db:migrate` detects them and marks the Drizzle baseline as applied **without altering data**.

## 3. Vercel (frontend)

1. Import the repo; set **Root directory** to `web`.
2. Framework preset: **Vite**.
3. Environment variable:

   | Variable | Value |
   |----------|-------|
   | `VITE_API_URL` | Your Render service URL, e.g. `https://verdant-api.onrender.com` |

4. Note the **Project ID** and **Org ID** from Vercel project settings.

## 4. GitHub Actions secrets

Add these under **Settings → Secrets and variables → Actions**:

| Secret | Used by |
|--------|---------|
| `RENDER_DEPLOY_HOOK_URL` | Backend deploy workflow |
| `RENDER_API_URL` | Backend health check, e.g. `https://verdant-api.onrender.com` |
| `VERCEL_TOKEN` | Frontend deploy ([create token](https://vercel.com/account/tokens)) |
| `VERCEL_ORG_ID` | Frontend deploy |
| `VERCEL_PROJECT_ID` | Frontend deploy |
| `VITE_API_URL` | Frontend build (same as Vercel env) |

Create a GitHub **environment** named `production` (optional but recommended) and attach the secrets there.

## 5. Pipelines

- **CI** (`.github/workflows/ci.yml`) — typecheck & build on every PR and push to `main`.
- **Deploy Backend** — triggers Render hook, polls `/api/health` for up to 10 minutes, writes diagnostics to the job summary on failure.
- **Deploy Frontend** — pre-flight build, Vercel production deploy, HTTP check on the live URL.

### Reading failed deployment logs

| Platform | Where to look |
|----------|---------------|
| GitHub Actions | Repo → Actions → failed workflow → expand failed step |
| Render | Dashboard → service → **Logs** (build + runtime tabs) |
| Vercel | Dashboard → project → **Deployments** → failed deployment → Build Logs |

Failed workflows also append a short checklist to the **Summary** tab on the run page.
