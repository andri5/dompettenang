# Distribusi Mobile (internal)

Landing page **tidak** menampilkan unduh APK publik. Pesan publik: **aplikasi mobile akan segera rilis**.

Dokumen ini hanya untuk **tim internal** (tester / EAS), bukan saluran user akhir.

## Saluran internal

| Saluran | Siapa | Keterangan |
|---------|--------|------------|
| **EAS Build / Expo** | Tim QA | Build Android/iOS lewat Expo |
| **EAS Update (OTA)** | Device yang sudah install build internal | Patch JS tanpa rebuild native |
| **VPS `/download/`** (opsional) | Internal saja | File APK di `deploy/downloads/` — **jangan** dipromosikan di landing |

## EAS (ringkas)

```bash
cd apps/mobile
eas build --platform android --profile production
eas update --channel production   # patch JS saja
```

Workflow opsional: [`.github/workflows/publish-android-apk.yml`](../.github/workflows/publish-android-apk.yml) — upload artifact ke VPS untuk tester internal.

## Kapan perlu APK baru vs OTA

- **OTA cukup:** ubah UI/logic JS di `apps/mobile`
- **Perlu rebuild APK:** native module, permission, icon, `app.json` penting

## Setelah mobile rilis publik

1. Update landing (CTA store / unduh resmi)
2. Update [DEV_WORKFLOW.md](./DEV_WORKFLOW.md) dan README
3. Putuskan apakah `/download/` tetap internal atau dihapus
