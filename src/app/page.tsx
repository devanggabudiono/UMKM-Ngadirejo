import { Store, ShoppingBag, MapPin } from "lucide-react";
import UmkmExplorer from "@/components/UmkmExplorer";
import { getAllUmkm, getUmkmStats, getKategoriList } from "@/repositories/umkmRepository";

export const dynamic = 'force-dynamic';

export default async function Home() {
  // Fetch data from database (SSR)
  const [umkmList, stats, categories] = await Promise.all([
    getAllUmkm(),
    getUmkmStats(),
    getKategoriList(),
  ]);

  return (
    <div className="flex flex-col gap-20 pb-24">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/70 via-emerald-50/30 to-transparent pt-20 pb-24 md:pt-28 md:pb-32 border-b border-emerald-100/30">
        <div className="absolute inset-0 z-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.12]"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
          
          {/* Badge */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100/70 text-emerald-800 border border-emerald-200/50 mb-6 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            Program Digitalisasi UMKM Desa
          </span>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight max-w-4xl leading-[1.15] mb-6">
            Temukan UMKM Lokal <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-emerald-700">
              Desa Ngadirejo
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-base sm:text-lg lg:text-xl text-slate-600 max-w-2xl leading-relaxed mb-10">
            Cari makanan, minuman, jasa, sembako, hasil pertanian, dan usaha lokal masyarakat Desa Ngadirejo dalam satu website.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-16 w-full sm:w-auto">
            <a
              href="#daftar-umkm"
              className="inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white text-sm sm:text-base font-bold py-3 px-8 rounded-2xl transition-all duration-200 shadow-md shadow-emerald-200 hover:-translate-y-0.5"
            >
              Cari UMKM
            </a>
            <a
              href="#peta-sebaran"
              className="inline-flex items-center justify-center bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-sm sm:text-base font-bold py-3 px-8 rounded-2xl transition-all duration-200 shadow-sm hover:-translate-y-0.5"
            >
              Lihat Peta
            </a>
          </div>

          {/* Statistics Cards — Data from Database */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl w-full">
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="bg-emerald-50 text-emerald-600 p-3.5 rounded-xl">
                <Store className="w-6 h-6" />
              </div>
              <div className="text-left">
                <div className="text-2xl font-black text-slate-950">{stats.totalUmkm}</div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">UMKM Terdaftar</div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="bg-emerald-50 text-emerald-600 p-3.5 rounded-xl">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div className="text-left">
                <div className="text-2xl font-black text-slate-950">{stats.totalKategori}</div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kategori Usaha</div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="bg-emerald-50 text-emerald-600 p-3.5 rounded-xl">
                <MapPin className="w-6 h-6" />
              </div>
              <div className="text-left">
                <div className="text-2xl font-black text-slate-950">1</div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Desa Digital</div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Main Content Area — Client-side filtering via UmkmExplorer */}
      <div id="daftar-umkm" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col gap-12 scroll-mt-24">
        <UmkmExplorer initialData={umkmList} categories={categories} />
      </div>
    </div>
  );
}
