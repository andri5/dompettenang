# Alur Development → Staging → Production

Panduan resmi: develop → deploy staging otomatis → QA approve (1 klik) → promote ke production otomatis.

## Ringkasan lingkungan

| Lingkungan | URL | Branch trigger | Catatan |
|------------|-----|----------------|---------|
| **Local** | `http://127.0.0.1:5173` + API `:3001` | — | Dev di laptop |
| **Staging** | `https://staging.dompet-tenang.web.id` | `develop` (kanonik), `feature/testing-qa`, atau manual | QA / uji sebelum prod |
| **Production** | `https://dompet-tenang.web.id` | `main` (auto setelah promote) | Live user |

Stack staging & production di **VPS yang sama**, DB terpisah. Detail teknis: [DEPLOY_SUMOPOD.md](./DEPLOY_SUMOPOD.md).

## Branch

```text
feature/<nama>  →  develop (staging)
                →  main (production) via Promote workflow + QA approve
```

| Branch | Fungsi |
|--------|--------|
| `feature/*` / `fix/*` | Kerja fitur/bug di laptop |
| `develop` | **Kanonik staging** — auto-deploy staging setelah push/merge |
| `feature/testing-qa` | Alias staging (masih didukung; prefer `develop`) |
| `main` | Production — auto-deploy setelah merge/promote |

Jangan commit langsung ke `main` kecuali hotfix darurat. Rilis normal lewat **Promote to Production**.

## Alur harian (otomatis)

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
   GitHub Actions **CI** + **Deploy to Staging** jalan otomatis.
4. **QA di staging** — uji login, fitur, regresi di `https://staging.dompet-tenang.web.id`.
5. **Promote ke prod** setelah QA OK (1 klik + approve):
   - Actions → **Promote to Production** → branch **`develop`** → **Run workflow**
   - Klik **Review deployments** → **Approve** (Required reviewers)
   - Workflow merge `develop` → `main` → **Deploy to Production** otomatis
6. **Verifikasi prod** — health + smoke test di `https://dompet-tenang.web.id`.

## Checklist sebelum Promote

- [ ] Deploy Staging sukses
- [ ] CI di branch `develop` hijau
- [ ] QA staging selesai (login, alur utama, tidak ada regresi kritis)
- [ ] Tidak ada secret / `.env` di commit

## Deploy / promote manual

| Aksi | Cara |
|------|------|
| Staging | Actions → **Deploy to Staging** → Run workflow |
| Promote (setelah QA) | Actions → **Promote to Production** → Run → Approve |
| Production (darurat) | Actions → **Deploy to Production** → Run workflow (deploy isi `main` saat itu) |

## Setup sekali: QA approve di GitHub

Agar langkah 5 menunggu approval manusia (bukan full-auto ke prod):

1. Repo → **Settings** → **Environments** → **production**
2. Centang **Required reviewers** → tambah akun QA / maintainer
3. (Opsional) **Wait timer** jika ingin jeda singkat sebelum deploy

**Catatan:** `Deploy to Production` juga memakai environment `production`. Jika Required reviewers aktif, Anda mungkin perlu **Approve** sekali lagi saat job deploy jalan (setelah promote merge). Itu disengaja agar prod tidak jalan tanpa konfirmasi.

Promote memakai **git merge + push** ke `main` (bukan buat PR), lalu dispatch Deploy to Production.

Jika branch protection di `main` menolak push dari Actions, tambahkan secret **`GH_PAT`** (Personal Access Token, scope `repo`).

Detail secrets deploy VPS: [DEPLOY_SUMOPOD.md](./DEPLOY_SUMOPOD.md).

## Prasyarat staging (sekali)

1. DNS `A` record: `staging` → IP VPS
2. Buat `deploy/.env.staging` di VPS dari `deploy/.env.staging.example`
3. Deploy staging sekali

Tanpa DNS, URL staging tidak resolve (NXDOMAIN) meskipun container sudah ada di VPS.

## Mobile

Landing **tidak** menawarkan unduh APK publik. Teks: aplikasi mobile **akan segera rilis**.  
Distribusi internal / EAS tetap bisa dipakai tim (lihat [MOBILE_DISTRIBUTE.md](./MOBILE_DISTRIBUTE.md)).

## SSH VPS

Deploy CI memakai key di secret `PROD_SSH_*`. Detail: [DEPLOY_SUMOPOD.md](./DEPLOY_SUMOPOD.md).
