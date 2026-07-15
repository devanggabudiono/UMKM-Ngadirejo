"use client";
import { useState, useMemo } from "react";
import { Search, Compass, Map, AlertCircle, Clock } from "lucide-react";
import UmkmCard from "@/components/UmkmCard";
import MapWrapper from "@/components/MapWrapper";
import { calculateDistance, parseOpenStatus } from "@/utils/umkmUtils";
import type { UmkmListItem, UmkmWithDistance } from "@/types/umkm";

interface UmkmExplorerProps {
  initialData: UmkmListItem[];
  categories: string[];
}

export default function UmkmExplorer({ initialData, categories }: UmkmExplorerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [sortByDistance, setSortByDistance] = useState(false);
  const [filterOpenNow, setFilterOpenNow] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationPermission, setLocationPermission] = useState<"prompt" | "granted" | "denied" | "loading">("prompt");
  const [locationErrorMsg, setLocationErrorMsg] = useState("");

  const allCategories = ["Semua", ...categories];

  const requestLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setLocationErrorMsg("Browser Anda tidak mendukung deteksi lokasi.");
      return;
    }
    setLocationPermission("loading");
    setLocationErrorMsg("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setLocationPermission("granted");
        setLocationErrorMsg("");
        setSortByDistance(true);
      },
      (err) => {
        setLocationPermission("denied");
        setLocationErrorMsg(
          err.code === err.PERMISSION_DENIED
            ? "Izinkan akses lokasi untuk melihat UMKM terdekat."
            : "Gagal mendeteksi lokasi."
        );
        setSortByDistance(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSortByDistanceToggle = () => {
    if (sortByDistance) setSortByDistance(false);
    else if (userLocation) setSortByDistance(true);
    else requestLocation();
  };

  const processedUmkm = useMemo(() => {
    let list = initialData.filter((u) => {
      const matchCat = selectedCategory === "Semua" || u.jenis_umkm === selectedCategory;
      const q = searchQuery.toLowerCase();
      const matchSearch =
        u.nama_umkm.toLowerCase().includes(q) ||
        u.jenis_umkm.toLowerCase().includes(q) ||
        (u.alamat?.toLowerCase().includes(q) ?? false) ||
        u.profil_umkm.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });

    if (filterOpenNow) {
      list = list.filter((u) => parseOpenStatus(u.jam_operasional).status === "OPEN");
    }

    const withDist = list.map((u) => {
      if (userLocation && u.latitude && u.longitude) {
        return { ...u, distance: calculateDistance(userLocation.latitude, userLocation.longitude, u.latitude, u.longitude) };
      }
      return u;
    }) as UmkmWithDistance[];

    if (sortByDistance && userLocation) {
      withDist.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    }
    return withDist;
  }, [searchQuery, selectedCategory, userLocation, sortByDistance, filterOpenNow, initialData]);

  const resetAll = () => {
    setSearchQuery("");
    setSelectedCategory("Semua");
    setSortByDistance(false);
    setFilterOpenNow(false);
    setLocationErrorMsg("");
  };

  return (
    <>
      {locationErrorMsg && (
        <div className="bg-amber-50/80 backdrop-blur-sm border border-amber-200/60 text-amber-900 px-5 py-4 rounded-2xl text-sm flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <span className="font-semibold text-slate-700">{locationErrorMsg}</span>
          </div>
          <button onClick={requestLocation} className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm shrink-0">
            Izinkan Lokasi
          </button>
        </div>
      )}

      <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100/80 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-950">Jelajahi Usaha Lokal</h2>
            <p className="text-xs text-slate-500 mt-1">Gunakan pencarian dan filter di bawah untuk mempermudah pencarian.</p>
          </div>
          <span className="text-xs sm:text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-100/50 px-4 py-2 rounded-xl self-start md:self-center">
            {processedUmkm.length} Usaha Ditemukan
          </span>
        </div>

        <div className="relative shadow-sm rounded-2xl border border-slate-200/80 bg-slate-50/50 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:bg-white focus-within:border-emerald-500 transition-all">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Cari bakso, sembako, salon, bengkel, mebel..."
            className="block w-full pl-12 pr-4 py-4.5 rounded-2xl border-0 text-slate-900 bg-transparent placeholder:text-slate-400 outline-none text-base md:text-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pt-2">
          <div className="flex overflow-x-auto gap-2 pb-2.5 lg:pb-0 scrollbar-hide max-w-full">
            {allCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all border ${
                  selectedCategory === cat
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-200"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-emerald-300"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <button
              onClick={() => setFilterOpenNow(!filterOpenNow)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all border ${
                filterOpenNow
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Clock className={`w-4.5 h-4.5 ${filterOpenNow ? "text-emerald-600" : "text-slate-400"}`} />
              <span className="flex items-center gap-1.5">
                {filterOpenNow && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>}
                Buka Sekarang
              </span>
            </button>
            <button
              onClick={handleSortByDistanceToggle}
              disabled={locationPermission === "loading"}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all border ${
                sortByDistance
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Compass className={`w-4.5 h-4.5 ${locationPermission === "loading" ? "animate-spin text-emerald-600" : "text-slate-400"}`} />
              <span>{sortByDistance ? "Terdekat Aktif" : "Terdekat dari Saya"}</span>
            </button>
          </div>
        </div>
      </section>

      <section>
        {processedUmkm.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {processedUmkm.map((u) => (
              <UmkmCard
                key={u.no}
                no={u.no}
                slug={u.slug}
                nama_umkm={u.nama_umkm}
                jenis_umkm={u.jenis_umkm}
                profil_umkm={u.profil_umkm}
                kontak={u.kontak}
                jam_operasional={u.jam_operasional}
                distance={u.distance}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm max-w-xl mx-auto px-6">
            <div className="bg-rose-50 text-rose-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
              <Search className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-2">UMKM tidak ditemukan</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              {filterOpenNow
                ? "Tidak ada UMKM yang buka saat ini dengan filter yang dipilih."
                : "Coba gunakan kata kunci lain."}
            </p>
            <button
              onClick={resetAll}
              className="mt-6 inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-6 rounded-xl transition-all shadow-md shadow-emerald-200"
            >
              Reset Semua Filter
            </button>
          </div>
        )}
      </section>

      <section id="peta-sebaran" className="scroll-mt-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Map className="h-6 w-6 text-emerald-600" />
              <h2 className="text-2xl font-black text-slate-950">Peta Sebaran UMKM</h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">Peta lokasi interaktif UMKM Desa Ngadirejo.</p>
          </div>
          {userLocation && (
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100/50 w-fit">
              Lokasi Anda Aktif
            </span>
          )}
        </div>
        <div className="bg-white p-3 sm:p-5 rounded-3xl shadow-sm border border-slate-100/80 z-0">
          <MapWrapper
            markers={processedUmkm
              .filter((u) => u.latitude && u.longitude)
              .map((u) => ({
                id: u.no,
                slug: u.slug,
                nama: u.nama_umkm,
                kategori: u.jenis_umkm,
                latitude: u.latitude!,
                longitude: u.longitude!,
              }))}
          />
        </div>
      </section>
    </>
  );
}
