Implementasikan **BullMQ Worker** di dalam proyek NestJS saya ini untuk menangani antrean pekerjaan latar belakang (_background jobs_), khususnya untuk sistem pembatalan order otomatis yang terlambat dibayar (batas waktu 20 menit).

**Langkah-langkah Implementasi yang Saya Inginkan:**

1. **Instalasi Dependensi:**
   Berikan instruksi atau perintah untuk menginstal dependensi BullMQ pada NestJS (`@nestjs/bullmq`, `bullmq`).
2. **Konfigurasi Module:**
   Buatkan kode untuk mengonfigurasi `BullModule.forRoot()` di dalam `app.module.ts`. Gunakan variabel _environment_ untuk koneksi Redis (`REDIS_HOST`, `REDIS_PORT` dengan _fallback_ ke `localhost` dan `6379`).
3. **Buat Order Processor (Worker):**
   Buatkan satu _file_ _processor_ (misal: `order.processor.ts`) yang menggunakan dekorator `@Processor('order-queue')` dan meng-_extend_ `WorkerHost` dari `@nestjs/bullmq`.
4. **Logika Eksekusi Job (Fungsi `process`):**
   Di dalam _method_ `process`, implementasikan logika berikut untuk menangani nama _job_ `cancel-unpaid-order`:

- Ekstrak `orderId` dari muatan data (`job.data`).
- Lakukan instansiasi `PrismaClient` dan cari order tersebut di database.
- **KONDISI PENGAMAN (Penting):** Cek status order saat ini. Jika statusnya BUKAN `WAITING_PAYMENT` (artinya kustomer sudah bayar/upload bukti), maka batalkan eksekusi, berikan log peringatan yang menyatakan pesanan sudah aman, lalu hentikan fungsi (`return`).
- Jika statusnya masih `WAITING_PAYMENT`, lakukan `prisma.order.update` dengan data:
- `status: 'CANCELLED'`
- `cancelled_reason: 'Melewati batas waktu pembayaran 10 menit'`

- Tambahkan _console.log_ yang informatif di setiap tahapannya agar saya mudah melakukan _debugging_.

**Referensi Skema Prisma (sebagai panduan field dan enum):**

@prisma/schema/order.prisma

Tolong berikan kodenya secara lengkap, terstruktur, dan siap pakai.
