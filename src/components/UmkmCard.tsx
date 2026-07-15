"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MessageCircle, MapPin, Clock } from "lucide-react";
import { formatWhatsApp, parseOpenStatus } from "@/utils/umkmUtils";
import { getCoverImage } from "@/utils/imageUtils";

interface UmkmCardProps {
  no: number;
  slug: string;
  nama_umkm: string;
  jenis_umkm: string;
  profil_umkm: string;
  kontak: string | null;
  jam_operasional: string | null;
  distance?: number;
}

export default function UmkmCard({
  no,
  slug,
  nama_umkm,
  jenis_umkm,
  profil_umkm,
  kontak,
  jam_operasional,
  distance,
}: UmkmCardProps) {
  const waNumber = formatWhatsApp(kontak);
  const waUrl = waNumber
    ? `https://wa.me/${waNumber}?text=Halo%20${encodeURIComponent(nama_umkm)},%20saya%20melihat%20usaha%20Anda%20di%20Website%20UMKM%20Desa%20Ngadirejo.`
    : "";

  const coverSrc = getCoverImage(no);
  const [imgError, setImgError] = useState(false);
  const displaySrc = imgError ? "/images/placeholder.webp" : coverSrc;

  const openStatus = parseOpenStatus(jam_operasional);

  const statusDotColor =
    openStatus.status === "OPEN"
      ? "bg-emerald-500"
      : openStatus.status === "CLOSED"
        ? "bg-rose-500"
        : "bg-slate-400";

  const statusBadgeBg =
    openStatus.status === "OPEN"
      ? "bg-emerald-500/90 text-white border-emerald-400/20"
      : openStatus.status === "CLOSED"
        ? "bg-rose-500/90 text-white border-rose-400/20"
        : "bg-slate-500/80 text-white border-slate-400/20";

  const statusText =
    openStatus.status === "OPEN"
      ? "Buka"
      : openStatus.status === "CLOSED"
        ? "Tutup"
        : "";

  return (
    <div className="bg-white rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden border border-slate-100 flex flex-col h-full group">
      {/* Thumbnail Area */}
      <div className="relative h-44 w-full overflow-hidden bg-slate-100">
        <Image
          src={displaySrc}
          alt={nama_umkm}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          onError={() => setImgError(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-transparent"></div>

        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <span className="bg-white/95 backdrop-blur-sm text-emerald-800 text-[10px] sm:text-xs font-extrabold px-3 py-1.5 rounded-full shadow-sm tracking-wide uppercase border border-slate-100/30">
            {jenis_umkm}
          </span>
        </div>

        {/* Open/Closed Status Badge */}
        {statusText && (
          <div className="absolute top-3 right-3">
            <span className={`backdrop-blur-sm text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5 border ${statusBadgeBg}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusDotColor} ${openStatus.status === "OPEN" ? "animate-pulse" : ""}`}></span>
              {statusText}
            </span>
          </div>
        )}

        {/* Jam Operasional - bottom right */}
        {jam_operasional && (
          <div className="absolute bottom-3 right-3">
            <span className="bg-black/50 backdrop-blur-sm text-white text-[9px] sm:text-[10px] font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1 border border-white/10">
              <Clock className="w-2.5 h-2.5" />
              {jam_operasional.length > 20 ? jam_operasional.substring(0, 18) + '…' : jam_operasional}
            </span>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="p-6 flex-1 flex flex-col">
        <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2 line-clamp-1 group-hover:text-emerald-700 transition-colors">
          {nama_umkm}
        </h3>
        <p className="text-slate-500 text-xs sm:text-sm mb-4 line-clamp-2 leading-relaxed flex-grow">
          {profil_umkm}
        </p>

        {distance !== undefined && (
          <div className="flex items-center gap-1.5 text-slate-600 text-xs mb-4 font-semibold bg-emerald-50/50 border border-emerald-100/60 p-2.5 rounded-xl w-fit">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 animate-bounce" />
            <span>{distance.toFixed(1)} km dari Anda</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 mt-auto">
          <Link href={`/umkm/${slug}`} className="text-center bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-3 px-4 rounded-xl transition-all shadow-sm hover:shadow-md">
            Lihat Detail
          </Link>
          {waUrl ? (
            <a href={waUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold py-3 px-4 rounded-xl transition-all border border-emerald-100">
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </a>
          ) : (
            <span className="flex items-center justify-center gap-1.5 bg-slate-50 text-slate-400 text-xs font-bold py-3 px-4 rounded-xl border border-slate-100 cursor-not-allowed">
              <MessageCircle className="w-4 h-4" />
              <span>N/A</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
