import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, MapPin, MessageCircle, User, Info, ExternalLink } from "lucide-react";
import MapWrapper from "@/components/MapWrapper";
import OpenStatusBadge from "@/components/OpenStatusBadge";
import ShareButton from "@/components/ShareButton";
import UmkmGallery from "@/components/UmkmGallery";
import { getUmkmBySlug } from "@/repositories/umkmRepository";
import { formatWhatsApp } from "@/utils/umkmUtils";
import { getCoverImage, hasCoverImage } from "@/utils/imageUtils";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const umkm = getUmkmBySlug(slug);
  if (!umkm) return { title: "UMKM Tidak Ditemukan" };
  return {
    title: `${umkm.nama_umkm} — UMKM Desa Ngadirejo`,
    description: umkm.profil_umkm,
    openGraph: {
      title: `${umkm.nama_umkm} — UMKM Desa Ngadirejo`,
      description: umkm.profil_umkm,
      type: "website",
    },
  };
}

export default async function UmkmDetail({ params }: PageProps) {
  const { slug } = await params;
  const umkm = getUmkmBySlug(slug);
  if (!umkm) notFound();

  const waNumber = formatWhatsApp(umkm.kontak);
  const waUrl = waNumber
    ? `https://wa.me/${waNumber}?text=Halo%20${encodeURIComponent(umkm.nama_umkm)},%20saya%20melihat%20usaha%20Anda%20di%20Website%20UMKM%20Desa%20Ngadirejo.`
    : "";

  const coverSrc = getCoverImage(umkm.no);
  const hasRealCover = hasCoverImage(umkm.no);

  return (
    <div className="bg-slate-50/50 min-h-screen pb-24">
      {/* Hero with cover image */}
      <div className="relative h-72 md:h-[400px] w-full bg-gradient-to-br from-emerald-800 to-emerald-950 overflow-hidden">
        {hasRealCover && (
          <Image
            src={coverSrc}
            alt={umkm.nama_umkm}
            fill
            sizes="100vw"
            className="object-cover opacity-40"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-transparent"></div>
        <div className="absolute inset-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-10">
          <Link
            href="/"
            className="inline-flex items-center text-emerald-300 hover:text-white transition-all text-sm font-semibold mb-6 w-fit bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 hover:bg-white/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Daftar UMKM
          </Link>
          <span className="bg-emerald-600 border border-emerald-500/20 text-white text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-full w-fit mb-4 uppercase tracking-wider">
            {umkm.jenis_umkm}
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-3 tracking-tight">
            {umkm.nama_umkm}
          </h1>
          {umkm.nama_pemilik && (
            <p className="text-slate-300 text-sm sm:text-base flex items-center gap-2 font-medium">
              <User className="w-4.5 h-4.5 text-emerald-400" />
              <span>
                Pemilik: <span className="text-white font-semibold">{umkm.nama_pemilik}</span>
              </span>
            </p>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* About section */}
            <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-sm border border-slate-100/80">
              <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                <Info className="w-5 h-5 text-emerald-600" />
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">Tentang Usaha Ini</h2>
              </div>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">{umkm.profil_umkm}</p>
            </div>

            {/* Gallery */}
            <UmkmGallery no={umkm.no} nama_umkm={umkm.nama_umkm} />
          </div>

          <div className="space-y-6 lg:-mt-16">
            {/* Contact info */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-md border border-emerald-100/30 relative z-10">
              <h3 className="text-lg sm:text-xl font-black text-slate-950 mb-6 border-b border-slate-100 pb-4">
                Informasi Kontak
              </h3>
              <div className="space-y-5 mb-8">
                {umkm.alamat && (
                  <div className="flex gap-3.5 items-start">
                    <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-600 mt-0.5 border border-emerald-100/50">
                      <MapPin className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">Alamat Lengkap</h4>
                      <p className="text-slate-500 text-xs sm:text-sm mt-1 leading-relaxed">{umkm.alamat}</p>
                    </div>
                  </div>
                )}
                <div className="pt-4 border-t border-slate-100">
                  <OpenStatusBadge jam_operasional={umkm.jam_operasional} />
                </div>
              </div>
              <div className="space-y-3">
                {waUrl ? (
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white w-full py-4 px-5 rounded-2xl font-bold text-sm sm:text-base transition-all shadow-md shadow-emerald-200/50 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
                  >
                    <MessageCircle className="w-5.5 h-5.5 shrink-0" />
                    Hubungi via WhatsApp
                  </a>
                ) : (
                  <div className="flex items-center justify-center gap-2 bg-slate-200 text-slate-500 w-full py-4 px-5 rounded-2xl font-bold text-sm sm:text-base cursor-not-allowed">
                    <MessageCircle className="w-5.5 h-5.5 shrink-0" />
                    WhatsApp Belum Tersedia
                  </div>
                )}
                <ShareButton />
              </div>
            </div>

            {/* Map */}
            {umkm.latitude && umkm.longitude && (
              <div className="bg-white p-3 rounded-3xl shadow-sm border border-slate-100/80 overflow-hidden relative z-0">
                <div className="p-3">
                  <h3 className="text-sm sm:text-base font-black text-slate-900">Peta Lokasi Usaha</h3>
                </div>
                <div className="rounded-2xl overflow-hidden border border-slate-100">
                  <MapWrapper
                    markers={[
                      {
                        id: umkm.no,
                        slug: umkm.slug,
                        nama: umkm.nama_umkm,
                        kategori: umkm.jenis_umkm,
                        latitude: umkm.latitude,
                        longitude: umkm.longitude,
                      },
                    ]}
                    center={[umkm.latitude, umkm.longitude]}
                    zoom={16}
                    singleMode={true}
                    height="220px"
                  />
                </div>
                {umkm.link_gmaps && (
                  <div className="p-3">
                    <a
                      href={umkm.link_gmaps}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 text-slate-700 w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all"
                    >
                      <span>Buka di Google Maps</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
