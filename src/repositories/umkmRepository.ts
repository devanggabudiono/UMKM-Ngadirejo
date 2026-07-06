import pool, { DatabaseError } from '@/lib/db';
import type { UmkmRow, OperasionalRow, ImageRow, Umkm, UmkmListItem, JamOperasional, JamHarian, UmkmStats } from '@/types/umkm';
import { RowDataPacket } from 'mysql2/promise';

// =============================================
// UMKM Repository — All database queries
// No SQL should exist outside this file.
//
// Every public method:
// - Wraps queries in try/catch
// - Logs errors with function name context
// - Returns graceful fallbacks (empty array / null / default)
// - Never crashes the Next.js process
// =============================================

/** Default operational schedule when none is found */
const DEFAULT_JAM_HARIAN: JamHarian = { buka: '00:00', tutup: '00:00', libur: true };

const DEFAULT_JAM_OPERASIONAL: JamOperasional = {
  senin: DEFAULT_JAM_HARIAN,
  selasa: DEFAULT_JAM_HARIAN,
  rabu: DEFAULT_JAM_HARIAN,
  kamis: DEFAULT_JAM_HARIAN,
  jumat: DEFAULT_JAM_HARIAN,
  sabtu: DEFAULT_JAM_HARIAN,
  minggu: DEFAULT_JAM_HARIAN,
};

const DEFAULT_COVER = '/uploads/umkm/default-cover.webp';

const DEFAULT_STATS: UmkmStats = { totalUmkm: 0, totalKategori: 0 };

// --- Helper: Structured error logging ---

function logQueryError(functionName: string, error: unknown): void {
  const details = error instanceof DatabaseError
    ? { code: error.code, host: error.host, port: error.port, retryable: error.isRetryable, message: error.message }
    : { message: error instanceof Error ? error.message : String(error) };

  console.error(`[UmkmRepository.${functionName}] ❌ Query failed:`, details);
}

// --- Helper: Build JamOperasional from operasional rows ---

function buildJamOperasional(rows: OperasionalRow[]): JamOperasional {
  const jam = { ...DEFAULT_JAM_OPERASIONAL };
  for (const row of rows) {
    jam[row.hari] = {
      buka: row.buka || '00:00',
      tutup: row.tutup || '00:00',
      libur: Boolean(row.libur),
    };
  }
  return jam;
}

// --- Helper: Parse produk JSON safely ---

function parseProduk(produkJson: string | null): string[] {
  if (!produkJson) return [];
  try {
    const parsed = JSON.parse(produkJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// --- Helper: Get cover image path ---

function getCoverImage(images: ImageRow[]): string {
  const cover = images.find(img => Boolean(img.is_cover));
  if (cover) return `/uploads/umkm/${cover.image_path}`;
  if (images.length > 0) return `/uploads/umkm/${images[0].image_path}`;
  return DEFAULT_COVER;
}

// --- Helper: Get gallery image paths ---

function getGaleri(images: ImageRow[]): string[] {
  return images
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(img => `/uploads/umkm/${img.image_path}`);
}

// =============================================
// PUBLIC REPOSITORY METHODS
// =============================================

/**
 * Get all UMKM for listing page (lightweight query)
 * Returns empty array on database failure — page renders gracefully.
 */
export async function getAllUmkm(): Promise<UmkmListItem[]> {
  try {
    const [umkmRows] = await pool.query<(UmkmRow & RowDataPacket)[]>(
      'SELECT * FROM umkm ORDER BY nama ASC'
    );

    if (umkmRows.length === 0) return [];

    const umkmIds = umkmRows.map(u => u.id);

    // Batch fetch operasional, tags, images for all UMKMs
    const [opRows] = await pool.query<(OperasionalRow & RowDataPacket)[]>(
      'SELECT * FROM operasional WHERE umkm_id IN (?)',
      [umkmIds]
    );

    const [tagRows] = await pool.query<(RowDataPacket)[]>(
      `SELECT ut.umkm_id, t.nama 
       FROM umkm_tags ut 
       JOIN tags t ON ut.tag_id = t.id 
       WHERE ut.umkm_id IN (?)`,
      [umkmIds]
    );

    const [imgRows] = await pool.query<(ImageRow & RowDataPacket)[]>(
      'SELECT * FROM images WHERE umkm_id IN (?) ORDER BY sort_order ASC',
      [umkmIds]
    );

    // Group by umkm_id
    const opByUmkm = groupBy(opRows, 'umkm_id');
    const tagsByUmkm = groupBy(tagRows, 'umkm_id');
    const imgsByUmkm = groupBy(imgRows, 'umkm_id');

    return umkmRows.map(row => ({
      id: row.id,
      slug: row.slug,
      nama: row.nama,
      pemilik: row.pemilik || '',
      kategori: row.kategori,
      deskripsiSingkat: row.deskripsi_singkat || '',
      tags: (tagsByUmkm[row.id] || []).map((t: RowDataPacket) => t.nama),
      whatsapp: row.whatsapp || '',
      alamat: row.alamat || '',
      latitude: row.latitude ? Number(row.latitude) : 0,
      longitude: row.longitude ? Number(row.longitude) : 0,
      fotoUtama: getCoverImage(imgsByUmkm[row.id] || []),
      jamOperasional: buildJamOperasional(opByUmkm[row.id] || []),
    }));
  } catch (error) {
    logQueryError('getAllUmkm', error);
    return [];
  }
}

/**
 * Get single UMKM by slug (full detail)
 * Returns null on database failure — detail page shows 404 gracefully.
 */
export async function getUmkmBySlug(slug: string): Promise<Umkm | null> {
  try {
    const [rows] = await pool.query<(UmkmRow & RowDataPacket)[]>(
      'SELECT * FROM umkm WHERE slug = ? LIMIT 1',
      [slug]
    );

    if (rows.length === 0) return null;

    const row = rows[0];

    // Fetch related data
    const [opRows] = await pool.query<(OperasionalRow & RowDataPacket)[]>(
      'SELECT * FROM operasional WHERE umkm_id = ?',
      [row.id]
    );

    const [tagRows] = await pool.query<(RowDataPacket)[]>(
      `SELECT t.nama 
       FROM umkm_tags ut 
       JOIN tags t ON ut.tag_id = t.id 
       WHERE ut.umkm_id = ?`,
      [row.id]
    );

    const [imgRows] = await pool.query<(ImageRow & RowDataPacket)[]>(
      'SELECT * FROM images WHERE umkm_id = ? ORDER BY sort_order ASC',
      [row.id]
    );

    return {
      id: row.id,
      slug: row.slug,
      nama: row.nama,
      pemilik: row.pemilik || '',
      kategori: row.kategori,
      deskripsiSingkat: row.deskripsi_singkat || '',
      deskripsiLengkap: row.deskripsi_lengkap || '',
      produk: parseProduk(row.produk),
      tags: tagRows.map(t => t.nama),
      whatsapp: row.whatsapp || '',
      alamat: row.alamat || '',
      jamOperasional: buildJamOperasional(opRows),
      latitude: row.latitude ? Number(row.latitude) : 0,
      longitude: row.longitude ? Number(row.longitude) : 0,
      googleMapsUrl: row.google_maps || '',
      fotoUtama: getCoverImage(imgRows),
      galeri: getGaleri(imgRows),
    };
  } catch (error) {
    logQueryError('getUmkmBySlug', error);
    return null;
  }
}

/**
 * Get aggregated stats for hero section
 * Returns default zeros on database failure — hero section still renders.
 */
export async function getUmkmStats(): Promise<UmkmStats> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as total, COUNT(DISTINCT kategori) as kategori FROM umkm'
    );
    return {
      totalUmkm: rows[0]?.total || 0,
      totalKategori: rows[0]?.kategori || 0,
    };
  } catch (error) {
    logQueryError('getUmkmStats', error);
    return DEFAULT_STATS;
  }
}

/**
 * Get all distinct kategori
 * Returns empty array on database failure — filter renders without options.
 */
export async function getKategoriList(): Promise<string[]> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT DISTINCT kategori FROM umkm ORDER BY kategori ASC'
    );
    return rows.map(r => r.kategori);
  } catch (error) {
    logQueryError('getKategoriList', error);
    return [];
  }
}

/**
 * Get all slugs (for sitemap or static paths)
 * Returns empty array on database failure.
 */
export async function getAllSlugs(): Promise<string[]> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT slug FROM umkm ORDER BY slug ASC'
    );
    return rows.map(r => r.slug);
  } catch (error) {
    logQueryError('getAllSlugs', error);
    return [];
  }
}

// --- Utility ---

function groupBy<T extends Record<string, unknown>>(arr: T[], key: string): Record<number, T[]> {
  return arr.reduce((acc, item) => {
    const k = item[key] as number;
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {} as Record<number, T[]>);
}
