"use client";
import { useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";
import { getAllImages, getPlaceholder } from "@/utils/imageUtils";

interface UmkmGalleryProps {
  no: number;
  nama_umkm: string;
}

export default function UmkmGallery({ no, nama_umkm }: UmkmGalleryProps) {
  const images = getAllImages(no);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  // Filter out failed images
  const validImages = images.filter((src) => !failedImages.has(src));

  const handleError = (src: string) => {
    setFailedImages((prev) => new Set(prev).add(src));
  };

  // Nothing to show
  if (validImages.length === 0) {
    return null;
  }

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const goNext = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex + 1) % validImages.length);
    }
  };
  const goPrev = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex - 1 + validImages.length) % validImages.length);
    }
  };

  return (
    <>
      <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-sm border border-slate-100/80">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
          <ImageIcon className="w-5 h-5 text-emerald-600" />
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">Galeri Foto</h2>
        </div>

        {validImages.length === 1 ? (
          /* Single image */
          <div
            className="relative w-full aspect-video rounded-2xl overflow-hidden cursor-pointer group"
            onClick={() => openLightbox(0)}
          >
            <Image
              src={validImages[0]}
              alt={`${nama_umkm} - Foto 1`}
              fill
              sizes="(max-width: 1024px) 100vw, 66vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => handleError(validImages[0])}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </div>
        ) : (
          /* Multiple images grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {validImages.map((src, i) => (
              <div
                key={src}
                className={`relative rounded-2xl overflow-hidden cursor-pointer group ${
                  i === 0 ? "col-span-2 sm:col-span-2 aspect-video" : "aspect-square"
                }`}
                onClick={() => openLightbox(i)}
              >
                <Image
                  src={src}
                  alt={`${nama_umkm} - Foto ${i + 1}`}
                  fill
                  sizes={i === 0 ? "(max-width: 1024px) 100vw, 44vw" : "(max-width: 1024px) 50vw, 22vw"}
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={() => handleError(src)}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all z-10"
          >
            <X className="w-6 h-6" />
          </button>

          {validImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
                className="absolute left-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition-all z-10"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goNext(); }}
                className="absolute right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition-all z-10"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          <div
            className="relative w-full max-w-4xl aspect-video"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={validImages[lightboxIndex]}
              alt={`${nama_umkm} - Foto ${lightboxIndex + 1}`}
              fill
              sizes="100vw"
              className="object-contain"
              priority
            />
          </div>

          {validImages.length > 1 && (
            <div className="absolute bottom-4 text-white/70 text-sm font-semibold">
              {lightboxIndex + 1} / {validImages.length}
            </div>
          )}
        </div>
      )}
    </>
  );
}
