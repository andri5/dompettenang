# Distribusi Mobile Dompet Tenang (gratis)

| Jalur | Untuk siapa | Cara update |
|-------|-------------|-------------|
| **Website APK** | Publik | Install ulang APK dari situs |
| **Expo internal** | Tester | Link/QR build EAS |
| **EAS Update (OTA)** | User yang sudah install APK | Update JS otomatis tanpa install ulang |

URL publik APK:

```text
https://dompet-tenang.web.id/download/dompet-tenang.apk
```

---

## 1. Auto-upload APK ke server (disarankan)

Workflow: [`.github/workflows/publish-android-apk.yml`](../.github/workflows/publish-android-apk.yml)

Alur: **EAS build APK → download artifact → SCP ke VPS** → file muncul di `/download/dompet-tenang.apk`.

### Satu kali: secret GitHub

Repo → **Settings** → **Secrets and variables** → **Actions**:

| Secret | Isi |
|--------|-----|
| `EXPO_TOKEN` | Buat di https://expo.dev/settings/access-tokens (hak build) |
| `PROD_SSH_HOST` | sudah ada (deploy web) |
| `PROD_SSH_USER` | sudah ada |
| `PROD_SSH_KEY` | sudah ada |
| `PROD_SSH_PORT` | opsional (22) |
| `PROD_APP_DIR` | opsional, default `/opt/dompettenang` |

Pastikan folder downloads di VPS ada dan Caddy sudah mount `deploy/downloads` (sudah di compose).

### Kapan jalan otomatis

- **Push ke `main`** yang mengubah `apps/mobile/**` → build APK baru + upload  
- **Manual:** Actions → **Publish Android APK** → Run workflow  
  - `build-and-publish` — build EAS lalu upload (~15–40 menit)  
  - `publish-latest` — upload APK EAS terakhir tanpa build ulang (cepat)

Setelah hijau, cek:

```text
https://dompet-tenang.web.id/download/dompet-tenang.apk
```

Harus HTTP 200. User unduh dari landing **Download Android**.

---

## 2. Update “realtime” tanpa APK baru (OTA)

Kalau perubahan hanya JS/UI (bukan native/icon/permission), publish **EAS Update**:

```powershell
cd d:\duitdiary\apps\mobile
npx eas-cli update --channel production --message "fix: register keyboard"
```

APK yang sudah terpasang (build `release-prod-api`, channel `production`) akan menarik update saat dibuka (butuh jaringan). App menampilkan banner **“Ada pembaruan siap dipasang — Ketuk untuk sinkronkan fitur terbaru”**; user ketuk → app reload dengan fitur baru (tanpa install ulang).

**Perlu APK baru** jika: icon, permission, native module, `app.json` penting, atau versi major.

---

## 3. Expo internal (tester cepat)

```powershell
cd d:\duitdiary\apps\mobile
npm run build:apk:prod-api
```

Lalu buka https://expo.dev/accounts/andri5/projects/duitdiary/builds — install via QR/link.

---

## 4. Upload manual (cadangan)

```powershell
cd d:\duitdiary
$env:DEPLOY_HOST = "root@IP_VPS"
bash deploy/publish-apk.sh "PATH\ke\app-release.apk"
```

Atau `scp` ke `$APP_DIR/deploy/downloads/dompet-tenang.apk`.

---

## 5. Checklist

1. Secret `EXPO_TOKEN` terisi  
2. Merge/push perubahan mobile ke `main` **atau** Run **Publish Android APK**  
3. Tunggu workflow hijau  
4. Tes download di website  
5. Untuk patch JS kecil: `eas update --channel production` (tanpa rebuild APK)
