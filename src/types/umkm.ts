// =============================================
// UMKM Ngadirejo - TypeScript Type Definitions
//
// All data comes from /data/umkm.json (static).
// No database, no Prisma.
// =============================================

import type { OpenStatusType } from '@/utils/umkmUtils';

/** Raw UMKM record — matches umkm.json structure exactly */
export interface RawUmkm {
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
  image_folder: string;
}

/** UMKM with generated slug — used throughout the app */
export interface Umkm extends RawUmkm {
  slug: string;
}

/** Lightweight item for listing/card views */
export interface UmkmListItem {
  no: number;
  slug: string;
  nama_umkm: string;
  profil_umkm: string;
  jenis_umkm: string;
  nama_pemilik: string | null;
  alamat: string | null;
  latitude: number | null;
  longitude: number | null;
  kontak: string | null;
  jam_operasional: string | null;
  image_folder: string;
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

/** Open/Closed status result */
export interface OpenStatusResult {
  status: OpenStatusType;
  label: string;
  closeTime?: string;
  openTime?: string;
}
