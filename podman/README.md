# Konfigurasi Native Podman Canteeners

Folder ini berisi konfigurasi native Podman untuk menjalankan Canteeners tanpa memerlukan tool pihak ketiga seperti Podman-Compose.

## 🏛️ Filosofi Infrastruktur

### 1. Production (`podman/prod/`) - Berbasis Quadlets
Digunakan untuk menangani transaksi pesanan yang padat. Seluruh kontainer dikelola oleh `systemd` melalui **Quadlets**.
- **Ketersediaan Tinggi:** Otomatis restart jika crash atau server reboot.
- **Stabilitas:** Terintegrasi langsung dengan manajemen service OS.

**Cara Instalasi:**
```bash
cp podman/prod/quadlets/* ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable --now backend.service admin.service main.service
```

### 2. Staging (`podman/staging/`) - Berbasis Podman Pod
Digunakan untuk lingkungan pengujian yang hemat sumber daya (server spesifikasi rendah).
- **Efisiensi:** Menggabungkan semua layanan ke dalam satu unit Pod.
- **Overhead Rendah:** Meminimalisir beban CPU/RAM dengan berbagi jaringan `localhost`.

**Cara Jalankan:**
```bash
podman kube play podman/staging/pod.yaml
```

---

## 📊 Port Akses

| Service | Production (Host) | Staging (Host) |
| :--- | :--- | :--- |
| **Main App** | 3000 | 4000 |
| **Admin Panel** | 3001 | 4001 |
| **Backend API** | 3002 | 4002 |
| **Database** | 3003 | 4003 |
| **Redis** | 3004 | 4004 |

---

## 🛠️ Maintenance & Monitoring

### Melihat Log
- **Prod (Quadlet):** `journalctl --user -u backend.service -f`
- **Staging (Pod):** `podman pod logs -f canteeners-staging-pod`

### Update Manual
1. Pull image: `podman pull <image_name>`
2. Restart:
   - **Prod:** `systemctl --user restart backend.service`
   - **Staging:** `podman kube play podman/staging/pod.yaml`
