import Link from "next/link";
import { redirect } from "next/navigation";
import { NAMA_SURAU, YURAN_KHAIRAT_TAHUNAN, PAKEJ_KHAIRAT } from "@/lib/tetapan";
import { khairatDibuka, pampasanKhairat } from "@/lib/tetapanSistem";
import { getProfil, isMaster } from "@/lib/sesi";
import { rm } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Khairat Kematian — Surau Ar Raudhah",
  description:
    "Skim Khairat Kematian Surau Ar Raudhah Eco Majestic — sertai untuk meringankan beban keluarga di saat dukacita.",
};

export default async function KhairatInfo() {
  const [dibuka, pampasan, profil] = await Promise.all([
    khairatDibuka(),
    pampasanKhairat(),
    getProfil(),
  ]);
  const stafPreview = !dibuka && isMaster(profil);
  // Belum dilancarkan & bukan super admin → sorok sepenuhnya (orang ramai tak boleh baca).
  if (!dibuka && !stafPreview) redirect("/");

  const faq = [
    {
      s: "Apa itu Khairat Kematian?",
      j: `Khairat Kematian ialah skim bantuan bersama (ta'awun) di kalangan ahli kariah ${NAMA_SURAU}. Setiap ahli menyumbang yuran tahunan, dan apabila berlaku kematian yang dilindungi, keluarga si mati menerima bantuan kewangan segera untuk membantu menampung kos pengurusan jenazah dan keperluan keluarga.`,
    },
    {
      s: "Siapa yang layak menyertai?",
      j: "Semua ahli kariah yang telah berdaftar dengan surau. Jika anda belum berdaftar, anda perlu mendaftar sebagai ahli kariah terlebih dahulu (percuma), kemudian sertai skim khairat.",
    },
    {
      s: "Berapa pampasan yang akan diterima keluarga?",
      j: `Keluarga si mati akan menerima pampasan sebanyak RM${rm(pampasan).replace(
        "RM",
        "",
      )} bagi setiap kematian yang dilindungi. Jumlah ini boleh dikaji semula oleh AJK dari semasa ke semasa mengikut keupayaan tabung.`,
    },
    {
      s: "Bilakah perlindungan bermula?",
      j: "Perlindungan bermula setelah yuran tahunan dijelaskan dan keahlian khairat diaktifkan oleh sistem. Anda boleh membayar terus secara online untuk 1, 3, 5 atau 10 tahun sekali gus.",
    },
    {
      s: "Bagaimana jika saya sudah menjadi ahli kariah?",
      j: "Log masuk ke Portal Ahli anda, kemas kini maklumat, dan pilih pakej khairat untuk membayar yuran secara online. Keahlian khairat anda akan diaktifkan secara automatik selepas pembayaran berjaya.",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="overflow-hidden rounded-2xl border-2 border-teal-600 bg-gradient-to-br from-teal-700 to-emerald-800 p-6 text-white shadow-lg sm:p-10">
        <span className="inline-block rounded-full bg-amber-400 px-3 py-1 text-xs font-bold uppercase tracking-wide text-teal-900">
          Skim Khairat Kematian
        </span>
        <h1 className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl">
          Ringankan beban keluarga di saat dukacita
        </h1>
        <p className="mt-3 max-w-2xl text-teal-50">
          Dengan hanya <span className="font-bold text-white">RM{YURAN_KHAIRAT_TAHUNAN}/tahun</span>, anda dan
          keluarga dilindungi. Keluarga menerima pampasan{" "}
          <span className="font-bold text-white">RM{rm(pampasan).replace("RM", "")}</span> bagi setiap kematian
          yang dilindungi.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/daftar"
            className="rounded-lg bg-amber-400 px-6 py-3 text-center text-sm font-bold text-teal-900 shadow hover:bg-amber-300"
          >
            Daftar &amp; Sertai Sekarang →
          </Link>
          <Link
            href="/masuk"
            className="rounded-lg border-2 border-white/70 px-6 py-3 text-center text-sm font-semibold text-white hover:bg-white/10"
          >
            Sudah Ahli? Log Masuk
          </Link>
        </div>
        {stafPreview && (
          <p className="mt-4 rounded-lg bg-amber-400/90 px-4 py-2 text-sm font-semibold text-teal-900">
            👁️ PRATONTON SUPER ADMIN — halaman ini belum dilancarkan. Orang lain tidak nampak. Flip suis di
            /admin/tetapan bila sedia untuk lancar.
          </p>
        )}
      </section>

      {/* Pakej */}
      <section>
        <h2 className="mb-1 text-xl font-bold text-slate-900">Pilihan Pakej Yuran</h2>
        <p className="mb-4 text-sm text-slate-600">
          Bayar untuk beberapa tahun sekali gus — lebih mudah, tidak perlu risau terlupa memperbaharui setiap
          tahun.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {PAKEJ_KHAIRAT.map((pk) => (
            <div key={pk.tahun} className="rounded-xl border-2 border-surau/30 bg-white p-4 text-center shadow-sm">
              <div className="text-sm font-bold text-slate-900">{pk.label}</div>
              <div className="mt-1 text-2xl font-extrabold text-surau">RM{YURAN_KHAIRAT_TAHUNAN * pk.tahun}</div>
              <div className="mt-0.5 text-xs text-slate-500">RM{YURAN_KHAIRAT_TAHUNAN}/tahun</div>
            </div>
          ))}
        </div>
      </section>

      {/* Cara sertai */}
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-bold text-slate-900">Cara Sertai</h2>
        <ol className="space-y-4">
          {[
            {
              t: "Daftar / Semak keahlian",
              d: "Masukkan No. Kad Pengenalan anda. Jika belum berdaftar, isi borang pendaftaran ahli kariah (percuma). Jika sudah, teruskan log masuk.",
            },
            {
              t: "Kemas kini maklumat & tanggungan",
              d: "Pastikan maklumat diri dan senarai tanggungan (isteri/suami, anak) lengkap supaya perlindungan meliputi keluarga anda.",
            },
            {
              t: "Pilih pakej & bayar online",
              d: "Pilih pakej 1, 3, 5 atau 10 tahun dan bayar terus melalui FPX, kad atau e-wallet. Keahlian khairat aktif automatik selepas bayaran berjaya.",
            },
          ].map((s, i) => (
            <li key={i} className="flex gap-4">
              <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-surau text-sm font-bold text-white">
                {i + 1}
              </div>
              <div>
                <div className="font-semibold text-slate-900">{s.t}</div>
                <p className="text-sm text-slate-600">{s.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* FAQ */}
      <section>
        <h2 className="mb-4 text-xl font-bold text-slate-900">Soalan Lazim</h2>
        <div className="space-y-3">
          {faq.map((f, i) => (
            <details key={i} className="group rounded-xl bg-white p-4 shadow-sm">
              <summary className="cursor-pointer list-none font-semibold text-slate-900 marker:hidden">
                <span className="text-surau">›</span> {f.s}
              </summary>
              <p className="mt-2 text-sm text-slate-600">{f.j}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA akhir */}
      <section className="rounded-2xl bg-surau/5 p-6 text-center">
        <h2 className="text-lg font-bold text-slate-900">Sedia untuk menyertai?</h2>
        <p className="mx-auto mt-1 max-w-xl text-sm text-slate-600">
          Sertai skim khairat kematian hari ini dan berikan ketenangan kepada keluarga anda.
        </p>
        <div className="mt-4 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/daftar"
            className="rounded-lg bg-surau px-6 py-3 text-sm font-semibold text-white hover:bg-surau-dark"
          >
            Daftar / Semak Keahlian →
          </Link>
          <Link
            href="/masuk"
            className="rounded-lg border border-surau/40 px-6 py-3 text-sm font-semibold text-surau hover:bg-surau/10"
          >
            Log Masuk Portal Ahli
          </Link>
        </div>
        <p className="mt-4 text-xs text-slate-400">
          Sebarang pertanyaan, hubungi Setiausaha Surau melalui e-mel arraudhah.ecomajestic@gmail.com.
        </p>
      </section>
    </div>
  );
}
