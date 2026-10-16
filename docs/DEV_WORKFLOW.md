# Alur Development → Staging → Production

Panduan resmi untuk develop, QA di staging, lalu rilis ke production (termasuk branch).

## Ringkasan lingkungan

| Lingkungan | URL | Branch trigger | Catatan |
|------------|-----|----------------|---------|
| **Local** | `http://127.0.0.1:5173` + API `:3001` | — | Dev di laptop |
| **Staging** | `https://staging.dompet-tenang.web.id` | `feature/testing-qa`, `develop`, atau manual | QA / uji sebelum prod |
| **Production** | `https://dompet-tenang.web.id` | `main` (auto) atau manual | Live user |

Stack staging & production di **VPS yang sama**, DB terpisah. Detail teknis: [DEPLOY_SUMOPOD.md](./DEPLOY_SUMOPOD.md).

## Branch

```text
feature/<nama>  →  develop atau feature/testing-qa (staging)
                 →  main (production)
```

| Branch | Fungsi |
|--------|--------|
| `feature/*` / `fix/*` | Kerja fitur/bug di laptop |
| `feature/testing-qa` atau `develop` | Auto-deploy **staging** (setelah push) |
| `main` | Auto-deploy **production** |

Jangan commit langsung ke `main` kecuali hotfix darurat yang sudah disepakati. Prefer PR.

## Alur harian (disarankan)

1. **Buat branch** dari `main` terbaru:
   ```bash
   git checkout main && git pull
   git checkout -b feature/nama-fitur
   ```
2. **Develop & test lokal** (`npm run api` / `npm run web`).
3. **Push ke staging** — merge/push ke `feature/testing-qa` (atau `develop`):
   ```bash
   git push -u origin feature/nama-fitur
   # lalu PR / merge ke feature/testing-qa
   ```
   GitHub Actions **Deploy to Staging** jalan otomatis.
4. **QA di staging** — uji login, fitur, regresi di `https://staging.dompet-tenang.web.id`.
5. **Rilis ke prod** setelah QA OK:
   - Buka PR: `feature/testing-qa` (atau branch fitur) → `main`
   - Merge PR → **Deploy to Production** otomatis
6. **Verifikasi prod** — health + smoke test di `https://dompet-tenang.web.id`.

## Checklist sebelum merge ke `main`

- [ ] Build gate hijau (API + Web)
- [ ] QA staging selesai (login, alur utama, tidak ada regresi kritis)
- [ ] Tidak ada secret / `.env` di commit
- [ ] Pesan commit jelas (Conventional Commits)

## Deploy manual (jika perlu)

- Staging: Actions → **Deploy to Staging** → Run workflow  
- Production: Actions → **Deploy to Production** → Run workflow  

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
