# Dompet Tenang Web

Frontend React + Vite + TypeScript + Tailwind.

Setup, fitur Free/Pro, dan deploy ada di [README root](../../README.md) dan [docs/DEPLOY.md](../../docs/DEPLOY.md).

```bash
# dari root monorepo
npm install
npm run web
```

App lokal: http://127.0.0.1:5173/ — API lewat `VITE_API_URL=/api/v1`.

Gratis di web: daftar singkat (nama, email, password), pencarian transaksi, saldo berjalan, pengingat catatan harian, dan satu kartu **Pemberitahuan** di dashboard.

Halaman publik: `/cara-catat-pengeluaran-bulanan` (panduan + CTA daftar).

Halaman Pro: `/upgrade`, `/insight`, dashboard (peringatan budget 80%/100% + insight bulanan satu kalimat; tanpa kartu Pemberitahuan).

Admin: buka dari menu **Lainnya** di HP. Daftar user/activity dan form edit/Pro/legal disusun vertikal di layar sempit.
