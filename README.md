# Dompet Tenang — Catat Keuangan

**Versi aplikasi: 1.1.0**

Aplikasi pencatatan keuangan pribadi (pemasukan & pengeluaran). Gratis untuk catat, budget, dan export Excel. **Pro Lifetime** menambah peringatan budget, insight bulanan, tabungan, transaksi otomatis, PDF, dan bagikan ringkasan.

## Project Structure

Monorepo:

| Path | Deskripsi |
|------|-----------|
| [apps/api](./apps/api) | Backend API (Node.js + Express + TypeScript + Prisma + PostgreSQL) |
| [apps/web](./apps/web) | Web frontend (React + Vite + TypeScript + Tailwind CSS) |
| [apps/mobile](./apps/mobile) | Mobile app (React Native + Expo) — fitur inti siap; admin penuh di web |

## Features

### Gratis

- **Auth** — Daftar/masuk manual (nama, email, password), logout, lupa/reset password (SMTP + HttpOnly cookie di web; Bearer di mobile). Gender dan tanggal lahir opsional di profil. *(Belum ada login sosial / Google SSO.)*
- **Transaksi** — Pemasukan & pengeluaran, pencarian catatan atau nama kategori, dan saldo berjalan di tiap baris
- **Pengingat harian** — Banner jika hari ini belum ada catatan; notifikasi lokal setelah pukul 18.00 bila diizinkan
- **Kategori** — Default + kustom (ikon/warna; pemasukan vs pengeluaran). Seed kategori default idempotent (anti-dobel)
- **Dashboard** — Saldo, grafik, breakdown kategori, plus satu kartu **Pemberitahuan** singkat (bukan label AI)
- **Budget** — Limit pengeluaran bulanan
- **Struk** — Unggah gambar/PDF bukti transaksi (akses privat ber-auth, maks. 10MB). Foto dari HP dikompres otomatis. Nominal/tanggal diisi manual — **OCR/scan otomatis sudah dihapus**
- **Export Excel** — Unduh ringkasan + daftar transaksi
- **Profil** — Foto, gender/tanggal lahir (opsional), tema; ganti password collapsible di halaman Akun
- **Ucapan ulang tahun** — Popup sekali per tahun di hari ulang tahun (pakai tanggal lahir profil)
- **Bantuan** — Halaman `/help` publik (bisa dari landing tanpa login); user login tetap melihat layout aplikasi
- **Panduan publik (SEO)** — `/cara-catat-pengeluaran-bulanan` (HowTo JSON-LD, sitemap, robots)

### Pro Lifetime (sekali bayar)

- **Peringatan budget** — Banner di dashboard saat budget total atau kategori mencapai 80% dan 100%. Notifikasi browser sekali per ambang batas per bulan bila diizinkan
- **Insight bulanan** — Di dashboard dan menu `/insight`: satu kalimat perbandingan pengeluaran sampai tanggal yang sama, plus kategori terbesar. Endpoint `GET /dashboard/monthly-insight` (403 jika bukan Pro). Kartu Pemberitahuan gratis disembunyikan untuk Pro/ADMIN
- **Target tabungan** (`/savings`) dan **transaksi otomatis** (`/recurring`)
- **Export PDF** dan **bagikan ringkasan** dari mobile (caption + OG image)
- **Splash panduan Pro** — sekali per akun setelah plan menjadi PRO (tanpa logout paksa)
- **Upgrade manual** — transfer bank + unggah bukti. Admin mendapat email saat bukti masuk; pembeli mendapat email saat disetujui atau ditolak. Admin menolak wajib memilih alasan: bukti kurang jelas, kode transfer salah, atau nominal/rekening salah

### Lainnya

- **Legal dinamis** — Syarat & Ketentuan / Privasi dikelola admin (`/terms`, `/privacy`)
- **Mobile offline** — Antrian transaksi saat offline, sync saat online
- **Admin** — Panel web (user, Pro, flags, traffic, activity, feedback, legal); masuk dari menu **Lainnya** di HP; layout kartu + form bertumpuk untuk layar sempit
- **Responsif** — Sidebar desktop + bottom nav mobile
- **Cadangan production** — dump Postgres + folder upload harian (lihat [docs/DEPLOY.md](./docs/DEPLOY.md))

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
- `SMTP_*` — email reset password dan notifikasi Pro (`SMTP_ENABLED=true`)
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

**Ops:** Docker Compose + Caddy (staging & production di VPS yang sama, DB terpisah)

## Changelog (ringkas)

### 1.1.0

- Popup ulang tahun; `/help` publik; polish Akun (tanpa pemilih mata uang; ganti password collapsible)
- Unggah struk mobile lebih andal; brand Dompet Tenang (ikon/OG)
- **Dihapus:** OCR/scan struk otomatis (Tesseract) — unggah struk tetap, isi form manual
- Auth tetap **manual** (email + password); Google SSO belum dipakai

### 1.0.0

- Rilis publik Dompet Tenang (Free + Pro Lifetime)

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
