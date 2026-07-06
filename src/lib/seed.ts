/**
 * UMKM Ngadirejo - Data Seed Script
 * 
 * Migrates data from output.sql (Copy of REKAP sheet, 78 UMKM)
 * into the normalized MySQL database.
 * 
 * Run: npx tsx src/lib/seed.ts
 */

import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load env
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

// --- UMKM data extracted from output.sql (Copy of REKAP) ---
// Manually parsed from the SQL INSERT statements

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
}

// Parse the SQL file to extract Copy of REKAP data
function parseRekapData(sqlContent: string): RawUmkm[] {
  const results: RawUmkm[] = [];
  const lines = sqlContent.split('\n');
  let inCopyOfRekap = false;

  for (const line of lines) {
    if (line.includes('-- Sheet: Copy of REKAP')) {
      inCopyOfRekap = true;
      continue;
    }
    // Stop if we hit another sheet marker after Copy of REKAP
    if (inCopyOfRekap && line.startsWith('-- Sheet:')) {
      break;
    }

    if (!inCopyOfRekap) continue;
    if (!line.startsWith('INSERT INTO umkm_copy_of_rekap')) continue;

    // Extract VALUES portion
    const valuesMatch = line.match(/VALUES\s*\((.+)\);?\s*$/i);
    if (!valuesMatch) continue;

    const valuesStr = valuesMatch[1];
    const values = parseValues(valuesStr);

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
      });
    }
  }

  return results;
}

// Parse SQL VALUES, handling quoted strings with commas and escaped quotes
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
      // Check for escaped quote ''
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

// Generate URL-friendly slug
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

// Format WhatsApp number
function formatWhatsApp(kontak: string | null): string | null {
  if (!kontak) return null;
  let cleaned = kontak.replace(/[^\d]/g, '');
  // Remove trailing text like "(telepon saja)"
  if (cleaned.length === 0) return null;
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  }
  if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

// Parse jam operasional string into buka/tutup times
function parseJamOperasional(jamStr: string | null): { buka: string; tutup: string; is24jam: boolean } {
  if (!jamStr) return { buka: '08:00', tutup: '17:00', is24jam: false };

  const lower = jamStr.toLowerCase();

  // Check for 24 jam
  if (lower.includes('24 jam') || lower.includes('buka 24')) {
    return { buka: '00:00', tutup: '23:59', is24jam: true };
  }

  // Check for "kondisional" or "sesuai pesanan"
  if (lower.includes('kondisional') || lower.includes('sesuai pesanan') || lower.includes('sesuai panggilan')) {
    return { buka: '08:00', tutup: '20:00', is24jam: false };
  }

  // Try to parse "HH.MM - HH.MM" or "HH:MM - HH:MM" or "HH:MM-HH:MM"
  const timeMatch = jamStr.match(/(\d{1,2})[.:,](\d{2})\s*[-–]\s*(\d{1,2})[.:,](\d{2})/);
  if (timeMatch) {
    const buka = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
    const tutup = `${timeMatch[3].padStart(2, '0')}:${timeMatch[4]}`;
    return { buka, tutup, is24jam: false };
  }

  // Try simple "HH.MM" format
  const simpleMatch = jamStr.match(/(\d{1,2})[.:,](\d{2})/);
  if (simpleMatch) {
    const buka = `${simpleMatch[1].padStart(2, '0')}:${simpleMatch[2]}`;
    return { buka, tutup: '20:00', is24jam: false };
  }

  return { buka: '08:00', tutup: '17:00', is24jam: false };
}

// Generate tags from jenis_umkm and profil
function generateTags(jenis: string, profil: string): string[] {
  const tags = new Set<string>();

  // Add jenis as tag
  const jenisLower = jenis.toLowerCase().trim();
  tags.add(jenisLower);

  // Common tag extraction
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

  // Add "ngadirejo" and "desa" as common tags
  tags.add('ngadirejo');
  tags.add('umkm');

  return Array.from(tags).slice(0, 8);
}

// --- Main Seed Function ---

async function seed() {
  console.log('🌱 Starting UMKM Ngadirejo data seed...\n');

  const connection = await mysql.createConnection({
    host: process.env.DATABASE_HOST || '127.0.0.1',
    port: parseInt(process.env.DATABASE_PORT || '3306'),
    user: process.env.DATABASE_USER || 'umkm_app',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'umkm_ngadirejo',
    multipleStatements: true,
  });

  try {
    // 1. Read and parse SQL file
    const sqlPath = path.resolve(__dirname, '../data/output.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');
    const rawData = parseRekapData(sqlContent);

    console.log(`📊 Parsed ${rawData.length} UMKM from Copy of REKAP\n`);

    // 2. Clear existing data
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('TRUNCATE TABLE umkm_tags');
    await connection.query('TRUNCATE TABLE images');
    await connection.query('TRUNCATE TABLE operasional');
    await connection.query('TRUNCATE TABLE tags');
    await connection.query('TRUNCATE TABLE umkm');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('🗑️  Cleared existing data\n');

    // 3. Deduplicate by nama_umkm (some entries are duplicated)
    const seen = new Map<string, RawUmkm>();
    for (const item of rawData) {
      const key = item.nama_umkm.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.set(key, item);
      }
    }
    const uniqueData = Array.from(seen.values());
    console.log(`🔍 ${uniqueData.length} unique UMKM after deduplication\n`);

    // 4. Collect all unique tags first
    const allTagNames = new Set<string>();
    for (const item of uniqueData) {
      const tags = generateTags(item.jenis_umkm, item.profil_umkm);
      tags.forEach(t => allTagNames.add(t));
    }

    // Insert all tags
    const tagMap = new Map<string, number>();
    for (const tagName of allTagNames) {
      const [result] = await connection.query(
        'INSERT INTO tags (nama) VALUES (?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)',
        [tagName]
      ) as any;
      tagMap.set(tagName, result.insertId);
    }
    console.log(`🏷️  Inserted ${tagMap.size} unique tags\n`);

    // 5. Insert UMKM data
    const hari: Array<'senin' | 'selasa' | 'rabu' | 'kamis' | 'jumat' | 'sabtu' | 'minggu'> =
      ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'];

    let insertedCount = 0;
    const usedSlugs = new Set<string>();

    for (const item of uniqueData) {
      // Generate unique slug
      let slug = generateSlug(item.nama_umkm);
      if (usedSlugs.has(slug)) {
        slug = `${slug}-${insertedCount + 1}`;
      }
      usedSlugs.add(slug);

      const whatsapp = formatWhatsApp(item.kontak);
      const { buka, tutup, is24jam } = parseJamOperasional(item.jam_operasional);
      const tags = generateTags(item.jenis_umkm, item.profil_umkm);

      // Build produk array from profil (extract key products mentioned)
      const produk = extractProduk(item.profil_umkm, item.jenis_umkm);

      // Determine a proper Google Maps link
      let googleMaps = item.link_gmaps;
      if (googleMaps && !googleMaps.startsWith('http')) {
        // Some entries have just a name instead of a URL
        if (item.latitude && item.longitude) {
          googleMaps = `https://maps.google.com/?q=${item.latitude},${item.longitude}`;
        } else {
          googleMaps = null;
        }
      }

      // Insert UMKM
      const [result] = await connection.query(
        `INSERT INTO umkm (slug, nama, pemilik, kategori, deskripsi_singkat, deskripsi_lengkap, produk, alamat, latitude, longitude, google_maps, whatsapp)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          slug,
          item.nama_umkm.trim(),
          item.nama_pemilik,
          normalizeKategori(item.jenis_umkm),
          item.profil_umkm.substring(0, 200), // deskripsi_singkat
          item.profil_umkm, // deskripsi_lengkap (full profil)
          JSON.stringify(produk),
          item.alamat,
          item.latitude,
          item.longitude,
          googleMaps,
          whatsapp,
        ]
      ) as any;

      const umkmId = result.insertId;

      // Insert operasional for each day
      for (const h of hari) {
        const isLibur = h === 'minggu' && !is24jam;
        await connection.query(
          'INSERT INTO operasional (umkm_id, hari, buka, tutup, libur) VALUES (?, ?, ?, ?, ?)',
          [umkmId, h, isLibur ? '00:00' : buka, isLibur ? '00:00' : tutup, isLibur]
        );
      }

      // Insert tags
      for (const tagName of tags) {
        const tagId = tagMap.get(tagName);
        if (tagId) {
          await connection.query(
            'INSERT IGNORE INTO umkm_tags (umkm_id, tag_id) VALUES (?, ?)',
            [umkmId, tagId]
          );
        }
      }

      insertedCount++;
      process.stdout.write(`\r✅ Inserted ${insertedCount}/${uniqueData.length} UMKM`);
    }

    console.log(`\n\n🎉 Seed completed successfully!`);
    console.log(`   📦 ${insertedCount} UMKM inserted`);
    console.log(`   🏷️  ${tagMap.size} tags created`);
    console.log(`   📅 ${insertedCount * 7} operasional records created\n`);

    // Verify
    const [countResult] = await connection.query('SELECT COUNT(*) as c FROM umkm') as any;
    console.log(`📊 Verification: ${countResult[0].c} UMKM in database\n`);

  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Normalize kategori to consistent values
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

// Extract products from profil text
function extractProduk(profil: string, jenis: string): string[] {
  const produk: string[] = [];

  // Add jenis as primary product/service
  produk.push(jenis.trim());

  // Try to extract specific products mentioned
  const profilLower = profil.toLowerCase();

  // Common product extraction patterns
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

  return produk.slice(0, 8); // Max 8 products
}

// Run
seed().catch(console.error);
