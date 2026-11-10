# Dompet Tenang Web

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

- Daftar singkat (nama, email, password), pencarian transaksi, saldo berjalan, pengingat catatan harian
- Satu kartu **Pemberitahuan** di dashboard (bukan insight Pro)
- **Struk + OCR** — foto/PDF; gambar dikompres di HP, unggah dulu lalu OCR mengisi nominal/tanggal/keterangan bila berhasil
- Halaman bantuan `/help`
- Halaman publik SEO `/cara-catat-pengeluaran-bulanan` (panduan + CTA daftar)

**Pro**

- `/upgrade`, `/insight`, dashboard (peringatan budget 80%/100% + insight bulanan satu kalimat; tanpa kartu Pemberitahuan)
- Tabungan, transaksi otomatis, export PDF / bagikan ringkasan

**Admin**

- Buka dari menu **Lainnya** di HP
- Daftar user/activity/feedback dan form edit/Pro/legal disusun vertikal di layar sempit
