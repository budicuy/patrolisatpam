# 🛡️ Patroli Satpam - Security Patrol Management System

Sistem manajemen dan monitoring patroli keamanan (satpam) berbasis web modern & responsif (PWA-ready). Dilengkapi dengan validasi lokasi titik pos berbasis GPS geofencing, peta OpenStreetMap, unggah foto bukti patroli langsung ke Cloud Object Storage (S3-compatible), pelacakan giliran shift, pencatatan insiden/status keamanan, rekapitulasi analitik, serta ekspor laporan ke format PDF dan Excel.

---

## 📑 Daftar Isi

- [Tech Stack](#-tech-stack)
- [Prasyarat Sistem (Yang Perlu Di-install)](#-prasyarat-sistem-yang-perlu-di-install)
- [Struktur Direktori Proyek](#-struktur-direktori-proyek)
- [Langkah Setup Proyek](#-langkah-setup-proyek)
- [Konfigurasi Environment (.env)](#-konfigurasi-environment-env)
- [Setting Database](#-setting-database)
- [Menjalankan Aplikasi](#-menjalankan-aplikasi)
- [Hak Akses & Role Pengguna](#-hak-akses--role-pengguna)
- [Catatan & Troubleshooting](#-catatan--troubleshooting)

---

## 🛠️ Tech Stack

Aplikasi ini dibangun menggunakan arsitektur modern:

| Komponen | Teknologi | Keterangan |
| :--- | :--- | :--- |
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, Server Actions) | React 19, TypeScript 5 |
| **Styling & UI** | [Tailwind CSS v4](https://tailwindcss.com/), Radix UI Primitives, Lucide Icons | Desain responsif (Mobile First untuk satpam, Desktop untuk admin) |
| **Database** | [PostgreSQL](https://www.postgresql.org/) | Didukung oleh Neon Serverless / PostgreSQL lokal / Supabase |
| **ORM & Migrations** | [Drizzle ORM](https://orm.drizzle.team/) & `drizzle-kit` | Type-safe query builder & auto migration |
| **Autentikasi** | [NextAuth.js v5 (Auth.js)](https://authjs.dev/) | Session via Secure JWT Cookie, hash password dengan `bcryptjs` |
| **Peta & Geolokasi** | [OpenStreetMap (OSM)](https://www.openstreetmap.org/), [Leaflet](https://leafletjs.com/), `react-leaflet`, `geolib` | Validasi koordinat GPS radius pos patroli (Bebas API Key) |
| **Object Storage** | [AWS SDK S3 Client v3](https://aws.amazon.com/sdk-for-javascript/) | Kompatibel dengan AWS S3, Cloudflare R2, Neon Storage, MinIO |
| **Laporan & Ekspor** | `jspdf`, `jspdf-autotable`, `xlsx` (SheetJS) | Cetak laporan patroli otomatis (PDF/Excel) |
| **Visualisasi Data** | `recharts` | Grafik tren dan performa patroli di Dashboard Admin |
| **Linter & Formatter** | [Biome JS](https://biomejs.dev/) | Linter & formatter berkecepatan tinggi |
| **Package Manager** | [Bun](https://bun.sh/) *(Rekomendasi)* / Node.js (`npm` / `pnpm`) | Bun digunakan sebagai runtime & package manager utama |

---

## 💻 Prasyarat Sistem (Yang Perlu Di-install)

Sebelum menjalankan aplikasi di komputer lokal atau server staf, pastikan perangkat lunak berikut telah terinstal:

1. **Git**
   - Untuk clone dan manajemen source code repository.
   - Unduh: [git-scm.com](https://git-scm.com/)

2. **Runtime & Package Manager (Pilih Salah Satu)**:
   - **Bun** *(Sangat Direkomendasikan, versi 1.2+)*:
     - Install di Windows (PowerShell):
       ```powershell
       powershell -c "irm bun.sh/install.ps1 | iex"
       ```
     - Install di macOS/Linux:
       ```bash
       curl -fsSL https://bun.sh/install | bash
       ```
   - *ATAU* **Node.js (LTS v20 atau v22+)**:
     - Unduh: [nodejs.org](https://nodejs.org/)

3. **Database PostgreSQL**:
   - **Opsi Cloud (Paling Direkomendasikan & Cepat):** Menggunakan akun cloud database yang sudah aktif (misal: [Neon.tech](https://neon.tech/) atau [Supabase](https://supabase.com/)).
   - **Opsi Lokal (Jika ingin database offline di laptop):** Install PostgreSQL di komputer lokal (port `5432`) atau via Docker:
     ```bash
     docker run --name postgres-patroli -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=patrolisatpam -p 5432:5432 -d postgres:16
     ```

4. **Object Storage (S3-compatible)**:
   - Digunakan untuk menampung file upload foto absensi & bukti patroli.
   - Kredensial endpoint, access key, dan secret key didapatkan dari layanan S3 (AWS S3 / Cloudflare R2 / Neon Object Storage).

5. **Code Editor**:
   - Visual Studio Code / Cursor dengan ekstensi *Tailwind CSS IntelliSense* dan *Biome*.

---

## 📁 Struktur Direktori Proyek

```text
patrolisatpam/
├── app/
│   ├── actions/               # Server Actions (CRUD patroli, shift, lokasi, analitik, users)
│   ├── admin/                 # Modul antarmuka Administrator & HR
│   │   ├── dashboard/         # Dashboard grafik statistik & ringkasan patroli
│   │   ├── history/           # Riwayat lengkap patroli & ekspor PDF/Excel
│   │   ├── locations/         # Master data titik pos patroli & radius GPS
│   │   ├── shifts/            # Master data jam kerja (Shift)
│   │   └── users/             # Master data akun satpam, admin, & HR
│   ├── api/                   # API Routes (NextAuth handlers, proxy streaming foto S3)
│   ├── login/                 # Halaman antarmuka login
│   └── patrol/                # Antarmuka lapangan satpam (PWA check-in pos + GPS + foto)
├── backups/                   # File dump SQL data awal & backup database
├── components/                # Komponen UI global (Navbar, Button, Modal, Card, dsb.)
├── lib/
│   ├── auth.ts                # Konfigurasi NextAuth.js v5 & verifikasi role
│   ├── db.ts                  # Koneksi database pool postgres & Drizzle ORM
│   ├── s3.ts                  # Helper upload, fetch stream, & presigned URL S3
│   ├── schema.ts              # Definisi skema tabel database (Drizzle)
│   └── export-utils.ts        # Helper generasi file PDF & Excel
├── drizzle.config.ts          # Konfigurasi drizzle-kit CLI
├── middleware.ts              # Route protection & role-based access control
├── seed.ts                    # Script auto-seeding data dari file backup SQL
├── .env.example               # Template environment variables
└── package.json               # Konfigurasi dependencies & script npm/bun
```

---

## 🚀 Langkah Setup Proyek

### 1. Salin / Clone Proyek
Buka terminal dan arahkan ke folder yang diinginkan:
```bash
git clone <URL_REPOSITORY_ANDA>
cd patrolisatpam
```

### 2. Install Dependencies
Jalankan instalasi paket dependensi:
```bash
# Menggunakan Bun (direkomendasikan)
bun install

# ATAU menggunakan npm
npm install
```

### 3. Buat File Konfigurasi Environment (`.env`)
Salin file template `.env.example` menjadi `.env`:
```bash
# Windows PowerShell
copy .env.example .env

# Linux / macOS / Bash
cp .env.example .env
```

---

## ⚙️ Konfigurasi Environment (.env)

Buka file `.env` di text editor dan sesuaikan isinya:

```env
# ==========================================
# 1. DATABASE POSTGRESQL
# ==========================================
# Ganti dengan connection string PostgreSQL Anda
# Format: postgresql://<user>:<password>@<host>:<port>/<dbname>?sslmode=require
DATABASE_URL="postgresql://neondb_owner:password@ep-xyz.neon.tech/neondb?sslmode=require"

# ==========================================
# 2. AUTHENTICATION (NextAuth.js v5)
# ==========================================
# Kunci rahasia untuk enkripsi token session JWT
# Anda bisa generate key acak baru dengan menjalankan perintah:
# bunx auth secret  (atau: openssl rand -base64 32)
AUTH_SECRET="cT2m9wwVr7dXKarxNboeOWBA/m90mE5sJN+XnQNAkk0="

# ==========================================
# 3. PENYIMPANAN FOTO BUKTI PATROLI (S3 / R2 / Neon)
# ==========================================
AWS_ENDPOINT_URL_S3="https://endpoint-s3-anda.com"
AWS_ACCESS_KEY_ID="your_access_key_id"
AWS_SECRET_ACCESS_KEY="your_secret_access_key"
AWS_REGION="ap-southeast-1"
AWS_BUCKET_NAME="uploads"
```

---

## 🗄️ Setting Database

Silakan ikuti skenario yang sesuai dengan kebutuhan Anda:

### Skenario 1: Menghubungkan ke Database yang Sudah Ada (Paling Umum)
> [!IMPORTANT]
> Jika staf Anda melanjutkan proyek dengan database yang **sudah aktif / sudah berisi data operasional**:
> 1. Cukup masukkan `DATABASE_URL` yang diberikan ke file `.env`.
> 2. **JANGAN jalankan perintah migrasi atau seeding apapun.**
> 3. Langsung jalankan aplikasi dengan `bun run dev` (atau `npm run dev`).

---

### Skenario 2: Inisialisasi Database Baru dari File Backup Data
Jika staf membuat database PostgreSQL baru dan ingin mengisinya dengan data master serta riwayat patroli awal:

```bash
# Menggunakan Bun
bun run db:seed

# ATAU menggunakan npm
npm run db:seed
```
*Script ini otomatis membaca file SQL dari folder `backups/`, membuat tabel-tabel yang diperlukan, sequence, dan memasukkan seluruh data awal.*

---

### Skenario 3: Sinkronisasi Skema Kosong Baru (Tanpa Data Lama)
Jika staf membuat database PostgreSQL baru yang benar-benar bersih dan ingin membuat struktur tabel dari awal:

```bash
# Menggunakan Bun
bun run db:push

# ATAU menggunakan npm
npm run db:push
```
*Drizzle Kit akan membaca skema dari `lib/schema.ts` dan otomatis membuat tabel-tabel di database PostgreSQL Anda.*

---

## 🏃 Menjalankan Aplikasi

### Mode Pengembangan (Development)
Jalankan server development lokal:

```bash
# Menggunakan Bun
bun run dev

# ATAU menggunakan npm
npm run dev
```
Buka browser di alamat: **[http://localhost:3000](http://localhost:3000)**.

### Mode Produksi (Production Build)
Untuk build dan menjalankan aplikasi pada server/VPS produksi:

```bash
# 1. Build aplikasi
bun run build    # atau: npm run build

# 2. Jalankan server produksi
bun run start    # atau: npm run start
```

### Script Tambahan
- `bun run lint` : Menjalankan linter Biome untuk mendeteksi error kode.
- `bun run format` : Memformat kode secara otomatis sesuai standar proyek.

---

## 👥 Hak Akses & Role Pengguna

Aplikasi memiliki proteksi rute (`middleware.ts`) berdasarkan 3 tingkatan peran (role):

1. **`admin`**
   - Akses penuh ke seluruh menu Admin (`/admin/*`):
     - Dashboard statistik dan monitoring patroli real-time.
     - Riwayat patroli & unduh laporan (PDF & Excel).
     - Manajemen master Titik Pos Patroli & radius koordinat GPS geofence.
     - Manajemen master Jadwal Shift.
     - Manajemen Akun Pengguna (Tambah, Edit kata sandi, Aktifkan/Nonaktifkan user).

2. **`hr`**
   - Akses ke menu laporan dan riwayat patroli untuk kebutuhan audit dan rekap absensi.

3. **`satpam`**
   - Dialihkan khusus ke antarmuka patroli lapangan (`/patrol`).
   - Fitur satpam:
     - Pemilihan Shift kerja dan Putaran Patroli (Round 1–5).
     - Deteksi GPS otomatis (hanya dapat check-in jika berada di dalam radius toleransi titik pos).
     - Pengambilan foto langsung dari kamera sebagai bukti fisik.
     - Pemilihan status kondisi pos (*Aman* atau *Tidak Aman*) beserta catatan temuan kejadian.

---

## 💡 Catatan & Troubleshooting

1. **Izin GPS / Geolocation di Browser HP:**
   - Fitur check-in satpam mewajibkan izin akses lokasi GPS browser (`navigator.geolocation`).
   - Pada perangkat seluler / smartphone, browser modern mewajibkan koneksi **HTTPS** atau **localhost** agar izin GPS dapat aktif.
2. **Koneksi Database SSL:**
   - Jika menggunakan Neon.tech atau penyedia cloud PostgreSQL lainnya, pastikan connection string menyertakan parameter `?sslmode=require`.
3. **Peta Tanpa API Key:**
   - Peta menggunakan OpenStreetMap (OSM) standar yang bebas digunakan tanpa memerlukan registrasi API Key eksternal.
4. **Penyimpanan Gambar (S3 / R2):**
   - Pastikan bucket S3 memiliki hak akses *read/write* untuk `AWS_ACCESS_KEY_ID` yang didaftarkan di `.env`.
   - Endpoint gambar dilayani melalui proxy terproteksi di `/api/images/[...key]`.
5. **Ekspor PDF & Excel:**
   - Fitur ekspor laporan tersedia di halaman Riwayat Patroli (`/admin/history`). Data yang diekspor otomatis mengikuti filter tanggal, shift, status, dan petugas yang sedang aktif di tabel.

---

*Dokumentasi ini dibuat untuk memudahkan proses serah terima dan pengembangan lanjutan oleh tim pengembang.*

