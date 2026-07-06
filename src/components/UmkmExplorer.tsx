"use client";
import { useState, useMemo } from "react";
import { Search, MapPin, Compass, Clock, AlertCircle, Map } from "lucide-react";
import UmkmCard from "@/components/UmkmCard";
import MapWrapper from "@/components/MapWrapper";
import { calculateDistance, isUmkmOpen } from "@/utils/umkmUtils";
import type { UmkmListItem, UmkmWithDistance } from "@/types/umkm";

interface UmkmExplorerProps {
  initialData: UmkmListItem[];
  categories: string[];
}

export default function UmkmExplorer({ initialData, categories }: UmkmExplorerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [sortByDistance, setSortByDistance] = useState(false);
  
  // Geolocation States
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
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationPermission("granted");
        setLocationErrorMsg("");
        setSortByDistance(true);
      },
      (error) => {
        setLocationPermission("denied");
        if (error.code === error.PERMISSION_DENIED) {
          setLocationErrorMsg("Izinkan akses lokasi untuk melihat UMKM terdekat dari posisi Anda.");
        } else {
          setLocationErrorMsg("Gagal mendeteksi lokasi Anda. Silakan coba lagi.");
        }
        setSortByDistance(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSortByDistanceToggle = () => {
    if (sortByDistance) {
      setSortByDistance(false);
    } else {
      if (userLocation) {
        setSortByDistance(true);
      } else {
        requestLocation();
      }
    }
  };

  // Filter & Sort UMKM
  const processedUmkm = useMemo(() => {
    // 1. Filter list based on category, search queries, and open status
    const list = initialData.filter((umkm) => {
      const matchCategory = selectedCategory === "Semua" || umkm.kategori === selectedCategory;
      
      const searchLower = searchQuery.toLowerCase();
      const matchSearch = 
        umkm.nama.toLowerCase().includes(searchLower) ||
        umkm.kategori.toLowerCase().includes(searchLower) ||
        umkm.alamat.toLowerCase().includes(searchLower) ||
        umkm.deskripsiSingkat.toLowerCase().includes(searchLower) ||
        umkm.tags.some(tag => tag.toLowerCase().includes(searchLower));

      const isOpen = isUmkmOpen(umkm.jamOperasional);
      const matchOpen = !onlyOpen || isOpen;
        
      return matchCategory && matchSearch && matchOpen;
    });

    // 2. Map distance if user location is available
    const listWithDistance = list.map((umkm) => {
      if (userLocation && umkm.latitude !== undefined && umkm.longitude !== undefined && umkm.latitude !== 0 && umkm.longitude !== 0) {
        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          umkm.latitude,
          umkm.longitude
        );
        return { ...umkm, distance };
      }
      return umkm;
    }) as UmkmWithDistance[];

    // 3. Sort by distance if toggled
    if (sortByDistance && userLocation) {
      listWithDistance.sort((a, b) => {
        if (a.distance === undefined) return 1;
        if (b.distance === undefined) return -1;
        return a.distance - b.distance;
      });
    }

    return listWithDistance;
  }, [searchQuery, selectedCategory, onlyOpen, userLocation, sortByDistance, initialData]);

  return (
    <>
      {/* Location Banner (Friendly warning when permission denied) */}
      {locationErrorMsg && (
        <div className="bg-amber-50/80 backdrop-blur-sm border border-amber-200/60 text-amber-900 px-5 py-4 rounded-2xl text-sm flex items-center justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <span className="font-semibold text-slate-700">{locationErrorMsg}</span>
          </div>
          <button 
            onClick={requestLocation}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm shrink-0"
          >
            Izinkan Lokasi
          </button>
        </div>
      )}

      {/* Search & Filter Section */}
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

        {/* Large Modern Search Bar */}
        <div className="relative shadow-sm rounded-2xl border border-slate-200/80 bg-slate-50/50 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:bg-white focus-within:border-emerald-500 transition-all">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Cari boba, sayur, warung, jahit, sembako..."
            className="block w-full pl-12 pr-4 py-4.5 rounded-2xl border-0 text-slate-900 bg-transparent placeholder:text-slate-400 outline-none text-base md:text-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pt-2">
          {/* Category Filter List (Horizontal Scrollable Chips) */}
          <div className="flex overflow-x-auto gap-2 pb-2.5 lg:pb-0 scrollbar-hide max-w-full">
            {allCategories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all border ${
                  selectedCategory === category
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-200"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-emerald-300"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Advanced Filters */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            {/* Button Urutkan Terdekat */}
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

            {/* Button Filter Masih Buka */}
            <button
              onClick={() => setOnlyOpen(!onlyOpen)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all border ${
                onlyOpen
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Clock className={`w-4.5 h-4.5 ${onlyOpen ? "text-emerald-600" : "text-slate-400"}`} />
              <span>Masih Buka</span>
            </button>
          </div>
        </div>
      </section>

      {/* Grid Card UMKM */}
      <section>
        {processedUmkm.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {processedUmkm.map((umkm) => (
              <UmkmCard key={umkm.id} {...umkm} />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm max-w-xl mx-auto px-6">
            <div className="bg-rose-50 text-rose-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
              <Search className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-2">UMKM tidak ditemukan</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Coba gunakan kata kunci lain seperti makanan, minuman, sayur, jasa, atau sembako.
            </p>
            <button 
              onClick={() => { setSearchQuery(""); setSelectedCategory("Semua"); setOnlyOpen(false); setSortByDistance(false); setLocationErrorMsg(""); }}
              className="mt-6 inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-6 rounded-xl transition-all shadow-md shadow-emerald-200"
            >
              Reset Semua Filter
            </button>
          </div>
        )}
      </section>

      {/* Peta Section */}
      <section id="peta-sebaran" className="scroll-mt-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Map className="h-6 w-6 text-emerald-600" />
              <h2 className="text-2xl font-black text-slate-950">Peta Sebaran UMKM</h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Peta lokasi interaktif untuk memudahkan Anda berkunjung langsung ke gerai UMKM Desa Ngadirejo.
            </p>
          </div>
          {userLocation && (
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100/50 w-fit">
              Lokasi Anda Aktif
            </span>
          )}
        </div>
        <div className="bg-white p-3 sm:p-5 rounded-3xl shadow-sm border border-slate-100/80 z-0">
          <MapWrapper markers={processedUmkm} />
        </div>
      </section>
    </>
  );
}
