# Deploy Dompet Tenang

## Lingkungan

| | URL | Branch | Approve QA? |
|---|-----|--------|-------------|
| Local | `http://127.0.0.1:5173` + API `:3001` | — | — |
| Staging | https://staging.dompet-tenang.web.id | `develop` | **Tidak** |
| Production | https://dompet-tenang.web.id | `main` | **Ya** (Deploy Production) |

Staging & production di VPS yang sama, database terpisah. File compose: `deploy/`.

## Alur rilis

```text
feature/*  →  develop  →  Staging (auto)
                 ↓
            QA uji staging
                 ↓
     Promote to Production  (tanpa Approve)
                 ↓
     Deploy to Production  →  Approve  →  VPS prod
```

1. Branch dari `main` / `develop` → kerja di `feature/...`
2. PR / merge ke **`develop`** → CI + **Deploy Staging** otomatis
3. Uji di staging
4. Actions → **Promote to Production** (branch `develop`) → Run  
5. **Deploy to Production** → **Review deployments** → **Approve**
6. Cek https://dompet-tenang.web.id/api/v1/health

Jangan push langsung ke `main` kecuali hotfix darurat.

## Secrets GitHub (sekali)

**Repository secrets** (Settings → Secrets and variables → Actions):

| Secret | Fungsi |
|--------|--------|
| `PROD_SSH_HOST` | IP / host VPS |
| `PROD_SSH_USER` | user SSH (biasanya `root`) |
| `PROD_SSH_KEY` | private key deploy |
| `PROD_SSH_PORT` | opsional, default `22` |
| `GH_PAT` | opsional, jika branch protection blokir push ke `main` |
| `EXPO_TOKEN` | opsional, publish APK |

**Environments:**

- `production` → **Required reviewers** (Approve deploy prod)
- `staging` → **tanpa** Required reviewers

## VPS (ringkas)

1. DNS: apex + `staging` → IP VPS  
2. Di VPS: `deploy/.env.production` dan `deploy/.env.staging` (dari `*.example`)  
3. Deploy lewat GitHub Actions (staging auto / promote + approve prod)

Script di server: `deploy/remote-deploy.sh`, `deploy/remote-deploy-staging.sh`.

## Mobile (internal)

Landing tidak unduh APK publik. Build internal: EAS / workflow **Publish Android APK**.

```bash
cd apps/mobile
eas build --platform android --profile production
```

## Workflow terkait

| Workflow | Kapan |
|----------|--------|
| CI - Build & Test | push / PR |
| Deploy to Staging | push `develop` |
| Promote to Production | manual setelah QA |
| Deploy to Production | setelah Promote (+ Approve) |
