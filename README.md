# 🛡️ Patroli Satpam - Security Patrol Management System

Sistem manajemen dan monitoring patroli keamanan (satpam) berbasis web modern & responsif (PWA-ready). Dilengkapi dengan validasi lokasi titik pos berbasis GPS geofencing, unggah foto bukti patroli langsung ke Cloud Object Storage (S3-compatible), pelacakan giliran shift, pencatatan insiden/status keamanan, rekapitulasi analitik, serta ekspor laporan ke format PDF dan Excel.

---

## 📑 Daftar Isi

- [Tech Stack](#-tech-stack)
- [Prasyarat Sistem (Yang Perlu Di-install)](#-prasyarat-sistem-yang-perlu-di-install)
- [Struktur Direktori Proyek](#-struktur-direktori-proyek)
- [Langkah Setup Proyek](#-langkah-setup-proyek)
- [Konfigurasi Environment (.env)](#-konfigurasi-environment-env)
- [Setting & Migrasi Database](#-setting--migrasi-database)
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
| **Peta & Geolokasi** | [Leaflet](https://leafletjs.com/), `react-leaflet`, `geolib` | Validasi koordinat GPS radius pos patroli |
| **Object Storage** | [AWS SDK S3 Client v3](https://aws.amazon.com/sdk-for-javascript/) | Kompatibel dengan AWS S3, Cloudflare R2, Neon Storage, MinIO |
| **Laporan & Ekspor** | `jspdf`, `jspdf-autotable`, `xlsx` (SheetJS) | Cetak laporan patroli otomatis (PDF/Excel) |
| **Visualisasi Data** | `recharts` | Grafik tren dan performa patroli di Dashboard Admin |
| **Linter & Formatter** | [Biome JS](https://biomejs.dev/) | Linter & formatter berkecepatan tinggi |
| **Package Manager** | [Bun](https://bun.sh/) *(Rekomendasi)* / Node.js (`npm` / `pnpm`) | Bun digunakan sebagai runtime & package manager utama |

---

## 💻 Prasyarat Sistem (Yang Perlu Di-install)

Sebelum menjalankan aplikasi di komputer lokal atau server, pastikan tool berikut telah terinstal:

1. **Git**
   - Untuk clone dan manajemen repository.
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
   - **Opsi Cloud (Termudah & Cepat):** Buat database gratis di [Neon.tech](https://neon.tech/) atau [Supabase](https://supabase.com/).
   - **Opsi Lokal:** Install PostgreSQL di komputer lokal (port default `5432`) atau via Docker:
     ```bash
     docker run --name postgres-patroli -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=patrolisatpam -p 5432:5432 -d postgres:16
     ```

4. **Object Storage (S3 / Cloudflare R2 / Neon Storage)**:
   - Digunakan untuk menampung file upload foto absensi/kejadian saat patroli.
   - Bisa menggunakan bucket AWS S3, Cloudflare R2, atau Neon Object Storage.

---

## 📁 Struktur Direktori Proyek

```text
patrolisatpam/
├── app/
│   ├── actions/               # Server Actions (CRUD patroli, shift, lokasi, analitik, users)
│   ├── admin/                 # Modul tampilan Administrator & HR
│   │   ├── dashboard/         # Dashboard grafik statistik & ringkasan patroli
│   │   ├── history/           # Riwayat lengkap patroli & ekspor PDF/Excel
│   │   ├── locations/         # Master data titik pos patroli & radius GPS
│   │   ├── shifts/            # Master data jam kerja (Shift)
│   │   └── users/             # Master data akun satpam, admin, & HR
│   ├── api/                   # API Routes (NextAuth handlers, proxy streaming foto S3)
│   ├── login/                 # Halaman login antarmuka
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
Buka terminal dan arahkan ke direktori kerja Anda:
```bash
git clone <URL_REPOSITORY_ANDA>
cd patrolisatpam
```

### 2. Install Dependencies
Gunakan Bun (atau npm):
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

## 🗄️ Setting & Migrasi Database

Terdapat 2 cara untuk menyiapkan database baru:

### Opsi A: Mengisi Database Langsung dari Backup Data (Sangat Direkomendasikan)
Proyek ini menyediakan file data cadangan (skema + data master + riwayat patroli) di folder `backups/`. 
Cukup jalankan script seed:

```bash
# Menggunakan Bun
bun run db:seed

# ATAU menggunakan npm
npm run db:seed
```
*Script ini otomatis membaca file SQL dari folder `backups/`, membuat tabel-tabel yang diperlukan, sequence, dan memasukkan seluruh data awal.*

---

### Opsi B: Sinkronisasi Skema Kosong Baru (Drizzle Kit Push)
Jika Anda ingin memulai dari database kosong tanpa data lama:
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
Untuk build dan menjalankan aplikasi secara optimal:

```bash
# 1. Build aplikasi
bun run build    # atau: npm run build

# 2. Jalankan server produksi
bun run start    # atau: npm run start
```

### Script Lain yang Tersedia
- `bun run lint` : Menjalankan linter Biome untuk mendeteksi error sintaks atau style code.
- `bun run format` : Memperbaiki pemformatan kode secara otomatis.

---

## 👥 Hak Akses & Role Pengguna

Aplikasi memiliki proteksi rute (`middleware.ts`) berdasarkan 3 tingkatan peran (role):

1. **`admin`**
   - Akses penuh ke seluruh menu Admin (`/admin/*`):
     - Dashboard statistik dan monitoring.
     - Riwayat patroli & unduh laporan (PDF & Excel).
     - Manajemen master Titik Pos Patroli & radius koordinat GPS.
     - Manajemen master Jadwal Shift.
     - Manajemen Akun Petugas (Tambah, Edit password, Aktifkan/Nonaktifkan user).

2. **`hr`**
   - Akses ke menu laporan dan riwayat patroli untuk kebutuhan audit dan pemantauan absensi.

3. **`satpam`**
   - Dialihkan khusus ke antarmuka patroli lapangan (`/patrol`).
   - Fitur satpam:
     - Pilih Shift dan Putaran (Round 1–5).
     - Deteksi GPS otomatis (hanya bisa check-in jika berada di dalam radius toleransi titik pos).
     - Pengambilan foto langsung dari kamera sebagai bukti fisik.
     - Pemilihan status kondisi pos (*Aman* atau *Tidak Aman*) beserta catatan temuan kejadian.

> **Catatan Akun:**
> - Jika menggunakan database dari file backup, Anda dapat masuk menggunakan akun pengguna yang sudah terdaftar.
> - Password akun di-hash menggunakan algoritma `bcrypt`.
> - Anda dapat mengelola akun serta mereset kata sandi melalui panel **Admin > Users** (`/admin/users`).

---

## 💡 Catatan & Troubleshooting

1. **Izin GPS / Geolocation di Browser:**
   - Fitur check-in satpam mewajibkan izin akses lokasi GPS browser (`navigator.geolocation`).
   - Pada perangkat seluler / smartphone, browser mewajibkan koneksi **HTTPS** atau **localhost** agar izin GPS dapat aktif.
2. **Koneksi Database SSL:**
   - Jika menggunakan Neon.tech atau penyedia cloud PostgreSQL lainnya, pastikan string koneksi menyertakan parameter `?sslmode=require`.
3. **Penyimpanan Gambar (S3 / R2):**
   - Pastikan bucket S3 memiliki hak akses *read/write* untuk `AWS_ACCESS_KEY_ID` yang didaftarkan.
   - Endpoint gambar dilayani melalui proxy terproteksi di `/api/images/[...key]`.
4. **Ekspor PDF & Excel:**
   - Fitur ekspor laporan tersedia di halaman Riwayat Patroli (`/admin/history`). Data yang diekspor otomatis mengikuti filter tanggal, shift, status, dan petugas yang sedang dipilih.

---

*Dokumentasi ini dibuat untuk memudahkan proses serah terima dan pengembangan lanjutan oleh tim pengembang.*
