// =============================================
// UMKM Ngadirejo - TypeScript Type Definitions
// All interfaces matching the normalized database schema
// =============================================

// --- Database Row Types (1:1 mapping with tables) ---

export interface UmkmRow {
  id: number;
  slug: string;
  nama: string;
  pemilik: string | null;
  kategori: string;
  deskripsi_singkat: string | null;
  deskripsi_lengkap: string | null;
  produk: string | null; // JSON string in DB
  alamat: string | null;
  latitude: number | null;
  longitude: number | null;
  google_maps: string | null;
  whatsapp: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface OperasionalRow {
  id: number;
  umkm_id: number;
  hari: HariType;
  buka: string;
  tutup: string;
  libur: boolean | number; // MySQL returns 0/1
}

export interface TagRow {
  id: number;
  nama: string;
}

export interface ImageRow {
  id: number;
  umkm_id: number;
  image_path: string;
  is_cover: boolean | number;
  sort_order: number;
}

// --- Operational Schedule Types ---

export type HariType = 'senin' | 'selasa' | 'rabu' | 'kamis' | 'jumat' | 'sabtu' | 'minggu';

export interface JamHarian {
  buka: string;
  tutup: string;
  libur: boolean;
}

export interface JamOperasional {
  senin: JamHarian;
  selasa: JamHarian;
  rabu: JamHarian;
  kamis: JamHarian;
  jumat: JamHarian;
  sabtu: JamHarian;
  minggu: JamHarian;
}

// --- Aggregated Frontend Types ---

/**
 * Full UMKM detail — used on detail page (/umkm/[slug])
 * Result of JOIN queries across all related tables
 */
export interface Umkm {
  id: number;
  slug: string;
  nama: string;
  pemilik: string;
  kategori: string;
  deskripsiSingkat: string;
  deskripsiLengkap: string;
  produk: string[];
  tags: string[];
  whatsapp: string;
  alamat: string;
  jamOperasional: JamOperasional;
  latitude: number;
  longitude: number;
  googleMapsUrl: string;
  fotoUtama: string;
  galeri: string[];
}

/**
 * Lightweight UMKM item — used on listing/card views
 * Only includes fields needed for rendering cards
 */
export interface UmkmListItem {
  id: number;
  slug: string;
  nama: string;
  pemilik: string;
  kategori: string;
  deskripsiSingkat: string;
  tags: string[];
  whatsapp: string;
  alamat: string;
  latitude: number;
  longitude: number;
  fotoUtama: string;
  jamOperasional: JamOperasional;
}

/** UMKM item with calculated distance (client-side) */
export interface UmkmWithDistance extends UmkmListItem {
  distance?: number;
}

/** Aggregate stats for the hero section */
export interface UmkmStats {
  totalUmkm: number;
  totalKategori: number;
}
