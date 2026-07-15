/**
 * Image utility functions for UMKM Ngadirejo
 *
 * All image paths are relative to /public.
 * Images are served from /images/umkm/{no}/
 * Manifest is generated at build time by scripts/generate-image-manifest.cjs
 */
import imageManifest from '@/data/image-manifest.json';

const PLACEHOLDER = '/images/placeholder.webp';

type ManifestEntry = { cover: boolean; gallery: number[] };
const manifest = imageManifest as Record<string, ManifestEntry>;

/**
 * Get the cover image path for a UMKM.
 * Falls back to placeholder if no cover exists.
 */
export function getCoverImage(no: number): string {
  const key = String(no);
  if (manifest[key]?.cover) {
    return `/images/umkm/${no}/cover.webp`;
  }
  return PLACEHOLDER;
}

/**
 * Check if a UMKM has a real cover image (not placeholder)
 */
export function hasCoverImage(no: number): boolean {
  return manifest[String(no)]?.cover === true;
}

/**
 * Get all gallery image paths for a UMKM.
 * Returns empty array if no gallery images exist.
 */
export function getGalleryImages(no: number): string[] {
  const key = String(no);
  const entry = manifest[key];
  if (!entry?.gallery?.length) return [];
  return entry.gallery.map((n) => `/images/umkm/${no}/${n}.webp`);
}

/**
 * Get all images (cover + gallery) for a UMKM.
 */
export function getAllImages(no: number): string[] {
  const images: string[] = [];
  const key = String(no);
  const entry = manifest[key];

  if (entry?.cover) {
    images.push(`/images/umkm/${no}/cover.webp`);
  }
  if (entry?.gallery?.length) {
    for (const n of entry.gallery) {
      images.push(`/images/umkm/${no}/${n}.webp`);
    }
  }

  return images;
}

/**
 * Get the placeholder image path
 */
export function getPlaceholder(): string {
  return PLACEHOLDER;
}
