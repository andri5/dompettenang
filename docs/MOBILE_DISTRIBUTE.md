# Distribusi Mobile Dompet Tenang (gratis)

Dua jalur tanpa Play Store:

| Jalur | Untuk siapa | Biaya |
|-------|-------------|--------|
| **Expo internal** | Tester / kamu sendiri | Rp 0 |
| **Download di website** | Publik | Rp 0 |

---

## 1. Expo internal (tester)

Profile build: `release-prod-api` → `distribution: "internal"` (APK).

```powershell
cd d:\duitdiary\apps\mobile
npm run build:apk:prod-api
```

Setelah selesai:

1. Buka https://expo.dev/accounts/andri5/projects/duitdiary/builds  
2. Pilih build terbaru → **Install** / scan QR di HP Android  
3. Bagikan link build itu ke tester (mereka perlu akun Expo jika diminta, atau unduh APK dari halaman build)

Ini cocok untuk QA cepat. Link artifact Expo bisa kedaluwarsa setelah beberapa minggu — untuk publik pakai jalur website.

---

## 2. Download APK di website

URL publik:

```text
https://dompet-tenang.web.id/download/dompet-tenang.apk
```

Tombol **Download Android** ada di landing page (`#download`).

### Satu kali: pastikan folder downloads di VPS

Di server (path repo, sesuaikan):

```bash
mkdir -p /opt/duitdiary/deploy/downloads
# Caddy sudah mount ./downloads → /srv/downloads
cd /opt/duitdiary
docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.production up -d caddy
```

Kalau compose belum pernah di-recreate setelah perubahan Caddy/volume, jalankan ulang service `caddy` (atau full stack).

### Tiap rilis APK baru

**Opsi A — dari laptop (setelah download APK dari Expo):**

```powershell
cd d:\duitdiary
$env:DEPLOY_HOST = "root@43.133.135.215"   # ganti IP/user VPS kamu
bash deploy/publish-apk.sh "C:\Users\...\Downloads\app-release.apk"
```

**Opsi B — manual di VPS:**

```bash
# di VPS
scp ./dompet-tenang.apk root@VPS:/opt/duitdiary/deploy/downloads/dompet-tenang.apk
```

Lalu tes di browser/HP:

```text
https://dompet-tenang.web.id/download/dompet-tenang.apk
```

### Web deploy

Push perubahan landing + compose ke `main` agar tombol Download muncul di production (autodeploy). APK sendiri **tidak** ikut git — hanya diupload ke VPS.

---

## 3. Checklist rilis mobile (ringkas)

1. `npm run build:apk:prod-api`  
2. Tes install dari Expo (internal)  
3. Upload APK → `deploy/publish-apk.sh`  
4. Cek tombol Download di https://dompet-tenang.web.id/#download  

Play Store (berbayar) bisa ditambahkan nanti dengan profile EAS `production` (AAB).
