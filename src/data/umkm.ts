/**
 * UMKM Types — Legacy re-export file
 * 
 * This file previously contained hardcoded UMKM data.
 * All data now comes from MySQL database via repositories.
 * 
 * Types are centralized in @/types/umkm.ts
 * This file exists only for backward compatibility.
 */

export type { Umkm, UmkmListItem, UmkmWithDistance, JamOperasional, JamHarian, UmkmStats } from "@/types/umkm";
