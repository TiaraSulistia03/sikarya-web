'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import jsPDF from 'jspdf';

export default function DashboardOrtu() {
  const [siswa, setSiswa] = useState<any>(null);
  const [karyaList, setKaryaList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newKaryaCount, setNewKaryaCount] = useState(0);
  const [ortuId, setOrtuId] = useState<string | null>(null);
  
  const router = useRouter();

  useEffect(() => {
    const checkSessionAndFetch = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      const idSiswa = localStorage.getItem('siswa_id');
      const idOrtuLokal = localStorage.getItem('ortu_id'); 
      
      setOrtuId(idOrtuLokal);
      
      if (idSiswa) {
        await fetchData(idSiswa);
      }
    };

    checkSessionAndFetch();
  }, [router]);

  const fetchData = async (idSiswa: string) => {
    try {
      const { data: siswaData } = await supabase
        .from('siswa')
        .select('nama, nis, perangkatan ( tahun_masuk )')
        .eq('id_siswa', idSiswa)
        .single();
      
      setSiswa(siswaData);

      const { data: karyaData, error } = await supabase
        .from('karya')
        .select(`
          id_karya, keterangan, status, tanggal_input, tingkat_lomba,
          kategori_karya ( nama_kategori ),
          foto_karya ( url_foto )
        `)
        .eq('id_siswa', idSiswa)
        .eq('status', 'disetujui')
        .order('tanggal_input', { ascending: false });

      if (error) throw error;
      setKaryaList(karyaData || []);

      // LOGIKA NOTIFIKASI BERBASIS LOCALSTORAGE (Anti Gagal)
      if (karyaData && karyaData.length > 0) {
        const lastSeenTimeStr = localStorage.getItem(`lastSeen_${idSiswa}`);
        
        if (!lastSeenTimeStr) {
           // Jika belum pernah tandai dibaca, anggap semua baru
           setNewKaryaCount(karyaData.length);
        } else {
           const lastSeenDate = new Date(lastSeenTimeStr);
           // Hitung karya yang tanggal_input-nya lebih besar dari waktu terakhir dilihat
           const baru = karyaData.filter(k => new Date(k.tanggal_input) > lastSeenDate);
           setNewKaryaCount(baru.length);
        }
      }

    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBadgeClick = (e: React.MouseEvent) => {
    e.preventDefault(); 
    if (siswa) {
      // 1. Simpan waktu saat ini ke browser
      const now = new Date().toISOString();
      localStorage.setItem(`lastSeen_${siswa.id || siswa.nis}`, now); // pakai nis/nama sebagai pembeda jika tidak ada id_siswa di state
      
      // Sebenarnya kita butuh id_siswa, mari kita ambil dari localStorage
      const idSiswa = localStorage.getItem('siswa_id');
      if (idSiswa) {
        localStorage.setItem(`lastSeen_${idSiswa}`, now);
      }

      // 2. Hilangkan notifikasi dari layar saat itu juga
      setNewKaryaCount(0); 
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    router.push('/login');
  };

  const downloadPDF = async () => {
    alert("Sedang menyiapkan Buku Kenangan... Mohon tunggu sebentar.");
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14; 
    const maxTextWidth = pageWidth - (margin * 2);

    doc.setFontSize(20);
    doc.text('Buku Kenangan SIKARYA', margin, 20);
    doc.setFontSize(12);
    doc.text(`Nama Siswa: ${siswa?.nama}`, margin, 30);
    doc.text(`Sekolah: SDN Cibeureum III`, margin, 36);
    doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, margin, 42);

    let currentY = 55;

    for (let i = 0; i < karyaList.length; i++) {
      const karya = karyaList[i];
      const fotoUrl = karya.foto_karya?.[0]?.url_foto;
      
      const barisTeks = karya.keterangan ? karya.keterangan.split('\n') : ['-'];
      const judulKarya = barisTeks[0];

      doc.setFontSize(14);
      const judulLines = doc.splitTextToSize(`${i + 1}. ${judulKarya}`, maxTextWidth);
      
      if (currentY + (judulLines.length * 7) > 260) {
        doc.addPage();
        currentY = 20;
      }

      doc.text(judulLines, margin, currentY);
      currentY += (judulLines.length * 7);

      doc.setFontSize(10);
      doc.text(`Tanggal: ${new Date(karya.tanggal_input).toLocaleDateString('id-ID')}`, margin, currentY + 2);
      currentY += 7;
      
      if (karya.tingkat_lomba) {
        doc.text(`Prestasi: ${karya.tingkat_lomba}`, margin, currentY);
        currentY += 6;
      }

      if (fotoUrl) {
        try {
          const response = await fetch(fotoUrl);
          const blob = await response.blob();
          
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          const base64Image = await base64Promise;

          const img = new Image();
          img.src = base64Image;
          await new Promise((resolve) => { img.onload = resolve; });

          const maxImgWidth = 100;
          const maxImgHeight = 100;
          let imgWidth = img.width;
          let imgHeight = img.height;

          if (imgWidth > maxImgWidth) {
            const ratio = maxImgWidth / imgWidth;
            imgWidth = maxImgWidth;
            imgHeight = imgHeight * ratio;
          }
          if (imgHeight > maxImgHeight) {
            const ratio = maxImgHeight / imgHeight;
            imgHeight = maxImgHeight;
            imgWidth = imgWidth * ratio;
          }

          if (currentY + imgHeight + 10 > 270) {
            doc.addPage();
            currentY = 20;
          }

          doc.addImage(base64Image, 'JPEG', margin, currentY + 5, imgWidth, imgHeight);
          currentY += imgHeight + 15;

        } catch (error) {
          doc.text("[Gambar gagal dimuat]", margin, currentY + 5);
          currentY += 20;
        }
      }

      doc.setDrawColor(200, 200, 200);
      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 10;
    }

    doc.save(`Buku_Kenangan_${siswa?.nama}.pdf`);
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Memuat data...</div>;
  }

  const idSiswaAktif = localStorage.getItem('siswa_id') || '';

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-12">
      
      <header className="bg-white border-b border-gray-100 py-3 px-4 sm:px-8 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-row justify-between items-center">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 relative flex-shrink-0 bg-white rounded-full overflow-hidden">
               <img src="/logo_sekolah.png" alt="Logo SIKARYA" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-[13px] sm:text-base font-bold text-[#2B48D6] leading-tight">Portal Orang Tua</h1>
              <p className="text-[10px] sm:text-xs text-gray-500 font-medium">SIKARYA SDN Cibeureum III</p>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 bg-[#FEF2F2] text-[#B23A3A] rounded-lg text-[10px] sm:text-xs font-bold hover:bg-red-100 transition-colors"
          >
            <div 
              className="w-3 h-3 sm:w-3.5 sm:h-3.5 bg-[#B23A3A]" 
              style={{ 
                maskImage: 'url(/IconLogout.svg)', 
                WebkitMaskImage: 'url(/IconLogout.svg)', 
                maskSize: 'contain', 
                WebkitMaskSize: 'contain', 
                maskRepeat: 'no-repeat', 
                WebkitMaskRepeat: 'no-repeat', 
                maskPosition: 'center',
                WebkitMaskPosition: 'center'
              }} 
            />
            Logout
          </button>
        </div>
        
        <div className="max-w-6xl mx-auto mt-2">
          <Link href="/" className="inline-flex items-center gap-1 text-[#2B48D6] font-semibold text-[11px] sm:text-xs hover:underline">
            <img src="/IconPanah.svg" alt="Kembali" className="w-3 h-3 object-contain" />
            Kembali ke Galeri Karya
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 mt-6">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          <div className="lg:col-span-4 space-y-4">
            
            <div className="mb-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-0.5 leading-tight">Timeline<br className="hidden lg:block"/> Portofolio Anak</h2>
              <p className="text-gray-500 text-xs sm:text-sm mt-1">Melihat perkembangan karya Anak Anda</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 flex items-center gap-3">
              <div className="w-11 h-11 bg-[#3B4EDC] rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {siswa?.nama?.substring(0, 2).toUpperCase() || 'AN'}
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-gray-900">{siswa?.nama}</h3>
                <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-0.5">
                  <span>NISN: {siswa?.nis}</span>
                  <span className="text-gray-300">•</span>
                  <span>Angkatan {siswa?.perangkatan?.tahun_masuk}</span>
                </div>
              </div>
            </div>

            <button 
              onClick={downloadPDF}
              disabled={karyaList.length === 0}
              className="w-full bg-[#199A4D] hover:bg-green-700 transition-colors rounded-2xl p-4 flex items-center justify-between shadow-sm disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-white/20 rounded-lg flex items-center justify-center text-white p-1.5">
                  <img src="/IconPdf.svg" alt="PDF" className="w-full h-full object-contain" />
                </div>
                <div className="text-left">
                  <h4 className="text-white font-bold text-[13px] sm:text-sm leading-tight">Unduh Buku Kenangan (PDF)</h4>
                  <p className="text-green-100 text-[10px] sm:text-xs mt-0.5">Rekapitulasi Portofolio</p>
                </div>
              </div>
              <div className="text-white bg-black/10 p-1.5 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
              </div>
            </button>

            {newKaryaCount > 0 && (
              <div 
                onClick={handleBadgeClick}
                className="bg-[#FEF3C7] border border-[#FDE68A] rounded-2xl p-3.5 flex items-start gap-2.5 cursor-pointer hover:bg-yellow-100 transition"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white rounded-full flex items-center justify-center text-[#D97706] flex-shrink-0 shadow-sm p-1.5">
                   <img src="/IconLonceng.svg" alt="Notifikasi" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h4 className="text-[#92400E] font-bold text-xs">Ada {newKaryaCount} karya baru!</h4>
                  <p className="text-[#B45309] text-[10px] mt-0.5">Karya disetujui. <span className="underline font-semibold">Tandai dibaca</span></p>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-8">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 lg:mt-1">Karya Terverifikasi</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {karyaList.length === 0 ? (
                <div className="col-span-1 sm:col-span-2 text-center text-gray-500 py-6 bg-white rounded-xl border border-gray-100 text-xs sm:text-sm">Belum ada karya.</div>
              ) : (
                karyaList.map((karya) => {
                  const barisTeks = karya.keterangan ? karya.keterangan.split('\n') : ['-'];
                  const judulKarya = barisTeks[0];
                  const deskripsiKarya = barisTeks.slice(1).join(' ').trim();

                  return (
                    <div key={karya.id_karya} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                      <div className="relative h-40 sm:h-44 w-full bg-gray-200">
                        <img src={karya.foto_karya?.[0]?.url_foto || 'https://placehold.co/600x400/e2e8f0/475569?text=Foto+Karya'} alt={judulKarya} className="w-full h-full object-cover" />
                        <div className="absolute top-2.5 right-2.5 bg-white/95 backdrop-blur-sm text-[#199A4D] px-2 py-0.5 rounded-full text-[9px] font-bold shadow-sm flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                          </svg>
                          Disetujui
                        </div>
                      </div>
                      
                      <div className="p-3.5 flex flex-col flex-grow">
                        <div className="flex items-center gap-1 text-gray-500 text-[10px] mb-1.5">
                          <img src="/IconTanggal.svg" alt="Tanggal" className="w-3 h-3 object-contain opacity-70" />
                          {new Date(karya.tanggal_input).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                        
                        <h4 className="text-[14px] font-bold text-gray-900 mb-0.5 leading-snug line-clamp-2">{judulKarya}</h4>
                        <p className="text-[#2B48D6] font-semibold text-[10px] mb-1.5">{karya.kategori_karya?.nama_kategori || 'Karya'}</p>
                        <p className="text-gray-600 text-[11px] leading-relaxed mb-3 line-clamp-2 flex-grow">
                          {deskripsiKarya || "Belum ada deskripsi."}
                        </p>

                        <Link href={`/dashboard-ortu/karya/${karya.id_karya}`} className="mt-auto">
                          <button className="w-full py-2 border-2 border-[#2B48D6] text-[#2B48D6] font-bold rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5 text-[11px]">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Detail & Komentar
                          </button>
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        <div className="mt-10 text-center pb-6 border-t border-gray-200 pt-6">
          <p className="text-[11px] sm:text-xs font-bold text-[#2B48D6] mb-0.5 flex items-center justify-center gap-1">
             <img src="/IconCentangBiru.svg" alt="Centang Biru" className="w-3.5 h-3.5 object-contain" />
             SDN Cibeureum III
          </p>
          <p className="text-[10px] text-gray-500">Portal Dokumentasi Terpadu.</p>
        </div>

      </main>
    </div>
  );
}