# Panduan Kustomisasi Website Direktori UMKM Desa Ngadirejo

Dokumen ini menjelaskan cara melakukan kustomisasi visual, data, dan teks pada website direktori **UMKM Desa Ngadirejo**.

---

## 1. Cara Mengganti Warna Tema

Warna tema website dikelola menggunakan konfigurasi variabel global di file `src/app/globals.css`.

Buka file [src/app/globals.css](file:///home/devangga/git-repo/UMKM-Ngadirejo/src/app/globals.css):
```css
@theme inline {
  --color-background: #fdfcf7; /* Latar belakang krem hangat pedesaan */
  --color-foreground: #1e293b; /* Warna teks utama */
  --color-cream-light: #faf8f0;
  --color-cream-dark: #f3ede0;
}
```

- Untuk mengubah warna latar belakang utama website, Anda cukup mengubah nilai dari `--color-background`.
- Untuk mengubah aksen warna hijau default, Anda dapat mengganti class-class Tailwind `emerald` di dalam file komponen (seperti `bg-emerald-600`, `text-emerald-700`, `border-emerald-100`) ke warna lain (misal `teal`, `forest`, atau `indigo`).

---

## 2. Cara Mengganti Foto

Setiap data UMKM memiliki properti foto utama (`fotoUtama`) dan galeri (`galeri`).

1. Buka file data UMKM di [src/data/umkm.js](file:///home/devangga/git-repo/UMKM-Ngadirejo/src/data/umkm.js).
2. Cari properti `fotoUtama` atau `galeri` di dalam objek UMKM yang bersangkutan.
3. Ganti URL foto lama dengan URL foto baru Anda (bisa berupa link Unsplash, URL Cloud Storage, atau gambar lokal).
4. **Foto Lokal**: Jika ingin memakai foto lokal, letakkan gambar di dalam folder `public/images/` dan panggil path-nya dengan diawali garis miring (contoh: `fotoUtama: "/images/toko-saya.jpg"`).
5. **Konfigurasi Domain Gambar**: Jika menggunakan gambar dari website eksternal selain Unsplash, pastikan untuk mendaftarkannya terlebih dahulu di [next.config.ts](file:///home/devangga/git-repo/UMKM-Ngadirejo/next.config.ts) pada bagian `images.remotePatterns` agar tidak terjadi error build Next.js.

---

## 3. Cara Mengubah Teks Hero & Statistik

Teks headline hero, subheadline, tombol CTA, dan statistik dummy berada langsung di halaman utama [src/app/page.tsx](file:///home/devangga/git-repo/UMKM-Ngadirejo/src/app/page.tsx).

### Mengubah Teks Headline & Subheadline
Cari kode berikut di dalam file `page.tsx`:
```tsx
{/* Headline */}
<h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight max-w-4xl leading-[1.15] mb-6">
  Temukan UMKM Lokal <br className="hidden sm:inline" />
  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-emerald-700">
    Desa Ngadirejo
  </span>
</h1>

{/* Subheadline */}
<p className="text-base sm:text-lg lg:text-xl text-slate-600 max-w-2xl leading-relaxed mb-10">
  Cari makanan, minuman, jasa, sembako, hasil pertanian, dan usaha lokal masyarakat Desa Ngadirejo dalam satu website.
</p>
```
Ganti teks di atas sesuai dengan keinginan Anda.

### Mengubah Statistik Dummy
Cari kode stat card di bagian bawah hero di file `page.tsx` untuk memodifikasi angka dan label:
```tsx
{/* Contoh Stat Card */}
<div className="text-2xl font-black text-slate-950">25+</div>
<div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">UMKM Terdaftar</div>
```

---

## 4. Cara Menjaga Tampilan Card Tetap Rapi

Komponen kartu UMKM [src/components/UmkmCard.tsx](file:///home/devangga/git-repo/UMKM-Ngadirejo/src/components/UmkmCard.tsx) dirancang dengan batas-batas konten otomatis agar layout grid tetap sejajar meskipun panjang deskripsi antar UMKM berbeda:

1. **Rasio Foto**: Foto thumbnail kartu dikunci menggunakan aspek rasio box tetap (`h-52 w-full`) dengan object fit `object-cover`. Hal ini mencegah foto meregang (*stretch*) atau merusak tinggi kartu.
2. **Limit Deskripsi**: Deskripsi dibatasi maksimal 2 baris menggunakan class Tailwind `line-clamp-2`.
3. **Limit Judul**: Judul dibatasi maksimal 1 baris menggunakan class Tailwind `line-clamp-1`.
4. **Fallback Image**: Jika pelaku UMKM tidak mengisi `fotoUtama` (nilainya kosong `""` atau `null`), sistem secara otomatis akan menggunakan gambar pasar modern bernuansa hangat dari Unsplash sebagai fallback agar kartu tetap terlihat profesional dan tidak rusak/broken.

---

## 5. Development Lokal (Docker)

### Prasyarat
- Docker & Docker Compose
- Node.js 18+

### Setup
```bash
# 1. Start MySQL
docker-compose up -d

# 2. Install dependencies
npm install

# 3. Copy environment file
cp .env.example .env.local

# 4. Seed database (jalankan sekali)
npx tsx src/lib/seed.ts

# 5. Start dev server
npm run dev
```

---

## 6. Deploy ke Vercel (Cloud MySQL)

### Langkah 1: Buat Cloud MySQL Database

Pilih salah satu provider (semua punya free tier):

| Provider | Signup URL |
|---|---|
| Railway | https://railway.app → New Project → MySQL |
| TiDB Cloud | https://tidbcloud.com → Serverless Cluster |
| Aiven | https://aiven.io → MySQL Service |

Setelah buat database, Anda akan mendapat **connection string** seperti:
```
mysql://username:password@hostname:port/database_name
```

### Langkah 2: Migrasi Data ke Cloud

```bash
# Set connection string dan jalankan migration
DATABASE_URL="mysql://user:pass@host:port/dbname?ssl-mode=REQUIRED" npx tsx src/lib/migrate-cloud.ts
```

Script ini otomatis membuat tabel dan mengisi 73 data UMKM.

### Langkah 3: Deploy ke Vercel

```bash
# 1. Install Vercel CLI (jika belum)
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel
```

### Langkah 4: Set Environment Variables di Vercel

Buka **Vercel Dashboard → Project → Settings → Environment Variables**, lalu tambahkan:

| Variable | Value | Environment |
|---|---|---|
| `DATABASE_URL` | `mysql://user:pass@host:port/dbname?ssl-mode=REQUIRED` | Production, Preview |
| `NEXT_PUBLIC_BASE_URL` | `https://your-domain.vercel.app` | Production |

Lalu redeploy:
```bash
vercel --prod
```

### Environment Variables

Lihat `.env.example` untuk daftar lengkap variabel yang diperlukan.

| Variable | Deskripsi | Wajib |
|---|---|---|
| `DATABASE_URL` | Connection string MySQL (cloud) | ✅ untuk Vercel |
| `DATABASE_HOST` | MySQL host (lokal) | ✅ untuk dev lokal |
| `DATABASE_PORT` | MySQL port (default: 3306) | opsional |
| `DATABASE_USER` | MySQL username | ✅ untuk dev lokal |
| `DATABASE_PASSWORD` | MySQL password | ✅ untuk dev lokal |
| `DATABASE_NAME` | Nama database | ✅ untuk dev lokal |
| `NEXT_PUBLIC_BASE_URL` | URL website | opsional |
