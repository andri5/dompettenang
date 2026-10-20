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

## DBeaver → DB staging

Postgres staging **tidak** terbuka ke internet. Bind hanya `127.0.0.1:15432` di VPS; akses lewat SSH tunnel.

1. Pastikan key ada di `.local-ssh/id_ed25519` (sama seperti deploy SSH).
2. Ambil kredensial ke `.local-ssh/staging-dbeaver.env` (gitignored):

   **A — lewat Actions** (disarankan jika SSH lokal ke VPS timeout/firewall):
   ```powershell
   gh workflow run "Prepare staging DBeaver" --ref feature/testing-qa
   # tunggu sukses, lalu download artifact:
   gh run list --workflow=prepare-staging-dbeaver.yml --limit 1
   gh run download <RUN_ID> -n staging-dbeaver-env -D .local-ssh
   ```

   **B — SSH langsung** (butuh akses outbound ke `PROD_SSH_HOST` / port SSH):
   ```powershell
   .\scripts\fetch-staging-db-creds.ps1
   ```

3. Buka tunnel dan biarkan tetap terbuka:
   ```powershell
   .\scripts\staging-db-tunnel.ps1
   ```
   Script membaca `SSH_HOST` / `SSH_PORT` dari file kredensial. Jika tunnel gagal timeout, set `STAGING_SSH_HOST` / `STAGING_SSH_PORT` dari file itu, atau pakai VPN / jaringan yang mengizinkan SSH ke VPS.

4. Di DBeaver → New Connection → PostgreSQL:

   | Field | Nilai |
   |-------|--------|
   | Host | `localhost` |
   | Port | `15432` |
   | Database | `POSTGRES_DB` dari file di langkah 2 (default `dompettenang_staging`) |
   | Username | `POSTGRES_USER` (default `dompet_stg`) |
   | Password | `POSTGRES_PASSWORD` dari file di langkah 2 |
   | SSL | off (tunnel sudah SSH) |

Tab SSH di DBeaver tidak perlu jika sudah pakai script tunnel.

Opsional env untuk script: `STAGING_SSH_HOST`, `STAGING_SSH_USER`, `STAGING_SSH_PORT`.

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

## Agar muncul di Google (SEO)

Situs sudah boleh diindeks (`robots.txt` + meta `index,follow`). Google **tidak otomatis** langsung menampilkan domain baru — perlu submit & menunggu.

1. Buka [Google Search Console](https://search.google.com/search-console)
2. Tambah properti URL: `https://dompet-tenang.web.id`
3. Verifikasi (meta tag verification sudah ada di situs)
4. Menu **Sitemaps** → submit: `https://dompet-tenang.web.id/sitemap.xml`
5. **URL Inspection** → masukkan homepage → **Request indexing**
6. Tunggu beberapa hari–minggu. Cek dengan pencarian: `site:dompet-tenang.web.id`

Staging (`staging.dompet-tenang.web.id`) sengaja `noindex` — tidak masuk Google.
