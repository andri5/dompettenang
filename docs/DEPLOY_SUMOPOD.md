# Deploy Dompet Tenang ke Sumopod (VPS)

Panduan lengkap: **cara daftar & bayar Sumopod**, beli domain, setup VPS, lalu jalankan stack Docker di repo ini.

Stack production (sudah disiapkan di folder [`deploy/`](../deploy/)):

| Service | Peran |
|---------|--------|
| **Caddy** | HTTPS (Let’s Encrypt) + reverse proxy |
| **web** | Frontend Vite (static via Nginx) |
| **api** | Express + Prisma |
| **postgres** | Database |

Browser memakai **same-origin**: `https://DOMAIN/api/v1` → API, sehingga cookie login web tetap aman (`SameSite=Lax`).

---

## 1. Breakdown biaya (perkiraan)

Angka bersifat **perkiraan** — selalu cek harga live di dashboard Sumopod / registrar.

| Item | Kisaran | Frekuensi | Keterangan |
|------|---------|-----------|------------|
| Domain `.id` / `.com` | Rp 150.000 – 300.000 | /tahun | Cloudflare, Niagahoster, Rumahweb, dll. |
| VPS Sumopod 2 vCPU / 2 GB | ~Rp 36.000 – 60.000 | /bulan | Cukup untuk MVP Dompet Tenang |
| VPS 2 vCPU / 4 GB (opsional) | ~Rp 85.000 – 90.000 | /bulan | Jika RAM ketat |
| Turnstile Cloudflare | Rp 0 | — | Tier gratis |
| SMTP Gmail App Password | Rp 0 | — | Pakai akun Gmail + App Password |
| SSL Let’s Encrypt | Rp 0 | — | Otomatis via Caddy |

**Contoh bulan pertama (kasar):**

- Domain (prorata / bayar tahunan): ~Rp 200.000  
- VPS 1 bulan: ~Rp 50.000  
- **Total start:** ± Rp 250.000  

**Bulan berikutnya:** biasanya hanya VPS (~Rp 50rb) sampai domain perlu diperpanjang.

> Sumopod menagih dalam **IDR**. Harga VPS bisa berubah; lihat [sumopod.com](https://sumopod.com) → dashboard → Create VPS.

---

## 2. Cara daftar & bayar Sumopod

### 2.1 Buat akun

1. Buka [https://sumopod.com](https://sumopod.com)
2. Klik **Get started** / daftar
3. Verifikasi email jika diminta
4. Login ke **Dashboard**

### 2.2 Top-up / pembayaran (breakdown)

Sumopod memakai **saldo prepaid (Balance)** dalam **Rupiah**. Alur tipikal:

```text
Daftar akun → Top-up Balance → Saldo masuk → Create VPS (saldo terpotong per bulan)
```

**Langkah bayar:**

1. Login [sumopod.com](https://sumopod.com) → **Dashboard**
2. Buka menu pembayaran / saldo — sering bernama **Cloud Payments**, **Billing**, atau **Wallet / Top Up**  
   (nama menu bisa berubah; cari kata *payment* / *top up* / *balance*)
3. Pilih nominal top-up (sarankan cukup **1–3 bulan VPS**, mis. Rp 100.000 – 200.000 dulu)
4. Pilih metode di checkout. Yang sering tersedia untuk user Indonesia: **QRIS** (scan dari mobile banking / e-wallet). Metode lain muncul jika Sumopod mengaktifkannya di akunmu.
5. Bayar → tunggu status sukses → **Balance** bertambah
6. Baru buat VPS; biaya VPS dipotong dari Balance

**Contoh hitungan top-up pertama:**

| Kebutuhan | Perkiraan |
|-----------|-----------|
| VPS 2GB × 1 bulan | ~Rp 50.000 |
| Buffer 1 bulan lagi | ~Rp 50.000 |
| **Top-up disarankan** | **Rp 100.000 – 150.000** |

Domain dibeli **terpisah** di registrar (bukan wajib lewat Sumopod).

**Penting (dari kebijakan Sumopod):**

- Balance bersifat **prepaid** — **tidak bisa ditarik** ke rekening / refund setelah top-up
- Top-up hanya untuk beli layanan Sumopod (VPS, dll.)
- Jangan top-up berlebihan di awal; mulai kecil dulu

**Tips:**

- Simpan screenshot / bukti QRIS
- Cek email invoice
- Kalau metode bayar tidak muncul: email **support@sumopod.com**
- Jangan share password dashboard

### 2.3 Buat VPS (rekomendasi Dompet Tenang)

1. Dashboard → **Infrastructure** → **VPS** → **Create VPS**  
   (langsung: [https://sumopod.com/dashboard/vps/create](https://sumopod.com/dashboard/vps/create))
2. Isi:
   - **Name:** `dompettenang-prod`
   - **Region:** **Indonesia / Jakarta**
   - **OS:** **Ubuntu Server 24.04 LTS**
   - **Plan:** min **2 vCPU / 2 GB RAM / ~40 GB disk**
3. Setuju syarat (larangan VPN mining torrent dll.)
4. Tunggu provisioning → status **Active**
5. Catat:
   - **IP publik**
   - **Username** (biasanya `ubuntu` / `root`)
   - **Password** awal (segera ganti / pindah ke SSH key)

---

## 3. Beli & arahkan domain

1. Beli domain (contoh `dompettenang.id`) di registrar pilihanmu
2. Di DNS domain, buat record:

| Type | Name | Value |
|------|------|--------|
| A | `@` | `IP_VPS_SUMOPOD` |
| A | `www` | `IP_VPS_SUMOPOD` |

3. Tunggu propagate (bisa 5 menit – beberapa jam)
4. Tes: `ping dompettenang.id` harus mengarah ke IP VPS

Caddy akan otomatis ambil sertifikat SSL setelah port 80/443 terbuka dan DNS sudah benar.

---

## 4. Setup awal VPS (SSH)

Dari laptop:

```bash
ssh root@IP_VPS
# atau: ssh ubuntu@IP_VPS
```

Jalankan:

```bash
apt update && apt upgrade -y
apt install -y ca-certificates curl git ufw

# Firewall
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Docker
curl -fsSL https://get.docker.com | sh
systemctl enable --now docker

# User non-root (opsional tapi disarankan)
adduser deploy
usermod -aG docker deploy
usermod -aG sudo deploy
```

Clone repo (pakai URL GitHub kamu):

```bash
mkdir -p /opt && cd /opt
git clone https://github.com/andri5/duitdiary.git dompettenang
cd dompettenang
git checkout feature/testing-qa   # atau main setelah merge
```

---

## 5. Konfigurasi env production

```bash
cd /opt/dompettenang
cp deploy/.env.production.example deploy/.env.production
nano deploy/.env.production
```

Wajib diisi:

- `DOMAIN` — contoh `dompettenang.id` (tanpa `https://`)
- `POSTGRES_PASSWORD` — password kuat
- `JWT_SECRET` / `JWT_REFRESH_SECRET` — generate:

```bash
openssl rand -base64 48
```

- `CORS_ORIGIN` / `APP_URL` — `https://dompettenang.id`
- `SMTP_*` — App Password Gmail (bukan password biasa)
- `TURNSTILE_*` — key production dari Cloudflare Turnstile

Jangan commit file `deploy/.env.production`.

---

## 6. Jalankan stack

```bash
cd /opt/dompettenang
docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.production up -d --build
```

Cek status:

```bash
docker compose -f deploy/docker-compose.prod.yml ps
docker compose -f deploy/docker-compose.prod.yml logs -f api
```

Tes:

- `https://DOMAIN/` — web
- `https://DOMAIN/api/v1/health` — API (sesuaikan path health jika berbeda)
- Register / login / catat transaksi / upload

Update kode nanti:

```bash
cd /opt/dompettenang
git pull
docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.production up -d --build
```

---

## 7. Backup database (wajib)

Contoh dump harian:

```bash
docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.production \
  exec -T postgres pg_dump -U dompet dompettenang > /root/backup-$(date +%F).sql
```

Simpan file `.sql` ke luar VPS (Google Drive / Object Storage). VPS murah **tidak** punya HA otomatis.

---

## 8. Checklist go-live

- [ ] Akun Sumopod + saldo / invoice lunas
- [ ] VPS Jakarta Active + IP dicatat
- [ ] Domain A record ke IP VPS
- [ ] `deploy/.env.production` lengkap (JWT + DB + SMTP)
- [ ] `docker compose ... up -d --build` sukses
- [ ] HTTPS hijau di browser
- [ ] Login web (cookie) jalan
- [ ] Forgot password kirim email
- [ ] Upload avatar/struk persist setelah restart container
- [ ] Backup DB dijadwalkan

---

## 9. Troubleshooting singkat

| Gejala | Cek |
|--------|-----|
| SSL gagal | DNS sudah ke IP? Port 80/443 open di UFW? |
| 502 Bad Gateway | `docker compose logs api` / `web` |
| Login gagal CORS | `CORS_ORIGIN` harus `https://DOMAIN` sama dengan URL browser |
| DB error | `POSTGRES_PASSWORD` / `DATABASE_URL` / health postgres |
| Upload hilang | pastikan volume `uploads_data` ada di compose |

Support Sumopod: `support@sumopod.com` (lihat juga kontak di situs).

---

## 10. Autodeploy production (GitHub Actions + SSH)

Setelah VPS jalan manual sekali, production bisa di-update otomatis:

```text
Merge/push ke main → GitHub Actions → SSH VPS → git pull + docker compose up --build
```

Branch `feature/*` **tidak** auto-deploy. Hanya **`main`** (atau `master`) + tombol **Run workflow** manual.

Workflow: [`.github/workflows/deploy-production.yml`](../.github/workflows/deploy-production.yml)  
Script VPS: [`deploy/remote-deploy.sh`](../deploy/remote-deploy.sh)

### 10.1 Setup SSH deploy key (sekali)

Di laptop (generate key khusus CI, jangan pakai password login harian):

```bash
ssh-keygen -t ed25519 -C "github-actions-dompettenang-prod" -f ./dompettenang-prod-deploy -N ""
```

Akan ada:
- `dompettenang-prod-deploy` → **private** (masuk GitHub Secret)
- `dompettenang-prod-deploy.pub` → **public** (pasang di VPS)

Di VPS (sebagai root):

```bash
# Rekomendasi: deploy sebagai root (sederhana untuk docker compose)
mkdir -p /root/.ssh
chmod 700 /root/.ssh
echo "ISI_ISI_PUBLIC_KEY_SATU_BARIS" >> /root/.ssh/authorized_keys
chmod 600 /root/.ssh/authorized_keys

# Pastikan repo di main
cd /opt/dompettenang
git fetch origin
git checkout main || git checkout -b main origin/main
git pull --ff-only origin main
chmod +x deploy/remote-deploy.sh
```

Tes dari laptop:

```bash
ssh -i ./dompettenang-prod-deploy root@43.133.135.215 'cd /opt/dompettenang && git status'
```

### 10.2 GitHub Secrets

Repo GitHub → **Settings** → **Secrets and variables** → **Actions**  
(atau Environment **production** — disarankan):

| Secret | Contoh nilai |
|--------|----------------|
| `PROD_SSH_HOST` | `43.133.135.215` |
| `PROD_SSH_USER` | `root` |
| `PROD_SSH_KEY` | isi penuh file private key (`-----BEGIN OPENSSH PRIVATE KEY-----` …) |
| `PROD_SSH_PORT` | `22` (opsional; default 22) |

Jangan commit private key ke git. Hapus file lokal setelah secrets tersimpan jika perlu.

Opsional aman: Environment `production` → **Required reviewers** sebelum deploy.

### 10.3 Alur kerja harian

1. Push ke `feature/...`
2. Buka PR ke `main`, tunggu CI hijau
3. Merge ke `main` → workflow **Deploy to Production** jalan otomatis
4. Atau **Actions** → **Deploy to Production** → **Run workflow**

### 10.4 Troubleshooting autodeploy

| Gejala | Cek |
|--------|-----|
| Permission denied (publickey) | Public key di `authorized_keys`, secret `PROD_SSH_KEY` lengkap |
| Host key verification failed | Step `ssh-keyscan` / IP berubah |
| docker: permission denied | Pakai `PROD_SSH_USER=root` atau user di group `docker` |
| Health check gagal | DNS/SSL; `docker compose ... logs api` di VPS |
| ff-only pull gagal | Jangan commit lokal di VPS; `git status` harus clean |

---

## File terkait di repo

- [`deploy/docker-compose.prod.yml`](../deploy/docker-compose.prod.yml)
- [`deploy/Caddyfile`](../deploy/Caddyfile)
- [`deploy/.env.production.example`](../deploy/.env.production.example)
- [`deploy/remote-deploy.sh`](../deploy/remote-deploy.sh)
- [`.github/workflows/deploy-production.yml`](../.github/workflows/deploy-production.yml)
- [`apps/api/Dockerfile`](../apps/api/Dockerfile)
- [`apps/web/Dockerfile`](../apps/web/Dockerfile)
