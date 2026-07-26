import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { NAMA_SURAU, LOGO_JAIS, LOGO_SELANGOR, LOGO_SURAU } from "@/lib/tetapan";

const namaSurau = NAMA_SURAU;

export const metadata: Metadata = {
  title: `${namaSurau} · Sistem Pengurusan Surau`,
  description: "Pendaftaran ahli kariah, khairat kematian & pengurusan surau.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ms">
      <body>
        <div className="print-hide border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO_SURAU} alt={namaSurau} className="h-12 w-auto sm:h-16" />
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={LOGO_SELANGOR} alt="Jata Negeri Selangor" className="h-8 w-auto" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={LOGO_JAIS} alt="Logo JAIS" className="h-8 w-auto" />
            </div>
          </div>
        </div>
        <header className="print-hide bg-hitam text-white shadow">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-sm font-bold text-surau-light">
              Portal Kariah
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/" className="hover:underline">
                Utama
              </Link>
              <Link href="/daftar" className="hover:underline">
                Daftar Ahli
              </Link>
              <Link href="/program" className="hover:underline">
                Program
              </Link>
              <Link href="/sewaan" className="hover:underline">
                Sewaan
              </Link>
              <Link href="/vendor" className="hover:underline">
                Vendor
              </Link>
              <Link href="/masuk" className="rounded bg-surau px-3 py-1 font-semibold text-white hover:bg-surau-dark">
                Log Masuk
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <footer className="print-hide mt-16 border-t bg-white py-6 text-center text-xs text-slate-500">
          <div className="mb-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
            <Link href="/dasar-privasi" className="hover:text-surau hover:underline">Dasar Privasi</Link>
            <Link href="/terma" className="hover:text-surau hover:underline">Terma & Penafian</Link>
            <Link href="/keselamatan" className="hover:text-surau hover:underline">Keselamatan</Link>
          </div>
          Jawatankuasa Surau Ar Raudhah, Eco Majestic
        </footer>
      </body>
    </html>
  );
}
