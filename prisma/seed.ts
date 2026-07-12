/**
 * UMKM Ngadirejo — Prisma Seed Script
 *
 * Parses output.sql (Copy of REKAP sheet, 78 UMKM)
 * and seeds data into PostgreSQL via Prisma.
 *
 * Run: npx prisma db seed
 */

import { PrismaClient, Hari } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// --- Types ---

interface RawUmkm {
  no: number;
  nama_umkm: string;
  profil_umkm: string;
  jenis_umkm: string;
  nama_pemilik: string | null;
  alamat: string | null;
  latitude: number | null;
  longitude: number | null;
  link_gmaps: string | null;
  kontak: string | null;
  jam_operasional: string | null;
  berkenan: string | null;
  qris: string | null;
}

// --- SQL Parsing ---

function parseRekapData(sqlContent: string): RawUmkm[] {
  const results: RawUmkm[] = [];
  const lines = sqlContent.split('\n');
  let inCopyOfRekap = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.includes('-- Sheet: Copy of REKAP')) {
      inCopyOfRekap = true;
      continue;
    }
    if (inCopyOfRekap && line.startsWith('-- Sheet:')) {
      break;
    }
    if (!inCopyOfRekap) continue;
    if (!line.startsWith('INSERT INTO umkm_copy_of_rekap')) continue;

    // Some INSERT statements span multiple lines — collect until we find closing );
    let fullLine = line;
    while (!fullLine.trimEnd().endsWith(');') && i + 1 < lines.length) {
      i++;
      fullLine += '\n' + lines[i];
    }

    const valuesMatch = fullLine.match(/VALUES\s*\((.+)\);?\s*$/is);
    if (!valuesMatch) continue;

    const values = parseValues(valuesMatch[1]);

    if (values.length >= 11) {
      results.push({
        no: parseInt(values[0]) || 0,
        nama_umkm: cleanString(values[1]),
        profil_umkm: cleanString(values[2]),
        jenis_umkm: cleanString(values[3]),
        nama_pemilik: values[4] === 'NULL' ? null : cleanString(values[4]),
        alamat: values[5] === 'NULL' ? null : cleanString(values[5]),
        latitude: values[6] === 'NULL' ? null : parseFloat(values[6]),
        longitude: values[7] === 'NULL' ? null : parseFloat(values[7]),
        link_gmaps: values[8] === 'NULL' ? null : cleanString(values[8]),
        kontak: values[9] === 'NULL' ? null : cleanString(values[9]),
        jam_operasional: values[10] === 'NULL' ? null : cleanString(values[10]),
        berkenan: values.length > 11 && values[11] !== 'NULL' ? cleanString(values[11]) : null,
        qris: values.length > 12 && values[12] !== 'NULL' ? cleanString(values[12]) : null,
      });
    }
  }

  return results;
}

function parseValues(valuesStr: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuote = false;
  let i = 0;

  while (i < valuesStr.length) {
    const char = valuesStr[i];

    if (char === "'" && !inQuote) {
      inQuote = true;
      i++;
      continue;
    }

    if (char === "'" && inQuote) {
      if (i + 1 < valuesStr.length && valuesStr[i + 1] === "'") {
        current += "'";
        i += 2;
        continue;
      }
      inQuote = false;
      i++;
      continue;
    }

    if (char === ',' && !inQuote) {
      result.push(current.trim());
      current = '';
      i++;
      continue;
    }

    current += char;
    i++;
  }

  result.push(current.trim());
  return result;
}

function cleanString(s: string): string {
  return s.replace(/\\n/g, '\n').replace(/\\r/g, '').trim();
}

// --- Data Transformation Helpers ---

function generateSlug(nama: string): string {
  return nama
    .toLowerCase()
    .replace(/[&]/g, 'dan')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 200);
}

function formatWhatsApp(kontak: string | null): string | null {
  if (!kontak) return null;
  let cleaned = kontak.replace(/[^\d]/g, '');
  if (cleaned.length === 0) return null;
  if (cleaned.startsWith('0')) cleaned = '62' + cleaned.substring(1);
  if (!cleaned.startsWith('62')) cleaned = '62' + cleaned;
  return cleaned;
}

function parseJamOperasional(jamStr: string | null): { buka: string; tutup: string; is24jam: boolean } {
  if (!jamStr) return { buka: '08:00', tutup: '17:00', is24jam: false };
  const lower = jamStr.toLowerCase();
  if (lower.includes('24 jam') || lower.includes('buka 24')) return { buka: '00:00', tutup: '23:59', is24jam: true };
  if (lower.includes('kondisional') || lower.includes('sesuai pesanan') || lower.includes('sesuai panggilan')) return { buka: '08:00', tutup: '20:00', is24jam: false };
  const timeMatch = jamStr.match(/(\d{1,2})[.:,](\d{2})\s*[-–]\s*(\d{1,2})[.:,](\d{2})/);
  if (timeMatch) return { buka: `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`, tutup: `${timeMatch[3].padStart(2, '0')}:${timeMatch[4]}`, is24jam: false };
  const simpleMatch = jamStr.match(/(\d{1,2})[.:,](\d{2})/);
  if (simpleMatch) return { buka: `${simpleMatch[1].padStart(2, '0')}:${simpleMatch[2]}`, tutup: '20:00', is24jam: false };
  return { buka: '08:00', tutup: '17:00', is24jam: false };
}

function normalizeKategori(jenis: string): string {
  const lower = jenis.toLowerCase().trim();
  if (lower.includes('makanan') || lower.includes('kuliner') || lower.includes('kue') || lower.includes('bakso') || lower.includes('sate')) return 'Makanan';
  if (lower.includes('minuman')) return 'Minuman';
  if (lower.includes('sembako') || lower.includes('kelontong') || lower.includes('toko') || lower.includes('perdagangan')) return 'Sembako';
  if (lower.includes('jasa') || lower.includes('service') || lower.includes('salon') || lower.includes('barber') || lower.includes('pijat') || lower.includes('bimbel') || lower.includes('laundry') || lower.includes('foto') || lower.includes('percetakan') || lower.includes('permak')) return 'Jasa';
  if (lower.includes('pertanian') || lower.includes('tani') || lower.includes('bibit') || lower.includes('buah')) return 'Pertanian';
  if (lower.includes('kerajinan') || lower.includes('craft')) return 'Kerajinan';
  if (lower.includes('bengkel') || lower.includes('motor')) return 'Jasa';
  if (lower.includes('mebel') || lower.includes('furnitur') || lower.includes('kayu')) return 'Kerajinan';
  if (lower.includes('elektronik') || lower.includes('distribusi') || lower.includes('cell')) return 'Lainnya';
  if (lower.includes('sewa') || lower.includes('penyewaan')) return 'Jasa';
  if (lower.includes('industri')) return 'Makanan';
  if (lower.includes('pedagang') || lower.includes('hewan')) return 'Lainnya';
  if (lower.includes('bahan makanan')) return 'Makanan';
  if (lower.includes('usaha mikro')) return 'Makanan';
  return 'Lainnya';
}

function generateTags(jenis: string, profil: string): string[] {
  const tags = new Set<string>();
  const jenisLower = jenis.toLowerCase().trim();
  tags.add(jenisLower);

  const keywords: Record<string, string[]> = {
    'makanan': ['makanan', 'kuliner', 'food'],
    'minuman': ['minuman', 'drink'],
    'sembako': ['sembako', 'kelontong', 'kebutuhan harian'],
    'jasa': ['jasa', 'service'],
    'kerajinan': ['kerajinan', 'craft'],
    'pertanian': ['pertanian', 'tani', 'bibit'],
    'bengkel': ['bengkel', 'motor', 'kendaraan'],
    'salon': ['salon', 'kecantikan'],
    'fotografi': ['fotografi', 'foto', 'studio'],
    'percetakan': ['percetakan', 'print', 'cetak'],
    'mebel': ['mebel', 'furnitur', 'kayu'],
    'laundry': ['laundry', 'cuci'],
    'elektronik': ['elektronik', 'listrik'],
    'barbershop': ['barbershop', 'potong rambut'],
  };

  const combined = `${jenisLower} ${profil.toLowerCase()}`;
  for (const [, relatedTags] of Object.entries(keywords)) {
    for (const keyword of relatedTags) {
      if (combined.includes(keyword)) {
        relatedTags.forEach(t => tags.add(t));
        break;
      }
    }
  }

  tags.add('ngadirejo');
  tags.add('umkm');
  return Array.from(tags).slice(0, 8);
}

function extractProduk(profil: string, jenis: string): string[] {
  const produk: string[] = [jenis.trim()];
  const profilLower = profil.toLowerCase();
  const productKeywords = [
    'nasi goreng', 'mie', 'bakso', 'sate', 'kue', 'roti', 'keripik', 'cilok',
    'rujak', 'gorengan', 'es teh', 'jus', 'dimsum', 'somay', 'batagor',
    'molen', 'lumpia', 'dawet', 'pecel', 'rawon', 'soto',
    'servis', 'ganti oli', 'tambal ban', 'potong rambut',
    'foto', 'video', 'cetak', 'print', 'sablon', 'sticker',
    'sembako', 'beras', 'gula', 'minyak',
    'bibit', 'pupuk', 'pestisida',
    'lemari', 'meja', 'kursi', 'pintu',
    'laundry', 'cuci',
  ];
  for (const keyword of productKeywords) {
    if (profilLower.includes(keyword) && !produk.some(p => p.toLowerCase() === keyword)) {
      produk.push(keyword.charAt(0).toUpperCase() + keyword.slice(1));
    }
  }
  return produk.slice(0, 8);
}

// --- Main Seed ---

async function seed() {
  console.log('🌱 Starting UMKM Ngadirejo data seed (Prisma + PostgreSQL)...\n');

  // 1. Read and parse SQL file
  const sqlPath = path.resolve(__dirname, '../src/data/output.sql');
  const sqlContent = fs.readFileSync(sqlPath, 'utf-8');
  const rawData = parseRekapData(sqlContent);
  console.log(`📊 Parsed ${rawData.length} UMKM from Copy of REKAP\n`);

  // 2. Clear existing data (cascade will handle related tables)
  await prisma.umkmTag.deleteMany();
  await prisma.image.deleteMany();
  await prisma.operasional.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.umkm.deleteMany();
  console.log('🗑️  Cleared existing data\n');

  // 3. Deduplicate by nama_umkm
  const seen = new Map<string, RawUmkm>();
  for (const item of rawData) {
    const key = item.nama_umkm.toLowerCase().trim();
    if (!seen.has(key)) seen.set(key, item);
  }
  const uniqueData = Array.from(seen.values());
  console.log(`🔍 ${uniqueData.length} unique UMKM after deduplication\n`);

  // 4. Create all unique tags first
  const allTagNames = new Set<string>();
  for (const item of uniqueData) {
    generateTags(item.jenis_umkm, item.profil_umkm).forEach(t => allTagNames.add(t));
  }

  const tagMap = new Map<string, number>();
  for (const tagName of allTagNames) {
    const tag = await prisma.tag.upsert({
      where: { nama: tagName },
      update: {},
      create: { nama: tagName },
    });
    tagMap.set(tagName, tag.id);
  }
  console.log(`🏷️  Created ${tagMap.size} unique tags\n`);

  // 5. Insert UMKM data
  const hariList: Hari[] = [Hari.senin, Hari.selasa, Hari.rabu, Hari.kamis, Hari.jumat, Hari.sabtu, Hari.minggu];
  let insertedCount = 0;
  const usedSlugs = new Set<string>();

  for (const item of uniqueData) {
    let slug = generateSlug(item.nama_umkm);
    if (usedSlugs.has(slug)) slug = `${slug}-${insertedCount + 1}`;
    usedSlugs.add(slug);

    const whatsapp = formatWhatsApp(item.kontak);
    const { buka, tutup, is24jam } = parseJamOperasional(item.jam_operasional);
    const tags = generateTags(item.jenis_umkm, item.profil_umkm);
    const produk = extractProduk(item.profil_umkm, item.jenis_umkm);

    let googleMaps = item.link_gmaps;
    if (googleMaps && !googleMaps.startsWith('http')) {
      googleMaps = item.latitude && item.longitude
        ? `https://maps.google.com/?q=${item.latitude},${item.longitude}`
        : null;
    }

    // Create UMKM with nested operasional and tags
    await prisma.umkm.create({
      data: {
        slug,
        nama: item.nama_umkm.trim(),
        pemilik: item.nama_pemilik,
        kategori: normalizeKategori(item.jenis_umkm),
        deskripsiSingkat: item.profil_umkm.substring(0, 200),
        deskripsiLengkap: item.profil_umkm,
        produk: produk,
        alamat: item.alamat,
        latitude: item.latitude,
        longitude: item.longitude,
        googleMaps,
        whatsapp,
        berkenan: item.berkenan,
        qris: item.qris,
        operasional: {
          create: hariList.map(h => ({
            hari: h,
            buka: (h === Hari.minggu && !is24jam) ? '00:00' : buka,
            tutup: (h === Hari.minggu && !is24jam) ? '00:00' : tutup,
            libur: h === Hari.minggu && !is24jam,
          })),
        },
        tags: {
          create: tags
            .filter(tagName => tagMap.has(tagName))
            .map(tagName => ({
              tag: { connect: { id: tagMap.get(tagName)! } },
            })),
        },
      },
    });

    insertedCount++;
    process.stdout.write(`\r✅ Inserted ${insertedCount}/${uniqueData.length} UMKM`);
  }

  console.log(`\n\n🎉 Seed completed successfully!`);
  console.log(`   📦 ${insertedCount} UMKM inserted`);
  console.log(`   🏷️  ${tagMap.size} tags created`);
  console.log(`   📅 ${insertedCount * 7} operasional records created\n`);

  // Verify
  const count = await prisma.umkm.count();
  console.log(`📊 Verification: ${count} UMKM in database\n`);
}

seed()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
