# File Manager API Specification

## 1. Upload File
Mengunggah file ke server dan menyimpannya di direktori `uploads/`.

- **URL:** `/files/upload`
- **Method:** `POST`
- **Content-Type:** `multipart/form-data`

### Request Body
| Field | Tipe | Wajib | Deskripsi |
| :--- | :--- | :--- | :--- |
| `file` | Binary | Ya | File yang akan diunggah (Maks 10MB). |
| `path` | String | Tidak | Sub-folder tujuan di dalam `/uploads` (contoh: `avatar`, `product`). |

### Response Sukses
- **Status Code:** `201 Created`
- **Body:**
```json
{
  "message": "Upload berhasil",
  "data": {
    "filename": "file-1714734892000-987654321.jpg",
    "url": "/uploads/avatar/file-1714734892000-987654321.jpg",
    "mimetype": "image/jpeg",
    "size": 102400
  }
}
```

### Response Error
| Status Code | Kondisi | Pesan |
| :--- | :--- | :--- |
| `400 Bad Request` | Ukuran file > 10MB | `Validation failed (expected size is less than 10485760)` |
| `400 Bad Request` | File tidak disertakan | `File is required` |
| `500 Internal Error`| Gagal menulis file | `Internal server error` |

---

## 2. Delete File
Menghapus file yang telah diunggah berdasarkan nama filenya.

- **URL:** `/files/:filename`
- **Method:** `DELETE`

### URL Parameters
| Parameter | Tipe | Deskripsi |
| :--- | :--- | :--- |
| `filename` | String | Nama file lengkap yang akan dihapus (termasuk ekstensi). |

### Response Sukses
- **Status Code:** `200 OK`
- **Body:**
```json
{
  "message": "File berhasil dihapus"
}
```

---

### Informasi Tambahan
- **Batas Ukuran:** Maksimum 10 MB per file.
- **Akses Publik:** File dapat diakses melalui prefix `/uploads/`. Contoh: `http://localhost:3002/uploads/avatar/file.jpg`.
- **Folder Otomatis:** Sistem akan membuat sub-folder secara rekursif jika parameter `path` yang diberikan belum tersedia di direktori `uploads/`.
