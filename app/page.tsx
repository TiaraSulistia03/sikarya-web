'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';

export default function Home() {
  const [karyaList, setKaryaList] = useState<any[]>([]);
  const [highlightList, setHighlightList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false); 

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };

    checkUser();
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: karyaData, error } = await supabase
        .from('karya')
        .select(`
          id_karya, keterangan, tingkat_lomba, tanggal_input,
          siswa ( nama, perangkatan ( tahun_masuk ) ), 
          kategori_karya ( nama_kategori ), 
          foto_karya ( url_foto )
        `)
        .eq('status', 'disetujui')
        .order('tanggal_input', { ascending: false });

      if (error) throw error;
      setKaryaList(karyaData || []);

      const { data: prestasiData } = await supabase
        .from('karya')
        .select(`
          id_karya, keterangan, tingkat_lomba, tanggal_input,
          siswa ( nama, perangkatan ( tahun_masuk ) ), kategori_karya ( nama_kategori ), foto_karya ( url_foto )
        `)
        .eq('status', 'disetujui')
        .not('tingkat_lomba', 'is', null)
        .order('tanggal_input', { ascending: false })
        .limit(5);

      setHighlightList(prestasiData || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const parseKeterangan = (teks: string) => {
    if (!teks) return { judul: '-', deskripsi: '' };
    const baris = teks.split('\n');
    const judul = baris[0];
    const deskripsi = baris.slice(1).join(' ').trim();
    return { judul, deskripsi };
  };

  const filteredKarya = karyaList.filter((karya) => {
    const matchSearch = karya.keterangan?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        karya.siswa?.nama?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSearch;
  });

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans w-full flex flex-col items-center">
      
      {/* HEADER / NAVBAR */}
      <header className="w-full bg-white border-b border-gray-100 py-3 sm:py-4 px-4 sm:px-8 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 sm:w-12 sm:h-12 relative flex-shrink-0 bg-white rounded-full overflow-hidden">
              <img src="/logo_sekolah.png" alt="Logo SIKARYA" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl sm:text-2xl font-bold text-[#2B48D6] leading-tight">SIKARYA</h1>
              <p className="text-xs sm:text-sm text-gray-500 font-medium">SDN Cibeureum III</p>
            </div>
          </div>
          
          {isLoggedIn ? (
            <Link href="/dashboard-ortu" className="bg-[#199A4D] text-white px-4 py-2 text-sm rounded-lg font-bold hover:bg-green-700 transition">
              Dashboard Ortu
            </Link>
          ) : (
            <Link href="/login" className="bg-[#2B48D6] text-white px-4 py-2 text-sm rounded-lg font-bold hover:bg-blue-700 transition flex items-center gap-2 shadow-sm">
              <img src="/IconUser.svg" alt="Icon User" className="w-4 h-4 object-contain" />
              Login Ortu
            </Link>
          )}
        </div>
      </header>

      <div className="w-full max-w-6xl px-4 sm:px-6 lg:px-8 mt-6 pb-12">
        
        {/* HERO SECTION */}
        <div className="bg-[#2B48D6] text-white pt-8 sm:pt-10 pb-6 px-6 sm:px-10 rounded-3xl shadow-md w-full relative overflow-hidden">
          
          {/* TAMBAHAN: Efek Gradasi Lingkaran Kanan Atas */}
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-blue-400 rounded-full mix-blend-overlay filter blur-3xl opacity-60 pointer-events-none"></div>
          <div className="absolute top-10 -right-10 w-48 h-48 bg-indigo-300 rounded-full mix-blend-screen filter blur-2xl opacity-40 pointer-events-none"></div>
          {/* ------------------------------------------------- */}

          {/* Konten di bawah ini dibungkus relative z-10 agar tidak tertutup efek gradasi */}
          <div className="relative z-10">
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-1">Galeri Karya Siswa</h1>
            <p className="text-lg sm:text-xl font-medium text-blue-100 mb-5">SDN Cibeureum III</p>
            <p className="text-sm sm:text-base text-blue-50 leading-relaxed mb-6 max-w-2xl">
              Wadah apresiasi kreativitas, inovasi tangan terampil, dan ragam karya berprestasi kebanggaan putra-putri sekolah dasar.
            </p>
            
            <div className="border-t border-blue-500/50 pt-4 flex justify-end items-center gap-2 text-sm font-semibold">
              <img src="/IconVerGuru.svg" alt="Terverifikasi Guru" className="w-5 h-5 object-contain" />
              Terverifikasi Guru
            </div>
          </div>
        </div>

        {/* HIGHLIGHT PRESTASI */}
        {highlightList.length > 0 && (
          <div className="mt-10">
            <div className="flex justify-between items-center mb-5 px-1">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                ✨ Prestasi Terbaru
              </h2>
              <Link href="#semua-karya" className="text-sm font-semibold text-[#2B48D6] hover:underline">
                Lihat Semua
              </Link>
            </div>
            
            <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-6 snap-x snap-mandatory hide-scrollbar px-1">
              {highlightList.map((item) => {
                const { judul, deskripsi } = parseKeterangan(item.keterangan);
                const tanggal = new Date(item.tanggal_input).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                
                return (
                <Link href={`/karya/${item.id_karya}`} key={item.id_karya} className="snap-start flex-shrink-0 w-[290px] sm:w-[350px] bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                  <div className="relative h-40 sm:h-48 bg-gray-200">
                    <img src={item.foto_karya?.[0]?.url_foto || 'https://placehold.co/600x400/e2e8f0/475569?text=Foto+Karya'} alt="Prestasi" className="w-full h-full object-cover" />
                    
                    {/* Badge Prestasi DIKEMBALIKAN KE KIRI ATAS */}
                    <div className="absolute top-3 left-3 bg-[#FEF3C7] text-yellow-800 text-[11px] font-bold px-2.5 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5 border border-yellow-200">
                      🏆 {item.tingkat_lomba}
                    </div>
                  </div>
                  <div className="p-4 sm:p-5 flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-2">
                       <div className="flex flex-col">
                         {/* Nama dan Angkatan sejajar di Prestasi */}
                         <div className="flex items-center gap-1.5">
                           <h3 className="text-sm font-bold text-gray-900">{item.siswa?.nama}</h3>
                           <span className="text-gray-400 text-[10px]">•</span>
                           <h3 className="text-[11px] font-bold text-[#2B48D6]">Angkatan {item.siswa?.perangkatan?.tahun_masuk}</h3>
                         </div>
                       </div>
                       <span className="text-[11px] text-gray-500 whitespace-nowrap mt-0.5">{tanggal}</span>
                    </div>
                    
                    <h4 className="text-[15px] font-bold text-gray-800 line-clamp-1 mb-1">{judul}</h4>
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-4">
                      {deskripsi || "Deskripsi karya belum ditambahkan."}
                    </p>

                    <div className="mt-auto pt-3 border-t border-gray-100">
                       <span className="text-xs font-bold text-[#2B48D6] flex items-center gap-1">Detail 
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                         </svg>
                       </span>
                    </div>
                  </div>
                </Link>
              )})}
            </div>
          </div>
        )}

        {/* SEARCH BAR */}
        <div className="mt-2 mb-8 px-1">
          <div className="relative w-full shadow-sm rounded-xl">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <input 
              type="text"
              placeholder="Cari karya, nama anak, atau kategori..."
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#2B48D6] focus:border-[#2B48D6] text-sm outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* SEMUA KARYA */}
        <div id="semua-karya" className="px-1">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-1">Semua Karya</h2>
              <p className="text-sm sm:text-base text-gray-500">Eksplorasi ragam kreasi siswa terdaftar</p>
            </div>
            <div className="bg-[#E0E7FF] text-[#2B48D6] font-bold px-3 py-1.5 rounded-full text-sm">
              {filteredKarya.length} Karya
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-gray-500">Memuat karya...</div>
          ) : filteredKarya.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-100">Tidak ada karya yang ditemukan.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredKarya.map((karya) => {
                const fotoUrl = karya.foto_karya?.[0]?.url_foto || 'https://placehold.co/600x400/e2e8f0/475569?text=Foto+Karya';
                const tanggal = new Date(karya.tanggal_input).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                const { judul, deskripsi } = parseKeterangan(karya.keterangan);

                return (
                  <Link href={`/karya/${karya.id_karya}`} key={karya.id_karya} className="group block h-full">
                    <div className="bg-white h-full rounded-2xl shadow-sm border border-gray-200 overflow-hidden group-hover:shadow-md transition-all duration-300 flex flex-col">
                      
                      <div className="relative h-56 w-full bg-gray-200 flex-shrink-0">
                        <img src={fotoUrl} alt={judul} className="w-full h-full object-cover" />
                        <div className="absolute top-3 left-3 bg-[#E0E7FF]/90 backdrop-blur-sm text-[#2B48D6] text-[11px] font-bold px-2.5 py-1 rounded-md shadow-sm">
                          {karya.kategori_karya?.nama_kategori || 'Karya'}
                        </div>
                      </div>

                      <div className="p-5 flex flex-col flex-grow">
                        <div className="flex justify-between items-start mb-2">
                           <div className="flex-1">
                              {/* Nama dan Angkatan Sejajar */}
                              <div className="flex items-center gap-1.5 mb-1.5">
                                 <h3 className="text-sm font-bold text-gray-900">{karya.siswa?.nama}</h3>
                                 <span className="text-gray-400 text-[10px]">•</span>
                                 <h4 className="text-[11px] font-bold text-[#2B48D6]">Angkatan {karya.siswa?.perangkatan?.tahun_masuk}</h4>
                              </div>
                              
                              <h3 className="text-base font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-[#2B48D6] transition-colors">{judul}</h3>
                           </div>
                           <span className="text-[11px] text-gray-500 whitespace-nowrap ml-2 mt-1">{tanggal}</span>
                        </div>

                        <p className="text-[13px] text-gray-500 line-clamp-2 mb-4 leading-relaxed mt-1">
                          {deskripsi || "Deskripsi karya belum ditambahkan."}
                        </p>
                        
                        <div className="mt-auto pt-3 border-t border-gray-100 flex justify-between items-center">
                          <span className="text-[11px] font-bold text-[#2B48D6] flex items-center gap-1">Detail 
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                               <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}