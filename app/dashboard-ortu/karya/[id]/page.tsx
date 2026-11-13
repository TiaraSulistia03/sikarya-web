'use client';

import { useEffect, useState, Suspense } from 'react';
import { supabase } from '../../../../lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function DetailKaryaOrtuContent() {
  const params = useParams();
  const router = useRouter();
  
  const [karya, setKarya] = useState<any>(null);
  const [komentarList, setKomentarList] = useState<any[]>([]);
  const [isiKomentar, setIsiKomentar] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchDetail(params.id as string);
      fetchKomentar(params.id as string);
    }
  }, [params.id]);

  const fetchDetail = async (id: string) => {
    try {
      const { data: karyaData, error } = await supabase
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
      
      if (error) throw error;
      if (!karyaData) {
        router.push('/dashboard-ortu');
        return;
      }

      // ==========================================
      // SATPAM KEAMANAN: Cek apakah ini karya anak sendiri
      // ==========================================
      const siswaIdLokal = localStorage.getItem('siswa_id');
      if (karyaData.id_siswa !== siswaIdLokal) {
        alert('Akses Ditolak: Anda hanya dapat melihat karya anak Anda sendiri.');
        router.push('/dashboard-ortu');
        return; 
      }
      // ==========================================

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

    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchKomentar = async (idKarya: string) => {
    const { data, error } = await supabase
      .from('komentar')
      .select('*')
      .eq('id_karya', idKarya)
      .order('created_at', { ascending: true });
      
    if (!error) setKomentarList(data || []);
  };

  const handleKirimKomentar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isiKomentar.trim()) return;

    setIsSending(true);
    try {
      const ortuId = localStorage.getItem('ortu_id');
      if (!ortuId) {
        alert('Sesi login habis, silakan login ulang.');
        router.push('/login');
        return;
      }

      const { error } = await supabase.from('komentar').insert([
        {
          id_karya: params.id,
          id_orang_tua: ortuId,
          isi_komentar: isiKomentar,
        }
      ]);

      if (error) throw error;

      setIsiKomentar(''); 
      fetchKomentar(params.id as string); 
    } catch (error: any) {
      alert('Gagal mengirim komentar: ' + error.message);
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Memuat data...</div>;
  if (!karya) return <div className="min-h-screen flex items-center justify-center text-gray-500">Karya tidak ditemukan.</div>;

  const fotoUrl = karya.foto_karya?.[0]?.url_foto || 'https://placehold.co/600x400/e2e8f0/475569?text=Foto+Karya';
  const tanggal = new Date(karya.tanggal_input).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  
  const barisTeks = karya.keterangan ? karya.keterangan.split('\n') : ['-'];
  const judulKarya = barisTeks[0];
  const deskripsiKarya = barisTeks.slice(1).join(' ').trim();

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-10">
      
      {/* Breadcrumb / Header Mobile */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-50">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/dashboard-ortu" className="hover:text-[#2B48D6] transition-colors flex items-center gap-1.5 font-semibold">
              <img src="/IconGaleri.svg" alt="Kembali" className="w-4 h-4 object-contain" />
              Kembali ke Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 mt-4 space-y-3">
        
        {/* KARTU 1: FOTO & JUDUL */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="relative h-56 w-full bg-gray-200">
            <img src={fotoUrl} alt={judulKarya} className="w-full h-full object-cover" />
            <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm text-[#199A4D] px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
              </svg>
              Disetujui
            </div>
          </div>
          <div className="p-4">
            <div className="flex justify-between items-center mb-3">
              {/* Ikon kategori sudah dihapus */}
              <span className="bg-[#E0E7FF] text-[#2B48D6] text-[10px] font-bold px-2.5 py-1 rounded-md">
                {karya.kategori_karya?.nama_kategori || 'Karya'}
              </span>
              <span className="text-[11px] text-gray-500 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                {tanggal}
              </span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 leading-snug">{judulKarya}</h1>
          </div>
        </div>

        {/* KARTU 2: INFO SISWA */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-11 h-11 bg-[#3B4EDC] rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {karya.siswa?.nama?.substring(0, 2).toUpperCase() || 'AN'}
          </div>
          <div className="flex-grow">
            <h3 className="text-[15px] font-bold text-gray-900">{karya.siswa?.nama}</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Angkatan {karya.siswa?.perangkatan?.tahun_masuk} <span className="mx-1">|</span> NISN : {karya.siswa?.nis}
            </p>
          </div>
          <div className="text-gray-400">
             <img src="/IconUsername.svg" alt="Icon Siswa" className="w-6 h-6 object-contain" />
          </div>
        </div>

        {/* KARTU 3: PROSES */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
          <h3 className="text-[13px] font-bold text-[#2B48D6] flex items-center gap-1.5 mb-2">
            <img src="/IconDeskripsi.svg" alt="Deskripsi" className="w-4 h-4 object-contain" />
            Proses & Latar Belakang Karya
          </h3>
          <p className="text-[13px] text-gray-600 leading-relaxed text-justify">
            {deskripsiKarya || "Belum ada deskripsi proses atau latar belakang karya yang ditambahkan."}
          </p>
        </div>

        {/* KARTU 4: GURU */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
          <h3 className="text-[11px] font-bold text-[#2B48D6] flex items-center gap-1.5 mb-1">
            <img src="/IconPembimbing.svg" alt="Guru" className="w-3.5 h-3.5 object-contain" />
            Guru
          </h3>
          <p className="text-[15px] font-bold text-gray-900">
            {karya.guru?.nama || 'Guru Pembimbing'}
          </p>
        </div>

        {/* KARTU 5: MAPEL */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
          <h3 className="text-[11px] font-bold text-[#2B48D6] flex items-center gap-1.5 mb-1">
            <img src="/IconMapel.svg" alt="Mapel" className="w-3.5 h-3.5 object-contain" />
            Mata Pelajaran
          </h3>
          <p className="text-[15px] font-bold text-gray-900">
            {karya.mata_pelajaran?.nama_mapel || '-'}
          </p>
        </div>

        {/* TOMBOL AKSI */}
        <div className="pt-1 space-y-2">
          <button 
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: judulKarya, url: window.location.href });
              } else {
                navigator.clipboard.writeText(window.location.href);
                alert('Link karya berhasil disalin!');
              }
            }}
            className="w-full bg-[#2B48D6] text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-sm text-[13px]"
          >
            <img src="/IconBagikan.svg" alt="Bagikan" className="w-4 h-4 object-contain" />
            Bagikan Karya Ini
          </button>

          {karya.link_medsos && (
            <a 
              href={karya.link_medsos} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-full bg-[#E11D48] text-white font-bold py-3 rounded-xl hover:bg-rose-700 transition-colors flex items-center justify-center gap-2 shadow-sm text-[13px]"
            >
              <img src="/IconLihatPos.svg" alt="Lihat Postingan" className="w-4 h-4 object-contain" />
              Lihat Postingan Asli
            </a>
          )}
        </div>

        {/* KARTU 6: KOMENTAR */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mt-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-pink-100 text-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
              </svg>
            </div>
            <h3 className="text-[13px] font-bold text-gray-900">Tanggapan Orang Tua</h3>
            <span className="bg-[#E0E7FF] text-[#2B48D6] text-[10px] font-bold px-2 py-0.5 rounded-md ml-auto">
              {komentarList.length} Komentar
            </span>
          </div>
          
          <div className="space-y-2 mb-4">
            {komentarList.length === 0 ? (
              <p className="text-gray-500 text-[11px] italic">Belum ada tanggapan.</p>
            ) : (
              komentarList.map((kom) => (
                <div key={kom.id_komentar} className="bg-[#F3F4F6] p-3 rounded-lg">
                  <p className="text-[12px] text-gray-800 leading-relaxed">{kom.isi_komentar}</p>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleKirimKomentar}>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1.5">Beri Tanggapan atau Doa:</label>
            <textarea
              value={isiKomentar}
              onChange={(e) => setIsiKomentar(e.target.value)}
              placeholder="Tulis tanggapan..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[12px] focus:ring-2 focus:ring-[#2B48D6] focus:border-[#2B48D6] outline-none transition-all resize-none mb-2"
              disabled={isSending}
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-[10px] text-gray-500 font-medium">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                 </svg>
                 Komentar Ramah Anak
              </div>
              <button
                type="submit"
                disabled={isSending || !isiKomentar.trim()}
                className="bg-[#2B48D6] text-white px-4 py-1.5 rounded-lg font-bold hover:bg-blue-700 transition-colors text-[11px] disabled:opacity-50 flex items-center gap-1.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                  <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
                </svg>
                {isSending ? 'Mengirim...' : 'Kirim'}
              </button>
            </div>
          </form>
        </div>

        {/* KARTU 7: POIN APRESIASI */}
        <div className="bg-[#EEF2FF] rounded-2xl p-4 border border-[#E0E7FF] flex items-center gap-3 mt-4">
          <div className="w-8 h-8 bg-[#FDE68A] rounded-full flex items-center justify-center text-yellow-700 flex-shrink-0 text-sm p-1">
             <img src="/IconArsip.svg" alt="Arsip" className="w-full h-full object-contain" />
          </div>
          <div>
            <h4 className="text-gray-900 font-bold text-[11px] mb-0.5">Poin Apresiasi Portofolio</h4>
            <p className="text-[10px] text-gray-600 leading-relaxed">
              Dukungan aktif orang tua menambah motivasi belajar siswa.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function DetailKaryaOrtu() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Memuat...</div>}>
      <DetailKaryaOrtuContent />
    </Suspense>
  );
}