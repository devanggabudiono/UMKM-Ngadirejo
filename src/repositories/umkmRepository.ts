import type { RawUmkm, Umkm, UmkmListItem, UmkmStats } from '@/types/umkm';
import rawData from '@/data/umkm.json';

// =============================================
// UMKM Repository — Static JSON, no database
//
// Reads from /data/umkm.json at import time.
// All methods are synchronous.
// =============================================

// --- Slug Generator ---

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

// --- Build data once at import time ---

const allUmkm: Umkm[] = (rawData as RawUmkm[]).map((raw) => {
  const slug = generateSlug(raw.nama_umkm);
  return { ...raw, slug };
});

// Deduplicate slugs
const slugCount = new Map<string, number>();
for (const u of allUmkm) {
  const count = slugCount.get(u.slug) || 0;
  if (count > 0) u.slug = `${u.slug}-${count}`;
  slugCount.set(u.slug.replace(/-\d+$/, ''), count + 1);
}

function toListItem(u: Umkm): UmkmListItem {
  return {
    no: u.no,
    slug: u.slug,
    nama_umkm: u.nama_umkm,
    profil_umkm: u.profil_umkm,
    jenis_umkm: u.jenis_umkm,
    nama_pemilik: u.nama_pemilik,
    alamat: u.alamat,
    latitude: u.latitude,
    longitude: u.longitude,
    kontak: u.kontak,
    jam_operasional: u.jam_operasional,
    image_folder: u.image_folder,
  };
}

// =============================================
// PUBLIC METHODS (all synchronous)
// =============================================

export function getAllUmkm(): UmkmListItem[] {
  return allUmkm
    .slice()
    .sort((a, b) => a.nama_umkm.localeCompare(b.nama_umkm))
    .map(toListItem);
}

export function getUmkmBySlug(slug: string): Umkm | null {
  return allUmkm.find((u) => u.slug === slug) ?? null;
}

export function getUmkmById(no: number): Umkm | null {
  return allUmkm.find((u) => u.no === no) ?? null;
}

export function getUmkmStats(): UmkmStats {
  const kategori = new Set(allUmkm.map((u) => u.jenis_umkm));
  return { totalUmkm: allUmkm.length, totalKategori: kategori.size };
}

export function getKategoriList(): string[] {
  const set = new Set<string>();
  for (const u of allUmkm) {
    if (u.jenis_umkm && u.jenis_umkm.trim()) set.add(u.jenis_umkm.trim());
  }
  return Array.from(set).sort();
}

export function getAllSlugs(): string[] {
  return allUmkm.map((u) => u.slug).sort();
}

export function searchUmkm(query: string): UmkmListItem[] {
  const q = query.toLowerCase();
  return allUmkm
    .filter(
      (u) =>
        u.nama_umkm.toLowerCase().includes(q) ||
        u.profil_umkm.toLowerCase().includes(q) ||
        u.jenis_umkm.toLowerCase().includes(q) ||
        (u.nama_pemilik?.toLowerCase().includes(q) ?? false) ||
        (u.alamat?.toLowerCase().includes(q) ?? false)
    )
    .sort((a, b) => a.nama_umkm.localeCompare(b.nama_umkm))
    .map(toListItem);
}

export function getByCategory(kategori: string): UmkmListItem[] {
  return allUmkm
    .filter((u) => u.jenis_umkm === kategori)
    .sort((a, b) => a.nama_umkm.localeCompare(b.nama_umkm))
    .map(toListItem);
}
