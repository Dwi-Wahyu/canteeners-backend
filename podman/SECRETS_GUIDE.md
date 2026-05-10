# Panduan Pengelolaan GitHub Secrets & Automation

Dokumen ini menjelaskan daftar rahasia (secrets) yang diperlukan untuk CI/CD dan cara mengirimnya secara massal menggunakan GitHub CLI (`gh`).

## 1. Daftar Secrets yang Diperlukan

### A. Secrets Infrastruktur (Wajib untuk semua Repo)
Rahasia ini diperlukan agar GitHub Actions dapat melakukan Build, Push, dan SSH ke server.

| Nama Secret | Deskripsi |
| :--- | :--- |
| `GHCR_TOKEN` | Personal Access Token (PAT) dengan izin `write:packages`. |
| `SERVER_IP` | Alamat IP VPS Anda. |
| `SERVER_USER` | Username SSH (contoh: `ubuntu` atau `root`). |
| `SERVER_SSH_KEY` | Isi Private Key SSH Anda (`id_rsa` atau `.pem`). |

### B. Secrets Aplikasi (Build-Args untuk Admin & Main)
Variabel ini bersifat **Build-Time**. Next.js memerlukannya saat proses kompilasi agar nilai `NEXT_PUBLIC_*` tersedia di browser.

*   `NEXT_PUBLIC_FIREBASE_API_KEY`
*   `NEXT_PUBLIC_FIREBASE_APP_ID`
*   `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
*   `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
*   `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
*   `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
*   `NEXT_PUBLIC_BACKEND_URL`
*   `NEXTAUTH_URL`

---

## 2. Cara Bulk Send Menggunakan GitHub CLI (`gh`)

Gunakan script ini untuk mengirim seluruh secret ke tiga repositori sekaligus tanpa perlu input manual di browser satu per satu.

### Langkah 1: Siapkan File Secret
Buat file bernama `secrets.env` (JANGAN di-commit ke Git).
```bash
# Contoh isi secrets.env
GHCR_TOKEN=ghp_xxxxxx
SERVER_IP=123.123.123.123
SERVER_USER=ubuntu
SERVER_SSH_KEY="-----BEGIN OPENSSH PRIVATE KEY-----..."
NEXT_PUBLIC_BACKEND_URL=https://backend.canteeners.com
# ... masukkan semua variabel dari daftar di atas
```

### Langkah 2: Jalankan Script Bulk Send
Buka terminal di folder root project dan jalankan perintah berikut:

```bash
# Daftar repository tujuan
REPOS=("dwi-wahyu/canteeners-backend" "dwi-wahyu/canteeners-admin" "dwi-wahyu/canteeners-main")

for REPO in "${REPOS[@]}"; do
  echo "----------------------------------------"
  echo "🚀 Mengirim secrets ke $REPO..."
  gh secret set -f secrets.env -R $REPO
  echo "✅ Selesai."
done
```

---

## 3. Catatan Penting Mengenai `.env`

### Mengapa `.env` lama Anda sering tidak terbaca?
1.  **Next.js Isolation:** Variabel `NEXT_PUBLIC_` dibakar (hardcoded) ke dalam file `.js` saat perintah `next build` dijalankan. Jika variabel ini tidak ada di GitHub Secrets saat build di GitHub Actions, maka aplikasi di server akan terbaca `undefined`.
2.  **Podman/Docker Context:** Kontainer adalah lingkungan terisolasi. Ia tidak tahu adanya file `.env` di luar (di folder VPS) kecuali kita melakukan *mount* atau memasukkannya ke konfigurasi runtime.

### Solusi pada Konfigurasi Baru:
*   **Build-Time:** Rahasia aplikasi dimasukkan via `build-args` di Workflow YAML.
*   **Runtime:** Variabel sensitif seperti `DATABASE_URL` atau `FIREBASE_PRIVATE_KEY` telah saya masukkan ke dalam file **Quadlet (`.container`)** di `podman/prod/quadlets/` dan **Pod YAML** di `podman/staging/pod.yaml`.

---

## 4. Persiapan VPS (Sekali Saja)

Sebelum menjalankan deployment pertama dari GitHub Actions, Anda harus memberikan izin akses ke VPS:

```bash
# Login ke GitHub Container Registry di VPS agar Podman bisa menarik image private
echo $YOUR_GHCR_TOKEN | podman login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```
