/**
 * Menghitung jarak antara dua titik koordinat menggunakan rumus Haversine
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Format nomor WhatsApp agar selalu diawali 62
 */
export function formatWhatsApp(kontak: string | null): string {
  if (!kontak) return '';
  let cleaned = kontak.replace(/[^\d]/g, '');
  if (cleaned.length === 0) return '';
  if (cleaned.startsWith('0')) cleaned = '62' + cleaned.substring(1);
  if (!cleaned.startsWith('62')) cleaned = '62' + cleaned;
  return cleaned;
}

// =============================================
// Open/Closed Status Parser
// =============================================

export type OpenStatusType = 'OPEN' | 'CLOSED' | 'UNKNOWN';

export interface OpenStatus {
  status: OpenStatusType;
  label: string;
  /** e.g. "20.00" */
  closeTime?: string;
  /** e.g. "07.00" */
  openTime?: string;
}

/**
 * Parse jam_operasional string and determine if the business is currently open.
 *
 * Supports all known formats:
 *   "07.00 - 20.00 WIB"
 *   "07:00-20:00"
 *   "24 jam" / "buka 24 jam" / "24 Jam Setiap Hari"
 *   "Kondisional" / "kondisional, sesuai pesanan"
 *   "07.00 WIB - selesai"
 *   "12.-00-15.00 WIB" (typo handling)
 *   null / "-"
 */
export function parseOpenStatus(jam: string | null): OpenStatus {
  if (!jam || jam.trim() === '' || jam.trim() === '-') {
    return { status: 'UNKNOWN', label: 'Tidak diketahui' };
  }

  const cleaned = jam.trim();
  const lower = cleaned.toLowerCase();

  // --- "24 jam" variants ---
  if (/24\s*jam/i.test(lower) || lower === 'buka 24 jam') {
    return { status: 'OPEN', label: 'Buka 24 Jam' };
  }

  // --- "Kondisional" variants ---
  if (/kondisional/i.test(lower)) {
    return { status: 'UNKNOWN', label: 'Kondisional' };
  }

  // --- "selesai" variant: "07.00 WIB - selesai" ---
  if (/selesai/i.test(lower)) {
    const openMatch = lower.match(/(\d{1,2})[.:](\d{2})/);
    if (openMatch) {
      const openH = parseInt(openMatch[1], 10);
      const openM = parseInt(openMatch[2], 10);
      const now = getCurrentTime();
      const openTime = formatTime(openH, openM);
      if (now.h > openH || (now.h === openH && now.m >= openM)) {
        return { status: 'OPEN', label: `Buka sejak ${openTime}`, openTime };
      } else {
        return { status: 'CLOSED', label: `Tutup · Buka pukul ${openTime}`, openTime };
      }
    }
    return { status: 'UNKNOWN', label: cleaned };
  }

  // --- "Jam 08.00" (single time, no closing time) ---
  const singleTimeMatch = lower.match(/^jam\s+(\d{1,2})[.:](\d{2})$/i);
  if (singleTimeMatch) {
    const openH = parseInt(singleTimeMatch[1], 10);
    const openM = parseInt(singleTimeMatch[2], 10);
    const now = getCurrentTime();
    const openTime = formatTime(openH, openM);
    if (now.h > openH || (now.h === openH && now.m >= openM)) {
      return { status: 'OPEN', label: `Buka sejak ${openTime}`, openTime };
    } else {
      return { status: 'CLOSED', label: `Tutup · Buka pukul ${openTime}`, openTime };
    }
  }

  // --- Standard time range: extract open and close times ---
  // Handle typos like "12.-00-15.00" → normalize dots and dashes
  const normalized = cleaned
    .replace(/\.-/g, '.')   // "12.-00" → "12.00"
    .replace(/\s+/g, ' ');

  // Match patterns like "07.00-20.00", "07:00 - 20:00", "jam 06:00 - 19:00"
  const rangeMatch = normalized.match(
    /(?:jam\s+)?(\d{1,2})[.:](\d{2})\s*-\s*(\d{1,2})[.:](\d{2})/i
  );

  if (rangeMatch) {
    const openH = parseInt(rangeMatch[1], 10);
    const openM = parseInt(rangeMatch[2], 10);
    const closeH = parseInt(rangeMatch[3], 10);
    const closeM = parseInt(rangeMatch[4], 10);

    const openTime = formatTime(openH, openM);
    const closeTime = formatTime(closeH, closeM);

    const now = getCurrentTime();
    const nowMinutes = now.h * 60 + now.m;
    const openMinutes = openH * 60 + openM;
    let closeMinutes = closeH * 60 + closeM;

    // Handle overnight (e.g. 07.00-00.00 means midnight)
    if (closeMinutes <= openMinutes) {
      closeMinutes += 24 * 60;
    }

    const isOpen = nowMinutes >= openMinutes && nowMinutes < closeMinutes;

    if (isOpen) {
      return {
        status: 'OPEN',
        label: `Buka · Tutup pukul ${closeTime}`,
        openTime,
        closeTime,
      };
    } else {
      return {
        status: 'CLOSED',
        label: `Tutup · Buka pukul ${openTime}`,
        openTime,
        closeTime,
      };
    }
  }

  // --- Fallback: unrecognized format ---
  return { status: 'UNKNOWN', label: cleaned };
}

function formatTime(h: number, m: number): string {
  return `${String(h).padStart(2, '0')}.${String(m).padStart(2, '0')}`;
}

function getCurrentTime(): { h: number; m: number } {
  const now = new Date();
  return { h: now.getHours(), m: now.getMinutes() };
}
