'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [nis, setNis] = useState('');
  const [kodeUnik, setKodeUnik] = useState('');
  const [showKode, setShowKode] = useState(false); 
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const { data: siswa, error: siswaError } = await supabase
        .from('siswa')
        .select('id_siswa, nama')
        .eq('nis', nis)
        .maybeSingle();

      if (siswaError || !siswa) throw new Error('NIS tidak ditemukan.');

      const { data: ortu, error: ortuError } = await supabase
        .from('orang_tua')
        .select('id_orang_tua, kode_unik')
        .eq('id_siswa', siswa.id_siswa)
        .eq('kode_unik', kodeUnik)
        .maybeSingle();

      if (ortuError || !ortu) throw new Error('Kode Unik salah atau tidak cocok.');

      const emailAuth = `${ortu.kode_unik.toLowerCase()}@sikarya.sch.id`;
      const passwordAuth = 'Ortu123!'; 

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: emailAuth,
        password: passwordAuth
      });

      if (authError) {
        throw new Error('Gagal login ke sistem Auth: ' + authError.message);
      }

      localStorage.setItem('ortu_id', ortu.id_orang_tua);
      localStorage.setItem('siswa_id', siswa.id_siswa);
      localStorage.setItem('siswa_nama', siswa.nama);

      router.push('/dashboard-ortu');
      
    } catch (error: any) {
      setErrorMsg(error.message || 'Terjadi kesalahan saat login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      
      {/* Header Minimalis */}
      <header className="w-full bg-white border-b border-gray-100 py-4 px-6 flex items-center gap-3">
        <div className="w-10 h-10 relative flex-shrink-0 bg-white rounded-full p-1 border border-gray-100 shadow-sm overflow-hidden">
           <img src="/logo_sekolah.png" alt="Logo SIKARYA" className="w-full h-full object-contain" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-[#2B48D6] leading-tight">SIKARYA</h1>
          <p className="text-xs text-gray-500 font-medium">SDN Cibeureum III</p>
        </div>
      </header>

      {/* Konten Utama */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-[420px] bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 sm:p-10 border border-gray-100">
          
          {/* Badge Portal Wali Murid */}
          <div className="flex justify-center mb-6">
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#FEF3C7] text-[#92400E] text-xs font-semibold">
              <img src="/IconOrtu.svg" alt="Icon Ortu" className="w-4 h-4 object-contain" />
              Portal Wali Murid
            </span>
          </div>

          <h2 className="text-center text-[28px] font-extrabold text-gray-900 mb-2">
            Portal Orang Tua
          </h2>
          <p className="text-center text-sm text-gray-500 mb-8 px-2 leading-relaxed">
            Pantau perkembangan karya dan prestasi putra-putri Anda di SDN Cibeureum III
          </p>

          <form className="space-y-5" onSubmit={handleLogin}>
            {errorMsg && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm text-center border border-red-100">
                {errorMsg}
              </div>
            )}
            
            {/* Input NIS */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">NIS Anak</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <img src="/IconUsername.svg" alt="Icon Username" className="w-5 h-5 object-contain" />
                </div>
                <input
                  type="text"
                  required
                  value={nis}
                  onChange={(e) => setNis(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#2B48D6] focus:border-[#2B48D6] text-sm outline-none transition-all placeholder:text-gray-400"
                  placeholder="Contoh: 0020210021"
                />
              </div>
            </div>

            {/* Input Kode Unik */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-bold text-gray-800">Kode Unik</label>
                <span className="text-[11px] font-semibold text-[#2B48D6] bg-blue-50 px-2.5 py-1 rounded-md">6 Karakter</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <img src="/IconPw.svg" alt="Icon Password" className="w-5 h-5 object-contain" />
                </div>
                <input
                  type={showKode ? "text" : "password"}
                  required
                  value={kodeUnik}
                  onChange={(e) => setKodeUnik(e.target.value)}
                  className="block w-full pl-11 pr-12 py-3.5 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#2B48D6] focus:border-[#2B48D6] text-sm outline-none transition-all placeholder:text-gray-400"
                  placeholder="Masukkan 6 digit kode unik"
                />

                <button
                  type="button"
                  onClick={() => setShowKode(!showKode)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                    {showKode ? (
                    // Jika showKode = true (teks terlihat), tampilkan ikon Mata Dicoret
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    // Jika showKode = false (teks tersembunyi), tampilkan ikon Mata Terbuka
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
                
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-[#F0F4FF] rounded-xl p-4 flex gap-3 items-start mt-2">
              <img src="/IconInfo.svg" alt="Info" className="w-5 h-5 object-contain flex-shrink-0 mt-0.5" />
              <p className="text-[13px] text-[#4B5563] leading-relaxed">
                Lupa kode unik? Hubungi wali kelas atau pihak sekolah.
              </p>
            </div>

            {/* Tombol Masuk */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl shadow-sm text-[15px] font-bold text-white bg-[#2B48D6] hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2B48D6] disabled:opacity-50 transition-all mt-4"
            >
              {isLoading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>

          {/* Link Kembali */}
          <div className="mt-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#2B48D6] hover:text-blue-800 transition-colors">
              <img src="/IconPanah.svg" alt="Panah Kembali" className="w-4 h-4 object-contain" />
              Kembali ke Galeri Publik
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 text-center border-t border-gray-100 mt-auto">
        <p className="text-sm font-bold text-gray-700 mb-1">SDN Cibeureum III &bull; Kota Sumedang</p>
        <p className="text-xs text-gray-500">&copy; 2026 SIKARYA.</p>
      </footer>
    </div>
  );
}