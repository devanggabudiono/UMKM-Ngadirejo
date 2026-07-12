import prisma from '@/lib/prisma';
import type { Umkm, UmkmListItem, JamOperasional, JamHarian, UmkmStats, HariType } from '@/types/umkm';
import type { Operasional, Image as PrismaImage } from '@prisma/client';

// =============================================
// UMKM Repository — All database queries via Prisma
// No raw SQL should exist outside this file.
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
  console.error(
    `[UmkmRepository.${functionName}] ❌ Query failed:`,
    error instanceof Error ? error.message : String(error)
  );
}

// --- Helper: Build JamOperasional from operasional rows ---

function buildJamOperasional(rows: Operasional[]): JamOperasional {
  const jam = { ...DEFAULT_JAM_OPERASIONAL };
  for (const row of rows) {
    jam[row.hari as HariType] = {
      buka: row.buka || '00:00',
      tutup: row.tutup || '00:00',
      libur: row.libur,
    };
  }
  return jam;
}

// --- Helper: Parse produk JSON safely ---

function parseProduk(produkJson: unknown): string[] {
  if (!produkJson) return [];
  try {
    const parsed = typeof produkJson === 'string' ? JSON.parse(produkJson) : produkJson;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// --- Helper: Get cover image path ---

function getCoverImage(images: PrismaImage[]): string {
  const cover = images.find(img => img.isCover);
  if (cover) return `/uploads/umkm/${cover.imagePath}`;
  if (images.length > 0) return `/uploads/umkm/${images[0].imagePath}`;
  return DEFAULT_COVER;
}

// --- Helper: Get gallery image paths ---

function getGaleri(images: PrismaImage[]): string[] {
  return images
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(img => `/uploads/umkm/${img.imagePath}`);
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
    const umkmRows = await prisma.umkm.findMany({
      orderBy: { nama: 'asc' },
      include: {
        operasional: true,
        images: { orderBy: { sortOrder: 'asc' } },
        tags: {
          include: { tag: true },
        },
      },
    });

    return umkmRows.map(row => ({
      id: row.id,
      slug: row.slug,
      nama: row.nama,
      pemilik: row.pemilik || '',
      kategori: row.kategori,
      deskripsiSingkat: row.deskripsiSingkat || '',
      tags: row.tags.map(t => t.tag.nama),
      whatsapp: row.whatsapp || '',
      alamat: row.alamat || '',
      latitude: row.latitude ? Number(row.latitude) : 0,
      longitude: row.longitude ? Number(row.longitude) : 0,
      fotoUtama: getCoverImage(row.images),
      jamOperasional: buildJamOperasional(row.operasional),
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
    const row = await prisma.umkm.findUnique({
      where: { slug },
      include: {
        operasional: true,
        images: { orderBy: { sortOrder: 'asc' } },
        tags: {
          include: { tag: true },
        },
      },
    });

    if (!row) return null;

    return {
      id: row.id,
      slug: row.slug,
      nama: row.nama,
      pemilik: row.pemilik || '',
      kategori: row.kategori,
      deskripsiSingkat: row.deskripsiSingkat || '',
      deskripsiLengkap: row.deskripsiLengkap || '',
      produk: parseProduk(row.produk),
      tags: row.tags.map(t => t.tag.nama),
      whatsapp: row.whatsapp || '',
      alamat: row.alamat || '',
      jamOperasional: buildJamOperasional(row.operasional),
      latitude: row.latitude ? Number(row.latitude) : 0,
      longitude: row.longitude ? Number(row.longitude) : 0,
      googleMapsUrl: row.googleMaps || '',
      fotoUtama: getCoverImage(row.images),
      galeri: getGaleri(row.images),
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
    const [totalUmkm, kategoriRows] = await Promise.all([
      prisma.umkm.count(),
      prisma.umkm.findMany({
        distinct: ['kategori'],
        select: { kategori: true },
      }),
    ]);

    return {
      totalUmkm,
      totalKategori: kategoriRows.length,
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
    const rows = await prisma.umkm.findMany({
      distinct: ['kategori'],
      select: { kategori: true },
      orderBy: { kategori: 'asc' },
    });
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
    const rows = await prisma.umkm.findMany({
      select: { slug: true },
      orderBy: { slug: 'asc' },
    });
    return rows.map(r => r.slug);
  } catch (error) {
    logQueryError('getAllSlugs', error);
    return [];
  }
}

/**
 * Search UMKM by name, description, or category
 * Returns empty array on database failure.
 */
export async function searchUmkm(query: string): Promise<UmkmListItem[]> {
  try {
    const umkmRows = await prisma.umkm.findMany({
      where: {
        OR: [
          { nama: { contains: query, mode: 'insensitive' } },
          { deskripsiSingkat: { contains: query, mode: 'insensitive' } },
          { deskripsiLengkap: { contains: query, mode: 'insensitive' } },
          { kategori: { contains: query, mode: 'insensitive' } },
          { pemilik: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { nama: 'asc' },
      include: {
        operasional: true,
        images: { orderBy: { sortOrder: 'asc' } },
        tags: { include: { tag: true } },
      },
    });

    return umkmRows.map(row => ({
      id: row.id,
      slug: row.slug,
      nama: row.nama,
      pemilik: row.pemilik || '',
      kategori: row.kategori,
      deskripsiSingkat: row.deskripsiSingkat || '',
      tags: row.tags.map(t => t.tag.nama),
      whatsapp: row.whatsapp || '',
      alamat: row.alamat || '',
      latitude: row.latitude ? Number(row.latitude) : 0,
      longitude: row.longitude ? Number(row.longitude) : 0,
      fotoUtama: getCoverImage(row.images),
      jamOperasional: buildJamOperasional(row.operasional),
    }));
  } catch (error) {
    logQueryError('searchUmkm', error);
    return [];
  }
}

/**
 * Get UMKM by category
 * Returns empty array on database failure.
 */
export async function getByCategory(kategori: string): Promise<UmkmListItem[]> {
  try {
    const umkmRows = await prisma.umkm.findMany({
      where: { kategori },
      orderBy: { nama: 'asc' },
      include: {
        operasional: true,
        images: { orderBy: { sortOrder: 'asc' } },
        tags: { include: { tag: true } },
      },
    });

    return umkmRows.map(row => ({
      id: row.id,
      slug: row.slug,
      nama: row.nama,
      pemilik: row.pemilik || '',
      kategori: row.kategori,
      deskripsiSingkat: row.deskripsiSingkat || '',
      tags: row.tags.map(t => t.tag.nama),
      whatsapp: row.whatsapp || '',
      alamat: row.alamat || '',
      latitude: row.latitude ? Number(row.latitude) : 0,
      longitude: row.longitude ? Number(row.longitude) : 0,
      fotoUtama: getCoverImage(row.images),
      jamOperasional: buildJamOperasional(row.operasional),
    }));
  } catch (error) {
    logQueryError('getByCategory', error);
    return [];
  }
}

/**
 * Get single UMKM by ID (full detail)
 * Returns null on database failure.
 */
export async function getUmkmById(id: number): Promise<Umkm | null> {
  try {
    const row = await prisma.umkm.findUnique({
      where: { id },
      include: {
        operasional: true,
        images: { orderBy: { sortOrder: 'asc' } },
        tags: { include: { tag: true } },
      },
    });

    if (!row) return null;

    return {
      id: row.id,
      slug: row.slug,
      nama: row.nama,
      pemilik: row.pemilik || '',
      kategori: row.kategori,
      deskripsiSingkat: row.deskripsiSingkat || '',
      deskripsiLengkap: row.deskripsiLengkap || '',
      produk: parseProduk(row.produk),
      tags: row.tags.map(t => t.tag.nama),
      whatsapp: row.whatsapp || '',
      alamat: row.alamat || '',
      jamOperasional: buildJamOperasional(row.operasional),
      latitude: row.latitude ? Number(row.latitude) : 0,
      longitude: row.longitude ? Number(row.longitude) : 0,
      googleMapsUrl: row.googleMaps || '',
      fotoUtama: getCoverImage(row.images),
      galeri: getGaleri(row.images),
    };
  } catch (error) {
    logQueryError('getUmkmById', error);
    return null;
  }
}
