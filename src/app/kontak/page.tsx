"use client";
import { useState } from "react";
import { Mail, Phone, MapPin, MessageSquare, Send, Store, PlusCircle, CheckCircle } from "lucide-react";

export default function KontakPage() {
  const [activeTab, setActiveTab] = useState<"pesan" | "daftar">("pesan");
  const [pesanForm, setPesanForm] = useState({ name: "", contact: "", message: "" });
  const [daftarForm, setDaftarForm] = useState({
    namaUsaha: "",
    pemilik: "",
    kategori: "Makanan",
    whatsapp: "",
    alamat: "",
    deskripsi: "",
    produk: "",
    jamOperasional: "Senin - Sabtu (08:00 - 17:00)",
    koordinat: "",
  });

  const adminWhatsApp = "6281234567890"; // Admin desa/KKN WhatsApp number

  const handlePesanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = `Halo Admin UMKM Ngadirejo,\n\nSaya ingin mengirimkan pesan/pertanyaan:\n\n*Nama:* ${pesanForm.name}\n*Kontak:* ${pesanForm.contact}\n*Pesan:* ${pesanForm.message}\n\nTerima kasih!`;
    const url = `https://wa.me/${adminWhatsApp}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const handleDaftarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Clean WhatsApp number
    let waClean = daftarForm.whatsapp.replace(/\D/g, "");
    if (waClean.startsWith("0")) {
      waClean = "62" + waClean.substring(1);
    }

    const text = `Halo Admin UMKM Ngadirejo,\n\nSaya ingin mengajukan pendaftaran UMKM Baru:\n\n*Nama Usaha:* ${daftarForm.namaUsaha}\n*Nama Pemilik:* ${daftarForm.pemilik}\n*Kategori:* ${daftarForm.kategori}\n*WhatsApp Usaha:* ${waClean}\n*Alamat Lengkap:* ${daftarForm.alamat}\n*Deskripsi Usaha:* ${daftarForm.deskripsi}\n*Produk Utama:* ${daftarForm.produk}\n*Jam Operasional:* ${daftarForm.jamOperasional}\n*Koordinat Lokasi:* ${daftarForm.koordinat || "-"}\n\nMohon bantuannya untuk menambahkan data usaha ini ke website. Terima kasih!`;
    const url = `https://wa.me/${adminWhatsApp}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="bg-slate-50/50 min-h-screen py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title Section */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100/70 text-emerald-800 border border-emerald-200/50 mb-4 uppercase tracking-wider">
            Hubungi Kami
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 mb-6 tracking-tight">Hubungi Pengelola</h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Punya pertanyaan atau ingin mendaftarkan usaha Anda ke dalam direktori website? Tim KKN dan admin desa siap melayani Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 max-w-6xl mx-auto items-stretch">
          
          {/* Info Panel Column */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-sm border border-slate-100 flex-1 flex flex-col justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-950 mb-8 border-b border-slate-100 pb-3">Informasi Kontak</h2>
                
                <div className="space-y-6">
                  {/* Address */}
                  <div className="flex items-start gap-4">
                    <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-600 shrink-0 border border-emerald-100/50">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">Alamat Balai Desa</h3>
                      <p className="text-slate-500 text-xs sm:text-sm mt-1 leading-relaxed">
                        Desa Ngadirejo, Kecamatan Kromengan,<br />Kabupaten Malang, Jawa Timur, Indonesia
                      </p>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-start gap-4">
                    <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-600 shrink-0 border border-emerald-100/50">
                      <Phone className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">Telepon / WhatsApp</h3>
                      <p className="text-slate-500 text-xs sm:text-sm mt-1">+62 812-3456-7890 (Admin Desa)</p>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-start gap-4">
                    <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-600 shrink-0 border border-emerald-100/50">
                      <Mail className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">Surel (Email)</h3>
                      <p className="text-slate-500 text-xs sm:text-sm mt-1">admin@ngadirejo-kromengan.desa.id</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Info Box */}
              <div className="mt-12 pt-8 border-t border-slate-100 bg-emerald-50/20 p-5 rounded-2xl border border-emerald-50">
                <h3 className="font-bold text-emerald-900 mb-2 text-sm sm:text-base flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  Pendaftaran 100% Gratis
                </h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  Tidak ada biaya apa pun untuk mendaftarkan usaha Anda. Program ini merupakan dedikasi pengabdian masyarakat untuk kemajuan UMKM lokal Desa Ngadirejo.
                </p>
              </div>
            </div>
          </div>

          {/* Form Panel Column */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-sm border border-slate-100 flex-1 flex flex-col">
              
              {/* Tab Selector */}
              <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8 border border-slate-200/50">
                <button
                  type="button"
                  onClick={() => setActiveTab("pesan")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    activeTab === "pesan"
                      ? "bg-white text-emerald-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <MessageSquare className="w-4.5 h-4.5" />
                  Kirim Pesan
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("daftar")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    activeTab === "daftar"
                      ? "bg-white text-emerald-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <PlusCircle className="w-4.5 h-4.5" />
                  Daftar UMKM Baru
                </button>
              </div>

              {/* Tab 1: Kirim Pesan */}
              {activeTab === "pesan" && (
                <form className="space-y-5 flex-1 flex flex-col justify-between" onSubmit={handlePesanSubmit}>
                  <div className="space-y-5">
                    <div>
                      <label htmlFor="name" className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">Nama Lengkap</label>
                      <input 
                        type="text" 
                        id="name" 
                        value={pesanForm.name}
                        onChange={(e) => setPesanForm({ ...pesanForm, name: e.target.value })}
                        className="w-full px-4 py-3 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all bg-slate-50/50"
                        placeholder="Masukkan nama lengkap Anda"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="contact" className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">No. WhatsApp / Email</label>
                      <input 
                        type="text" 
                        id="contact" 
                        value={pesanForm.contact}
                        onChange={(e) => setPesanForm({ ...pesanForm, contact: e.target.value })}
                        className="w-full px-4 py-3 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all bg-slate-50/50"
                        placeholder="Contoh: 081234xxxx atau email@domain.com"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="message" className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">Isi Pesan</label>
                      <textarea 
                        id="message" 
                        rows={5}
                        value={pesanForm.message}
                        onChange={(e) => setPesanForm({ ...pesanForm, message: e.target.value })}
                        className="w-full px-4 py-3 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none bg-slate-50/50"
                        placeholder="Tuliskan pertanyaan atau aspirasi Anda di sini..."
                        required
                      ></textarea>
                    </div>
                  </div>
                  
                  <button 
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 bg-slate-950 hover:bg-slate-900 text-white font-bold py-4 px-4 rounded-xl text-xs sm:text-sm transition-all shadow-sm hover:shadow cursor-pointer mt-6"
                  >
                    <span>Kirim via WhatsApp</span>
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* Tab 2: Form Pendaftaran UMKM Baru */}
              {activeTab === "daftar" && (
                <form className="space-y-4" onSubmit={handleDaftarSubmit}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="namaUsaha" className="block text-xs font-bold text-slate-700 mb-1">Nama Usaha</label>
                      <input 
                        type="text" 
                        id="namaUsaha" 
                        value={daftarForm.namaUsaha}
                        onChange={(e) => setDaftarForm({ ...daftarForm, namaUsaha: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all bg-slate-50/50"
                        placeholder="Contoh: Pecel Lele Mak Nyus"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="pemilik" className="block text-xs font-bold text-slate-700 mb-1">Nama Pemilik</label>
                      <input 
                        type="text" 
                        id="pemilik" 
                        value={daftarForm.pemilik}
                        onChange={(e) => setDaftarForm({ ...daftarForm, pemilik: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all bg-slate-50/50"
                        placeholder="Contoh: Pak Slamet"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="kategori" className="block text-xs font-bold text-slate-700 mb-1">Kategori Usaha</label>
                      <select 
                        id="kategori" 
                        value={daftarForm.kategori}
                        onChange={(e) => setDaftarForm({ ...daftarForm, kategori: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all bg-slate-50/50"
                        required
                      >
                        <option value="Makanan">Makanan</option>
                        <option value="Minuman">Minuman</option>
                        <option value="Sembako">Sembako</option>
                        <option value="Jasa">Jasa</option>
                        <option value="Pertanian">Pertanian</option>
                        <option value="Kerajinan">Kerajinan</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="whatsapp" className="block text-xs font-bold text-slate-700 mb-1">No. WhatsApp Usaha</label>
                      <input 
                        type="tel" 
                        id="whatsapp" 
                        value={daftarForm.whatsapp}
                        onChange={(e) => setDaftarForm({ ...daftarForm, whatsapp: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all bg-slate-50/50"
                        placeholder="Contoh: 08123456789"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="alamat" className="block text-xs font-bold text-slate-700 mb-1">Alamat Lengkap Usaha</label>
                    <textarea 
                      id="alamat" 
                      rows={2}
                      value={daftarForm.alamat}
                      onChange={(e) => setDaftarForm({ ...daftarForm, alamat: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none bg-slate-50/50"
                      placeholder="Masukkan alamat lengkap gerai/usaha di Desa Ngadirejo"
                      required
                    ></textarea>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="produk" className="block text-xs font-bold text-slate-700 mb-1">Produk / Layanan Utama</label>
                      <input 
                        type="text" 
                        id="produk" 
                        value={daftarForm.produk}
                        onChange={(e) => setDaftarForm({ ...daftarForm, produk: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all bg-slate-50/50"
                        placeholder="Contoh: Ayam Bakar, Lalapan (pisahkan dengan koma)"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="jamOperasional" className="block text-xs font-bold text-slate-700 mb-1">Jam Operasional</label>
                      <input 
                        type="text" 
                        id="jamOperasional" 
                        value={daftarForm.jamOperasional}
                        onChange={(e) => setDaftarForm({ ...daftarForm, jamOperasional: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all bg-slate-50/50"
                        placeholder="Contoh: Senin - Sabtu (08:00 - 17:00)"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="deskripsi" className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Singkat Usaha</label>
                    <textarea 
                      id="deskripsi" 
                      rows={2}
                      value={daftarForm.deskripsi}
                      onChange={(e) => setDaftarForm({ ...daftarForm, deskripsi: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none bg-slate-50/50"
                      placeholder="Jelaskan mengenai usaha Anda dalam beberapa kalimat..."
                      required
                    ></textarea>
                  </div>

                  <div>
                    <label htmlFor="koordinat" className="block text-xs font-bold text-slate-700 mb-1">Koordinat Lokasi Maps (Opsional)</label>
                    <input 
                      type="text" 
                      id="koordinat" 
                      value={daftarForm.koordinat}
                      onChange={(e) => setDaftarForm({ ...daftarForm, koordinat: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all bg-slate-50/50"
                      placeholder="Contoh: -8.134000, 112.527300"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-emerald-100 hover:shadow-lg cursor-pointer mt-4"
                  >
                    <Store className="w-4.5 h-4.5" />
                    <span>Ajukan Pendaftaran via WhatsApp</span>
                  </button>
                </form>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
