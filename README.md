# 🛡️ Patroli Satpam - Security Patrol Management System

Sistem manajemen dan monitoring patroli keamanan (satpam) berbasis web modern & responsif (PWA-ready). Dilengkapi dengan validasi lokasi titik pos berbasis GPS geofencing, peta OpenStreetMap, unggah foto bukti patroli langsung ke **Neon Object Storage (S3-compatible)**, database **Neon Serverless PostgreSQL**, pelacakan giliran shift, pencatatan insiden/status keamanan, rekapitulasi analitik, serta ekspor laporan ke format PDF dan Excel.

---

## 📑 Daftar Isi

- [Tech Stack](#-tech-stack)
- [Prasyarat Sistem (Yang Perlu Di-install & Disiapkan)](#-prasyarat-sistem-yang-perlu-di-install--disiapkan)
- [Struktur Direktori Proyek](#-struktur-direktori-proyek)
- [Langkah Setup Proyek](#-langkah-setup-proyek)
- [Konfigurasi Environment (.env)](#-konfigurasi-environment-env)
- [Setting Database & Storage (Neon)](#-setting-database--storage-neon)
- [Menjalankan Aplikasi](#-menjalankan-aplikasi)
- [Hak Akses & Role Pengguna](#-hak-akses--role-pengguna)
- [Catatan & Troubleshooting](#-catatan--troubleshooting)

---

## 🛠️ Tech Stack

Aplikasi ini dibangun menggunakan arsitektur modern dengan ekosistem **Neon**:

| Komponen | Teknologi | Keterangan |
| :--- | :--- | :--- |
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, Server Actions) | React 19, TypeScript 5 |
| **Styling & UI** | [Tailwind CSS v4](https://tailwindcss.com/), Radix UI Primitives, Lucide Icons | Desain responsif (Mobile First untuk satpam, Desktop untuk admin) |
| **Database** | [Neon Database](https://neon.tech/) (Serverless PostgreSQL) | Skalabilitas otomatis, pooling connection, branching |
| **Object Storage** | [Neon Object Storage](https://neon.tech/) (S3-Compatible) | Penyimpanan file foto bukti patroli menggunakan AWS S3 Client SDK |
| **ORM & Migrations** | [Drizzle ORM](https://orm.drizzle.team/) & `drizzle-kit` | Type-safe query builder & auto migration |
| **Autentikasi** | [NextAuth.js v5 (Auth.js)](https://authjs.dev/) | Session via Secure JWT Cookie, hash password dengan `bcryptjs` |
| **Peta & Geolokasi** | [OpenStreetMap (OSM)](https://www.openstreetmap.org/), [Leaflet](https://leafletjs.com/), `react-leaflet`, `geolib` | Validasi koordinat GPS radius pos patroli (Bebas API Key) |
| **Laporan & Ekspor** | `jspdf`, `jspdf-autotable`, `xlsx` (SheetJS) | Cetak laporan patroli otomatis (PDF/Excel) |
| **Visualisasi Data** | `recharts` | Grafik tren dan performa patroli di Dashboard Admin |
| **Linter & Formatter** | [Biome JS](https://biomejs.dev/) | Linter & formatter berkecepatan tinggi |
| **Package Manager** | [Bun](https://bun.sh/) *(Rekomendasi)* / Node.js (`npm` / `pnpm`) | Bun digunakan sebagai runtime & package manager utama |

---

## 💻 Prasyarat Sistem (Yang Perlu Di-install & Disiapkan)

Sebelum menjalankan aplikasi di komputer lokal atau server staf, pastikan kebutuhan berikut telah siap:

### 1. Software yang Perlu Di-install di Laptop/PC
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

3. **Code Editor**:
   - Visual Studio Code / Cursor dengan ekstensi *Tailwind CSS IntelliSense* dan *Biome*.

---

### 2. Akun & Layanan Cloud (Neon)
Proyek ini mengandalkan **[Neon](https://neon.tech/)** untuk dua kebutuhan utama dalam satu platform:
1. **Neon Serverless PostgreSQL Database:**
   - Menyimpan seluruh data master (pengguna/satpam, lokasi pos geofence, jadwal shift) dan riwayat patroli.
2. **Neon Object Storage (S3-Compatible):**
   - Menyimpan file foto bukti patroli dan insiden yang diunggah oleh satpam saat bertugas.

*(Jika staf melanjutkan proyek ini, Anda cukup membagikan kredensial Neon yang sudah ada, atau staf dapat membuat project baru di [neon.tech](https://neon.tech/)).*

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
├── backup.sql                 # File dump SQL data awal & backup database (37.000+ data)
├── backups/                   # Direktori arsip cadangan SQL
├── components/                # Komponen UI global (Navbar, Button, Modal, Card, dsb.)
├── lib/
│   ├── auth.ts                # Konfigurasi NextAuth.js v5 & verifikasi role
│   ├── db.ts                  # Koneksi database pool postgres & Drizzle ORM
│   ├── s3.ts                  # Integrasi Neon Object Storage (AWS SDK S3 Client)
│   ├── schema.ts              # Definisi skema tabel database (Drizzle)
│   └── export-utils.ts        # Helper generasi file PDF & Excel
├── drizzle.config.ts          # Konfigurasi drizzle-kit CLI
├── middleware.ts              # Route protection & role-based access control
├── seed.ts                    # Script auto-seeding data dari file backup.sql
├── .env.example               # Template environment variables (Neon DB & Neon Storage)
└── package.json               # Konfigurasi dependencies & script npm/bun
```

---

## 🚀 Langkah Setup Proyek

### 1. Salin / Clone Proyek
Buka terminal dan clone repository ini:
```bash
git clone <URL_REPOSITORY_ANDA>
cd patrolisatpam
```

### 2. Install Dependencies
Jalankan instalasi dependensi menggunakan Bun (atau npm):
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

Buka file `.env` dan masukkan kredensial Neon Anda:

```env
# ==========================================
# 1. DATABASE (Neon Serverless PostgreSQL)
# ==========================================
# Dapatkan connection string dari Neon Console Dashboard (menu Connection Details)
# Pastikan selalu menyertakan ?sslmode=require
DATABASE_URL="postgresql://neondb_owner:password@ep-frosty-rice-xyz-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

# ==========================================
# 2. AUTHENTICATION (NextAuth.js v5)
# ==========================================
# Kunci rahasia untuk enkripsi token session JWT
# Anda bisa generate key acak baru dengan menjalankan perintah:
# bunx auth secret  (atau: openssl rand -base64 32)
AUTH_SECRET="cT2m9wwVr7dXKarxNboeOWBA/m90mE5sJN+XnQNAkk0="

# ==========================================
# 3. PENYIMPANAN FOTO BUKTI (Neon Object Storage - S3 Compatible)
# ==========================================
# Dapatkan kredensial S3 dari menu Object Storage di Neon Console
AWS_ENDPOINT_URL_S3="https://br-jolly-cloud-xyz.storage.c-3.ap-southeast-1.aws.neon.tech"
AWS_ACCESS_KEY_ID="nak_live_xxxxxxxxxxxxxxxxxxxxxxxx"
AWS_SECRET_ACCESS_KEY="nsk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
AWS_REGION="ap-southeast-1"
AWS_BUCKET_NAME="uploads"
```

---

## 🗄️ Setting Database & Storage (Neon)

Silakan ikuti skenario yang sesuai:

### Skenario 1: Menghubungkan ke Database Neon yang Sudah Ada (Paling Umum)
> [!IMPORTANT]
> Jika staf Anda melanjutkan proyek dengan instance Neon database yang **sudah berjalan / sudah berisi data**:
> 1. Cukup masukkan `DATABASE_URL` dan kredensial S3 Neon ke file `.env`.
> 2. **JANGAN jalankan perintah migrasi atau seeding.**
> 3. Langsung jalankan aplikasi dengan `bun run dev` (atau `npm run dev`).

---

### Skenario 2: Menggunakan Database Neon Baru & Restore dari File `backup.sql`
Jika staf membuat project database baru di Neon dan ingin mengisi seluruh data master serta riwayat patroli awal:

1. Buat database baru di [Neon Console](https://console.neon.tech/).
2. Salin connection string ke `DATABASE_URL` di `.env`.
3. Jalankan script seed:
   ```bash
   # Menggunakan Bun
   bun run db:seed

   # ATAU menggunakan npm
   npm run db:seed
   ```
   *Script ini otomatis membaca file `backup.sql` di root proyek, membuat tabel-tabel yang diperlukan, sequence, relasi, dan memasukkan seluruh 37.000+ data awal ke database Neon.*

---

### Skenario 3: Sinkronisasi Skema Bersih (Database Neon Baru Tanpa Data)
Jika ingin memulai dari database Neon yang benar-benar kosong:

```bash
# Menggunakan Bun
bun run db:push

# ATAU menggunakan npm
npm run db:push
```
*Drizzle Kit akan otomatis membuat seluruh tabel di database Neon sesuai skema di `lib/schema.ts`.*

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
Untuk build dan deploy aplikasi pada server/VPS produksi:

```bash
# 1. Build aplikasi
bun run build    # atau: npm run build

# 2. Jalankan server produksi
bun run start    # atau: npm run start
```

### Script Tambahan
- `bun run lint` : Menjalankan linter Biome untuk memeriksa integritas kode.
- `bun run format` : Memformat kode secara otomatis.

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
     - Pengambilan foto langsung dari kamera sebagai bukti fisik (otomatis tersimpan ke Neon Object Storage).
     - Pemilihan status kondisi pos (*Aman* atau *Tidak Aman*) beserta catatan temuan kejadian.

---

## 💡 Catatan & Troubleshooting

1. **Koneksi Neon PostgreSQL SSL:**
   - Database Neon mewajibkan enkripsi SSL. Pastikan parameter `?sslmode=require` selalu ada di akhir `DATABASE_URL`.
2. **Neon Object Storage (S3-Compatible):**
   - Pastikan endpoint `AWS_ENDPOINT_URL_S3` mengarah ke URL storage Neon (`*.storage.*.neon.tech`).
   - Kredensial access key Neon diawali dengan `nak_live_...` dan secret key diawali dengan `nsk_live_...`.
   - File gambar dilayani secara aman melalui proxy internal `/api/images/[...key]`.
3. **Peta Tanpa API Key:**
   - Peta menggunakan OpenStreetMap (OSM) standar yang bebas digunakan tanpa memerlukan registrasi API Key eksternal.
4. **Izin GPS / Geolocation di Browser HP:**
   - Fitur check-in satpam mewajibkan izin akses lokasi GPS browser (`navigator.geolocation`).
   - Pada smartphone, browser mewajibkan koneksi **HTTPS** atau **localhost** agar izin GPS dapat aktif.
5. **Ekspor PDF & Excel:**
   - Fitur ekspor laporan tersedia di halaman Riwayat Patroli (`/admin/history`). Data yang diekspor otomatis mengikuti filter tanggal, shift, status, dan petugas yang sedang aktif di tabel.

---

*Dokumentasi ini dibuat untuk memudahkan proses serah terima dan pengembangan lanjutan oleh tim pengembang.*
