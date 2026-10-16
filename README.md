# Dompet Tenang — Catat Keuangan

Aplikasi pencatatan keuangan pribadi (pemasukan & pengeluaran) dengan dashboard, kategori, upload struk, dan saran finansial otomatis.

## Project Structure

Monorepo:

| Path | Deskripsi |
|------|-----------|
| [apps/api](./apps/api) | Backend API (Node.js + Express + TypeScript + Prisma + PostgreSQL) |
| [apps/web](./apps/web) | Web frontend (React + Vite + TypeScript + Tailwind CSS) |
| [apps/mobile](./apps/mobile) | Mobile app (React Native + Expo) — fitur inti siap; admin penuh di web |
| [packages/shared](./packages/shared) | Shared utilities & types |

## Features

- **Auth** — Register, login, logout, lupa/reset password (SMTP + HttpOnly cookie di web; Bearer di mobile)
- **Transaksi** — Pemasukan & pengeluaran (menu Transaksi dengan submenu)
- **Kategori** — Default + kustom, ikon Lucide, kategori default terkunci
- **Dashboard** — Ringkasan saldo, grafik perbandingan, breakdown per kategori, AI saran & notice
- **Budget / Recurring / Savings** — Limit bulanan, transaksi otomatis, target tabungan (bisa di-gate feature flag)
- **Struk** — Upload gambar/PDF sebagai bukti transaksi (akses privat ber-auth; mobile + kamera)
- **Kalkulator** — Hitung nominal cepat di form transaksi
- **Profil** — Upload foto profil, gender & tanggal lahir, 3 tema
- **Legal dinamis** — Syarat & Ketentuan / Privasi dikelola admin
- **Mobile offline** — Simpan transaksi ke antrian saat offline, sync otomatis saat online
- **Admin** — Panel penuh di web (flags, traffic, activity, legal); ringkas di mobile
- **Responsif** — Desktop sidebar + mobile bottom nav

> **Production:** https://dompet-tenang.web.id — deploy VPS Sumopod.  
> **Staging (QA):** https://staging.dompet-tenang.web.id — butuh DNS `A` `staging` → IP VPS.  
> Alur branch & rilis: [docs/DEV_WORKFLOW.md](./docs/DEV_WORKFLOW.md). Detail VPS: [docs/DEPLOY_SUMOPOD.md](./docs/DEPLOY_SUMOPOD.md).  
> Landing: aplikasi **mobile akan segera rilis** (bukan unduh APK publik).

## Quick Start

### Prerequisites

- Node.js 18+
- npm
- PostgreSQL (atau Docker)
- Git

### Installation

```bash
git clone https://github.com/andri5/Dompet Tenang.git
cd Dompet Tenang
npm install
```

### Environment

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
cp apps/mobile/.env.example apps/mobile/.env
```

Sesuaikan di `apps/api/.env`:

- `DATABASE_URL` — koneksi PostgreSQL
- `PORT` — default `3001`
- `CORS_ORIGIN` / `APP_URL` — biasanya `http://localhost:5173`
- `JWT_SECRET` & `JWT_REFRESH_SECRET` — wajib kuat di production
- `SMTP_*` — untuk kirim email reset password (`SMTP_ENABLED=true`)
- `EXPOSE_PASSWORD_RESET_URL` — hanya development bila SMTP belum aktif

Sesuaikan di `apps/web/.env`:

- `VITE_API_URL=/api/v1` — same-origin via Vite proxy (wajib untuk cookie auth)

Sesuaikan di `apps/mobile/.env`:

- `EXPO_PUBLIC_API_URL` — contoh `http://localhost:3001/api/v1` (Android emulator: `http://10.0.2.2:3001/api/v1`)


### Database

```bash
cd apps/api
npx prisma generate
npx prisma db push
npx prisma db seed
```

### Run (dari root monorepo)

```bash
# Terminal 1 — API
npm run api

# Terminal 2 — Web
npm run web

# Terminal 3 — Mobile (opsional)
npm run mobile
```

- Web: http://127.0.0.1:5173/
- API: http://localhost:3001/api/v1/health
- Mobile: Expo Dev Tools (scan QR / emulator)

## Tech Stack

**API:** Express, Prisma, Zod, JWT, Nodemailer, cookie-parser, Multer, Helmet, bcrypt  

**Web:** React 19, React Router, TanStack Query, Zustand, React Hook Form, Recharts, Framer Motion, Tailwind CSS v4  

**Mobile:** Expo (React Native), React Navigation, SecureStore, Axios

## Documentation

- [Alur Development → Staging → Production](./docs/DEV_WORKFLOW.md) ⭐
- [Deploy ke Sumopod (VPS + bayar + DNS + autodeploy)](./docs/DEPLOY_SUMOPOD.md)
- [Distribusi mobile (internal)](./docs/MOBILE_DISTRIBUTE.md)
- [Backend](./apps/api/README.md)
- [Web](./apps/web/README.md)
- [Contributing](./CONTRIBUTING.md)

## License

MIT — see [LICENSE](./LICENSE)

## Author

- **Andri** — [GitHub](https://github.com/andri5)

## Support

Buka issue di [GitHub Issues](https://github.com/andri5/duitdiary/issues).
