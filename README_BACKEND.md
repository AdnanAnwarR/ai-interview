# 🚀 Panduan Backend & API "Wawancarain"

Dokumentasi arsitektur backend, konfigurasi database, autentikasi, integrasi Claude API (@anthropic-ai/sdk), dan payment gateway Midtrans Snap.

---

## 🛠️ Persyaratan Lingkungan (Environment Variables)

Salin file `.env.example` ke `.env.local` di root proyek:

```bash
cp .env.example .env.local
```

Isi variabel utama:
- `DATABASE_URL`: URL PostgreSQL (Neon Serverless, Supabase, atau PostgreSQL lokal).
- `AUTH_SECRET`: Secret string acak minimal 32 karakter untuk Auth.js/NextAuth JWT.
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: Kredensial Google OAuth 2.0.
- `ANTHROPIC_API_KEY`: API key dari Anthropic Console.
- `ANTHROPIC_MODEL_INTERVIEW`: Model tanya jawab wawancara (default: `claude-haiku-5-5`).
- `ANTHROPIC_MODEL_EVALUATION`: Model evaluasi STAR akhir (default: `claude-sonnet-5-5`).
- `MIDTRANS_SERVER_KEY`: Server Key dari Midtrans Sandbox/Production.
- `MIDTRANS_CLIENT_KEY`: Client Key dari Midtrans.
- `MIDTRANS_IS_PRODUCTION`: `false` (untuk sandbox) atau `true` (untuk production).

---

## 📦 Setup Database & Seed Data

1. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

2. **Sinkronisasi Skema ke PostgreSQL:**
   ```bash
   npx prisma db push
   ```

3. **Jalankan Seed Data Awal:**
   ```bash
   npx tsx prisma/seed.ts
   ```
   *Skrip seed akan membuat akun kandidat contoh (`kandidat@wawancarain.id`), riwayat sesi wawancara, laporan evaluasi STAR, dan order contoh.*

---

## 🌐 Daftar Endpoint API Backend

### 1. Sesi Wawancara (`/api/interviews`)
- **`POST /api/interviews`**:
  - Validasi input dengan Zod (`company`, `position`, `level`, `style`, `totalQuestions`).
  - Verifikasi sesi login pengguna.
  - Membatasi 1 sesi `ACTIVE` per pengguna (durasi maks. 45 menit).
  - Mengurangi saldo kuota sesi secara atomik (`credits - 1`) jika bukan langganan aktif.
  - Mengambil dan menyimpan pesan sapaan pembuka dari Claude.
- **`GET /api/interviews`**: Mengambil riwayat sesi wawancara milik pengguna.
- **`GET /api/interviews/[id]`**: Mengambil detail sesi, daftar pesan percakapan, dan laporan evaluasi.

### 2. Percakapan Real-Time Streaming (`/api/interviews/[id]/chat`)
- **`POST /api/interviews/[id]/chat`**:
  - Menerima jawaban kandidat (maks. 2.000 karakter).
  - Menyusun transkrip riwayat percakapan dari database (bukan dari klien).
  - Memanggil Claude API dengan **streaming token-by-token** (`text/event-stream`).
  - Menyimpan balasan AI ke database setelah stream selesai.
  - Menghitung urutan pertanyaan (`questionIndex`) di server.

### 3. Evaluasi Akhir STAR (`/api/interviews/[id]/finish`)
- **`POST /api/interviews/[id]/finish`**:
  - Menandai status sesi menjadi `FINISHED`.
  - Mengirim seluruh transkrip ke Claude (`claude-sonnet-5-5`).
  - Menghasilkan evaluasi JSON terstruktur (nilai total 0–100, 5 rubrik grafik radar, analisis STAR Situation-Task-Action-Result per jawaban, dan contoh perbaikan).
  - Validasi ketat menggunakan Zod (otomatis dicoba ulang jika format tidak valid).
  - **Idempoten**: Jika sesi sudah pernah dinilai, mengembalikan data evaluasi yang sudah ada.

### 4. Midtrans Snap Payment (`/api/payments`)
- **`POST /api/payments/create`**:
  - Menerima `packageId` (`single_session`, `pack_5_sessions`, atau `unlimited_monthly`).
  - Menghitung harga secara aman di server dari `src/config/pricing.ts` (Rp5.000, Rp20.000, Rp25.000).
  - Membuat transaksi Midtrans Snap dan mengembalikan `snapToken`.
- **`POST /api/payments/notification` (Webhook):**
  - Menerima notifikasi server-to-server dari Midtrans.
  - Memvalidasi signature key:
    $$\text{signature\_key} = \text{SHA512}(\text{order\_id} + \text{status\_code} + \text{gross\_amount} + \text{ServerKey})$$
  - Menandai Order menjadi `PAID` dan menambahkan kredit / memperpanjang langganan secara atomik dalam satu transaksi database.
  - **Idempoten**: Tidak akan menduplikasi penambahan saldo jika notifikasi dikirim ulang.
- **`GET /api/payments/[orderId]/status`**:
  - Polling status pembayaran dari frontend setelah pengguna menyelesaikan pembayaran di popup Snap.

---

## 🧪 Cara Mengetes Webhook Midtrans di Sandbox

1. **Jalankan Aplikasi Lokal:**
   ```bash
   npm run dev
   ```

2. **Ekspos Port Lokal ke Internet (menggunakan ngrok):**
   ```bash
   ngrok http 3000
   ```
   Salin URL HTTPS ngrok yang didapat, contoh: `https://abcd-1234.ngrok-free.app`.

3. **Atur Notification URL di Midtrans Sandbox:**
   - Buka **Midtrans Dashboard Sandbox** -> *Settings* -> *Configuration*.
   - Isi **Payment Notification URL** dengan:
     `https://abcd-1234.ngrok-free.app/api/payments/notification`

4. **Uji Notifikasi Webhook Manual dengan cURL:**
   ```bash
   curl -X POST http://localhost:3000/api/payments/notification \
     -H "Content-Type: application/json" \
     -d '{
       "order_id": "ORDER-1731800000-ABCDE",
       "status_code": "200",
       "gross_amount": "20000.00",
       "signature_key": "dummy_signature_or_computed_sha512",
       "transaction_status": "settlement",
       "fraud_status": "accept"
     }'
   ```
   Sistem akan secara otomatis memverifikasi, mengubah status order menjadi `PAID`, dan menambahkan 5 sesi latihan ke akun kandidat secara idempoten.
