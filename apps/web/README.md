# Dompet Tenang Web

**Versi: 1.1.0**

Frontend React + Vite + TypeScript + Tailwind.

Setup, fitur Free/Pro, dan deploy ada di [README root](../../README.md) dan [docs/DEPLOY.md](../../docs/DEPLOY.md).

```bash
# dari root monorepo
npm install
npm run web
```

App lokal: http://127.0.0.1:5173/ — API lewat `VITE_API_URL=/api/v1`.

### Fitur utama (web)

**Gratis**

- Daftar/masuk **manual** (email + password) — belum ada Google SSO
- Pencarian transaksi, saldo berjalan, pengingat catatan harian
- Satu kartu **Pemberitahuan** di dashboard (bukan insight Pro)
- **Struk** — unggah foto/PDF (kompres di HP); **tanpa OCR**; isi nominal/tanggal manual
- `/help` publik dari landing; popup ulang tahun sekali per tahun
- Akun: tema, profil, ganti password collapsible (tanpa pemilih mata uang)
- Halaman publik SEO `/cara-catat-pengeluaran-bulanan` (panduan + CTA daftar)

**Pro**

- `/upgrade`, `/insight`, dashboard (peringatan budget 80%/100% + insight bulanan satu kalimat; tanpa kartu Pemberitahuan)
- Tabungan, transaksi otomatis, export PDF / bagikan ringkasan

**Admin**

- Buka dari menu **Lainnya** di HP
- Daftar user/activity/feedback dan form edit/Pro/legal disusun vertikal di layar sempit
