import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { NAMA_SURAU, LOGO_JAIS, LOGO_SELANGOR, LOGO_SURAU } from "@/lib/tetapan";
import { khairatDibuka, penajaDipapar, infaqDipapar } from "@/lib/tetapanSistem";
import { getProfil, isMaster } from "@/lib/sesi";
import PenajaStrip from "@/components/PenajaStrip";
import ToggleBahasa from "@/components/ToggleBahasa";
import { bahasaSemasa } from "@/lib/bahasa";
import { buatT } from "@/lib/i18n";

const namaSurau = NAMA_SURAU;

export const metadata: Metadata = {
  title: `${namaSurau} · Sistem Pengurusan Surau`,
  description: "Pendaftaran ahli kariah, khairat kematian & pengurusan surau.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [khDibuka, penajaOn, infaqOn, profil] = await Promise.all([khairatDibuka(), penajaDipapar(), infaqDipapar(), getProfil()]);
  const master = isMaster(profil); // hanya super admin boleh pratonton
  const paparInfaq = infaqOn || master; // master boleh pratonton walau belum dilancarkan
  const stafPreview = !khDibuka && master; // super admin pratonton khairat walau belum dilancarkan
  const paparKhairat = khDibuka || stafPreview;
  const penajaPreview = !penajaOn && master; // super admin pratonton iklan
  const paparPenaja = penajaOn || penajaPreview;
  const lang = bahasaSemasa();
  const t = buatT(lang);
  return (
    <html lang={lang}>
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
              {t("Portal Kariah", "Community Portal")}
            </Link>
            <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              <Link href="/" className="hover:underline">
                {t("Utama", "Home")}
              </Link>
              <Link href="/daftar" className="hover:underline">
                {t("Daftar Ahli", "Register")}
              </Link>
              {paparKhairat && (
                <Link href="/khairat" className="font-semibold text-surau-light hover:underline">
                  {t("Khairat", "Death Benefit")}{stafPreview ? " ·pratonton" : ""}
                </Link>
              )}
              <Link href="/program" className="hover:underline">
                {t("Program", "Programmes")}
              </Link>
              <Link href="/sewaan" className="hover:underline">
                {t("Sewaan", "Rental")}
              </Link>
              <Link href="/pembekal/daftar" className="hover:underline">
                {t("Vendor", "Vendors")}
              </Link>
              <Link href="/masuk" className="rounded bg-surau px-3 py-1 font-semibold text-white hover:bg-surau-dark">
                {t("Log Masuk", "Login")}
              </Link>
              <ToggleBahasa lang={lang} />
            </nav>
          </div>
        </header>
        {paparPenaja && (
          <div className="print-hide mx-auto max-w-5xl px-4 pt-6">
            <PenajaStrip pratonton={penajaPreview} />
          </div>
        )}
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <footer className="print-hide mt-16 border-t bg-white py-6 text-center text-xs text-slate-500">
          <div className="mb-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
            {paparInfaq && <Link href="/infaq" className="font-medium text-surau hover:underline">{t("Infaq", "Infaq")}{!infaqOn && master ? " ·pratonton" : ""}</Link>}
            {paparPenaja && <Link href="/rakan" className="font-medium text-surau hover:underline">{t("Rakan Surau", "Our Partners")}</Link>}
            <Link href="/dasar-privasi" className="hover:text-surau hover:underline">{t("Dasar Privasi", "Privacy Policy")}</Link>
            <Link href="/terma" className="hover:text-surau hover:underline">{t("Terma & Penafian", "Terms & Disclaimer")}</Link>
            <Link href="/keselamatan" className="hover:text-surau hover:underline">{t("Keselamatan", "Security")}</Link>
            <Link href="/polisi-bayaran-balik" className="hover:text-surau hover:underline">{t("Bayaran Balik", "Refunds")}</Link>
          </div>
          {t("Jawatankuasa Surau Ar Raudhah, Eco Majestic", "Surau Ar Raudhah Committee, Eco Majestic")}
        </footer>
      </body>
    </html>
  );
}
