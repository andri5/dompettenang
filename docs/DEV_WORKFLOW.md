# Alur Development → Staging → Production

Panduan: develop → staging otomatis (tanpa approval) → QA uji → Promote → **Approve hanya saat Deploy Production**.

## Ringkasan lingkungan

| Lingkungan | URL | Branch trigger | Approval QA? |
|------------|-----|----------------|--------------|
| **Local** | `http://127.0.0.1:5173` + API `:3001` | — | — |
| **Staging** | `https://staging.dompet-tenang.web.id` | `develop` (kanonik), `feature/testing-qa` | **Tidak** — auto deploy |
| **Production** | `https://dompet-tenang.web.id` | `main` via Promote + Deploy | **Ya** — Approve di Deploy to Production |

Stack staging & production di **VPS yang sama**, DB terpisah. Detail teknis: [DEPLOY_SUMOPOD.md](./DEPLOY_SUMOPOD.md).

## Branch

```text
feature/<nama>  →  develop (staging, auto)
                →  main (production) via Promote, lalu Approve di Deploy Production
```

| Branch | Fungsi |
|--------|--------|
| `feature/*` / `fix/*` | Kerja fitur/bug di laptop |
| `develop` | **Kanonik staging** — auto-deploy staging (tanpa approval) |
| `feature/testing-qa` | Alias staging (masih didukung; prefer `develop`) |
| `main` | Production |

Jangan commit langsung ke `main` kecuali hotfix darurat. Rilis normal lewat **Promote to Production**.

## Alur harian

1. **Buat branch** dari `main` (atau `develop`) terbaru:
   ```bash
   git checkout main && git pull
   git checkout -b feature/nama-fitur
   ```
2. **Develop & test lokal** (`npm run api` / `npm run web`).
3. **PR ke staging** — merge ke `develop`:
   ```bash
   git push -u origin feature/nama-fitur
   # lalu PR / merge ke develop
   ```
   **CI** + **Deploy to Staging** jalan otomatis — **tidak perlu Approve**.
4. **QA di staging** — uji di `https://staging.dompet-tenang.web.id`.
5. **Rilis ke prod** setelah QA OK:
   - Actions → **Promote to Production** → branch **`develop`** → **Run workflow**  
     (merge `develop` → `main`, tanpa approval di langkah ini)
   - Actions → **Deploy to Production** menunggu — klik **Review deployments** → **Approve**
6. **Verifikasi prod** — health + smoke di `https://dompet-tenang.web.id`.

## Checklist sebelum Promote

- [ ] Deploy Staging sukses
- [ ] CI di branch `develop` hijau
- [ ] QA staging selesai (login, alur utama, tidak ada regresi kritis)
- [ ] Tidak ada secret / `.env` di commit

## Deploy / promote

| Aksi | Cara | Approval? |
|------|------|-----------|
| Staging | Auto push `develop`, atau Actions → **Deploy to Staging** | Tidak |
| Promote | Actions → **Promote to Production** (`develop`) | Tidak |
| Production | Auto setelah Promote (atau Run manual) | **Ya** — Required reviewers |

## Setup sekali: approval hanya di production

1. Repo → **Settings** → **Environments** → **production**
2. Centang **Required reviewers** → tambah akun QA / maintainer
3. Pastikan secret `PROD_SSH_*` ada di **Repository secrets** (bukan hanya Environment production)  
4. Environment **staging** boleh ada (untuk URL badge) — **jangan** centang Required reviewers di situ

Promote memakai **git merge + push** ke `main`, lalu dispatch **Deploy to Production**.  
Jika branch protection menolak push Actions ke `main`, tambahkan secret **`GH_PAT`** (scope `repo`).

Detail VPS: [DEPLOY_SUMOPOD.md](./DEPLOY_SUMOPOD.md).

## Prasyarat staging (sekali)

1. DNS `A` record: `staging` → IP VPS
2. Buat `deploy/.env.staging` di VPS dari `deploy/.env.staging.example`
3. Deploy staging sekali

## Mobile

Landing **tidak** menawarkan unduh APK publik. Teks: aplikasi mobile **akan segera rilis**.  
Distribusi internal / EAS: [MOBILE_DISTRIBUTE.md](./MOBILE_DISTRIBUTE.md).

## SSH VPS

Deploy CI memakai secret `PROD_SSH_*`. Detail: [DEPLOY_SUMOPOD.md](./DEPLOY_SUMOPOD.md).
