import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";

// Setup Plus Jakarta Sans sebagai font utama
const plusJakarta = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
});

// Setup Inter sebagai font alternatif (jika dibutuhkan untuk teks tertentu)
const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "SIKARYA - SDN Cibeureum III",
  description: "Sistem Informasi Dokumentasi Karya Siswa",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${plusJakarta.variable} ${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}