'use client';

import { useEffect, useState, Suspense } from 'react';
import { supabase } from '../../../lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function DetailKaryaContent() {
  const params = useParams();
  const router = useRouter();
  const [karya, setKarya] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchDetail(params.id as string);
    }
  }, [params.id]);

  const fetchDetail = async (id: string) => {
    try {
      const { data: karyaData, error: karyaError } = await supabase
        .from('karya')
        .select(`
          *,
          siswa ( nama, nis, perangkatan ( tahun_masuk ) ),
          kategori_karya ( nama_kategori ),
          mata_pelajaran ( nama_mapel ),
          foto_karya ( url_foto )
        `)
        .eq('id_karya', id)
        .maybeSingle();

      if (karyaError) throw karyaError;
      if (!karyaData) {
        router.push('/');
        return;
      }

      let namaGuru = 'Guru Pembimbing';
      if (karyaData.id_guru) {
        const { data: rpcData } = await supabase.rpc('get_nama_guru', {
          guru_id: karyaData.id_guru
        });

        if (rpcData && rpcData.length > 0 && rpcData[0].nama_guru) {
          namaGuru = rpcData[0].nama_guru;
        }
      }

      setKarya({
        ...karyaData,
        guru: { nama: namaGuru }
      });

    } catch (error: any) {
      console.error('Error sistem:', error.message);
      alert('Gagal mengambil data: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Memuat data...</div>;
  }

  if (!karya) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Karya tidak ditemukan.</div>;
  }

  const fotoUrl = karya.foto_karya?.[0]?.url_foto || 'https://placehold.co/600x400/e2e8f0/475569?text=Foto+Karya';
  const tanggal = new Date(karya.tanggal_input).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  
  const barisTeks = karya.keterangan ? karya.keterangan.split('\n') : ['-'];
  const judulKarya = barisTeks[0];
  const deskripsiKarya = barisTeks.slice(1).join(' ').trim();

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-12">
      
      {/* Breadcrumb & Header Mobile */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-[#2B48D6] transition-colors flex items-center gap-1.5">
            <img src="/IconGaleri.svg" alt="Galeri" className="w-4 h-4 object-contain" />
            Galeri Karya
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-[#2B48D6] font-semibold truncate">Detail Karya Siswa</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 mt-6 space-y-4">
        
        {/* KARTU 1: FOTO, KATEGORI, JUDUL */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="relative h-64 sm:h-80 w-full bg-gray-200">
            <img src={fotoUrl} alt={judulKarya} className="w-full h-full object-cover" />
            {karya.status === 'disetujui' && (
              <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm text-[#199A4D] px-3 py-1.5 rounded-full text-xs font-bold shadow-sm flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                </svg>
                Disetujui
              </div>
            )}
          </div>
          <div className="p-5 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <span className="bg-[#E0E7FF] text-[#2B48D6] text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <img src="/IconMapel.svg" alt="Kategori" className="w-4 h-4 object-contain" />
                {karya.kategori_karya?.nama_kategori || 'Karya'}
              </span>
              <span className="text-sm text-gray-500 font-medium flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                {tanggal}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">{judulKarya}</h1>
          </div>
        </div>

        {/* KARTU 2: INFO SISWA */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-14 h-14 bg-[#3B4EDC] rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
            {karya.siswa?.nama?.substring(0, 2).toUpperCase() || 'AN'}
          </div>
          <div className="flex-grow">
            <h3 className="text-lg font-bold text-gray-900">{karya.siswa?.nama}</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Angkatan {karya.siswa?.perangkatan?.tahun_masuk} <span className="mx-1">|</span> NISN : {karya.siswa?.nis}
            </p>
          </div>
          <div className="text-gray-400">
             <img src="/IconUsername.svg" alt="Icon Siswa" className="w-7 h-7 object-contain opacity-50" />
          </div>
        </div>

        {/* KARTU 3: PROSES & LATAR BELAKANG */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-5 sm:p-6">
          <h3 className="text-[17px] font-bold text-[#2B48D6] flex items-center gap-2 mb-3">
            <img src="/IconDeskripsi.svg" alt="Deskripsi" className="w-5 h-5 object-contain" />
            Proses & Latar Belakang Karya
          </h3>
          <p className="text-[15px] text-gray-600 leading-relaxed text-justify">
            {deskripsiKarya || "Belum ada deskripsi proses atau latar belakang karya yang ditambahkan."}
          </p>
        </div>

        {/* KARTU 4: PEMBIMBING */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-5">
          <h3 className="text-sm font-bold text-[#2B48D6] flex items-center gap-2 mb-2">
            <img src="/IconPembimbing.svg" alt="Guru" className="w-5 h-5 object-contain" />
            Guru
          </h3>
          <p className="text-lg font-bold text-gray-900">
            {karya.guru?.nama || 'Guru Pembimbing'}
          </p>
        </div>

        {/* KARTU 5: MATA PELAJARAN */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-5">
          <h3 className="text-sm font-bold text-[#2B48D6] flex items-center gap-2 mb-2">
            <img src="/IconMapel.svg" alt="Mapel" className="w-5 h-5 object-contain" />
            Mata Pelajaran
          </h3>
          <p className="text-lg font-bold text-gray-900">
            {karya.mata_pelajaran?.nama_mapel || '-'}
          </p>
        </div>

        {/* TOMBOL AKSI (Bagikan & Medsos) */}
        <div className="pt-2 space-y-3">
          <button 
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: judulKarya, url: window.location.href });
              } else {
                navigator.clipboard.writeText(window.location.href);
                alert('Link karya berhasil disalin!');
              }
            }}
            className="w-full bg-[#2B48D6] text-white font-bold py-3.5 rounded-2xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-sm text-[15px]"
          >
            <img src="/IconBagikan.svg" alt="Bagikan" className="w-5 h-5 object-contain" />
            Bagikan Karya Ini
          </button>

          {karya.link_medsos && (
            <a 
              href={karya.link_medsos} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-full bg-[#E11D48] text-white font-bold py-3.5 rounded-2xl hover:bg-rose-700 transition-colors flex items-center justify-center gap-2 shadow-sm text-[15px]"
            >
              <img src="/IconLihatPos.svg" alt="Lihat Postingan" className="w-5 h-5 object-contain" />
              Lihat Postingan Asli
            </a>
          )}
        </div>

        {/* KARTU 6: ARSIP RESMI SEKOLAH */}
        <div className="bg-[#EEF2FF] rounded-3xl p-5 border border-[#E0E7FF] flex gap-4 mt-6">
          <div className="w-10 h-10 bg-[#2B48D6] rounded-full flex items-center justify-center text-white flex-shrink-0 shadow-sm p-2">
             <img src="/IconArsip.svg" alt="Arsip" className="w-full h-full object-contain" />
          </div>
          <div>
            <h4 className="text-[#2B48D6] font-bold text-sm mb-1">Arsip Resmi Sekolah</h4>
            <p className="text-xs text-[#4F46E5] leading-relaxed">
              Dokumen ini terdaftar dalam repositori digital resmi SDN Cibeureum III. Terbuka untuk umum sebagai wujud apresiasi transparansi prestasi siswa.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function DetailKaryaPublik() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Memuat halaman...</div>}>
      <DetailKaryaContent />
    </Suspense>
  );
}