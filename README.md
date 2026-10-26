# Dompet Tenang — Catat Keuangan

Aplikasi pencatatan keuangan pribadi (pemasukan & pengeluaran). Gratis untuk catat, budget, dan export Excel. **Pro Lifetime** menambah insight bulanan, tabungan, transaksi otomatis, PDF, dan bagikan ringkasan.

## Project Structure

Monorepo:

| Path | Deskripsi |
|------|-----------|
| [apps/api](./apps/api) | Backend API (Node.js + Express + TypeScript + Prisma + PostgreSQL) |
| [apps/web](./apps/web) | Web frontend (React + Vite + TypeScript + Tailwind CSS) |
| [apps/mobile](./apps/mobile) | Mobile app (React Native + Expo) — fitur inti siap; admin penuh di web |

## Features

### Gratis

- **Auth** — Register, login, logout, lupa/reset password (SMTP + HttpOnly cookie di web; Bearer di mobile)
- **Transaksi** — Pemasukan & pengeluaran, pencarian catatan atau nama kategori, dan saldo berjalan di tiap baris
- **Pengingat harian** — Banner jika hari ini belum ada catatan; notifikasi lokal setelah pukul 18.00 bila diizinkan
- **Kategori** — Default + kustom
- **Dashboard** — Saldo, grafik, breakdown kategori, saran periode berjalan
- **Budget** — Limit pengeluaran bulanan
- **Struk** — Upload gambar/PDF (akses privat ber-auth)
- **Export Excel** — Unduh ringkasan + daftar transaksi
- **Profil** — Foto, gender, tanggal lahir, tema

### Pro Lifetime (sekali bayar)

- **Insight bulanan** — Menu `/insight`: bandingkan bulan ini (sampai tanggal yang sama) dengan bulan lalu, kategori terbesar, dan saran singkat. Endpoint `GET /dashboard/monthly-insight` (403 jika bukan Pro)
- **Target tabungan** dan **transaksi otomatis**
- **Export PDF** dan **bagikan ringkasan** dari mobile
- **Splash panduan Pro** — sekali per akun setelah plan menjadi PRO (tanpa logout paksa)
- **Upgrade manual** — transfer bank + unggah bukti. Admin menolak wajib memilih alasan: bukti kurang jelas, kode transfer salah, atau nominal/rekening salah. User melihat alasan itu dan mendapat toast saat status jadi ditolak

### Lainnya

- **Legal dinamis** — Syarat & Ketentuan / Privasi dikelola admin
- **Mobile offline** — Antrian transaksi saat offline, sync saat online
- **Admin** — Panel web (user, Pro, flags, traffic, activity, legal)
- **Responsif** — Sidebar desktop + bottom nav mobile

> **Production:** https://dompet-tenang.web.id  
> **Staging:** https://staging.dompet-tenang.web.id  
> Alur deploy: [docs/DEPLOY.md](./docs/DEPLOY.md)

## Quick Start

### Prerequisites

- Node.js 18+
- npm
- PostgreSQL (atau Docker)
- Git

### Installation

```bash
git clone https://github.com/andri5/dompettenang.git
cd dompettenang
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

- [Deploy (staging → prod)](./docs/DEPLOY.md)
- [API overview](./docs/API.md)
- [Backend](./apps/api/README.md) · [Web](./apps/web/README.md)
- [Contributing](./CONTRIBUTING.md)

## License

MIT — see [LICENSE](./LICENSE)

## Author

- **Andri** — [GitHub](https://github.com/andri5)

## Support

Buka issue di [GitHub Issues](https://github.com/andri5/dompettenang/issues).
