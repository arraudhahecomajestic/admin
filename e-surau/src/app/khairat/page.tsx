import Link from "next/link";
import { redirect } from "next/navigation";
import { NAMA_SURAU, YURAN_KHAIRAT_TAHUNAN, PAKEJ_KHAIRAT } from "@/lib/tetapan";
import { khairatDibuka, pampasanKhairat } from "@/lib/tetapanSistem";
import { getProfil, isMaster } from "@/lib/sesi";
import { rm } from "@/lib/format";
import { bahasaSemasa } from "@/lib/bahasa";
import { buatT } from "@/lib/i18n";

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

  const tr = buatT(bahasaSemasa());
  const pampasanTeks = rm(pampasan).replace("RM", "");

  const faq = [
    {
      s: tr("Apa itu Khairat Kematian?", "What is the Death Benefit scheme?"),
      j: tr(
        `Khairat Kematian ialah skim bantuan bersama (ta'awun) di kalangan ahli kariah ${NAMA_SURAU}. Setiap ahli menyumbang yuran tahunan, dan apabila berlaku kematian yang dilindungi, keluarga si mati menerima bantuan kewangan segera untuk membantu menampung kos pengurusan jenazah dan keperluan keluarga.`,
        `The Death Benefit is a mutual-aid (ta'awun) scheme among the members of ${NAMA_SURAU}. Each member pays an annual fee, and when a covered death occurs, the deceased's family receives immediate financial assistance to help cover funeral costs and family needs.`,
      ),
    },
    {
      s: tr("Siapa yang layak menyertai?", "Who is eligible to join?"),
      j: tr(
        "Semua ahli kariah yang telah berdaftar dengan surau. Jika anda belum berdaftar, anda perlu mendaftar sebagai ahli kariah terlebih dahulu (percuma), kemudian sertai skim khairat.",
        "All community members registered with the surau. If you are not yet registered, you must first register as a member (free of charge), then join the death benefit scheme.",
      ),
    },
    {
      s: tr("Berapa pampasan yang akan diterima keluarga?", "How much will the family receive?"),
      j: tr(
        `Keluarga si mati akan menerima pampasan sebanyak RM${pampasanTeks} bagi setiap kematian yang dilindungi. Jumlah ini boleh dikaji semula oleh AJK dari semasa ke semasa mengikut keupayaan tabung.`,
        `The deceased's family will receive a benefit of RM${pampasanTeks} for each covered death. This amount may be reviewed by the committee from time to time based on the fund's capacity.`,
      ),
    },
    {
      s: tr("Bilakah perlindungan bermula?", "When does coverage begin?"),
      j: tr(
        "Perlindungan bermula setelah yuran tahunan dijelaskan dan keahlian khairat diaktifkan oleh sistem. Anda boleh membayar terus secara online untuk 1, 3, 5 atau 10 tahun sekali gus.",
        "Coverage begins once the annual fee is settled and your death-benefit membership is activated by the system. You can pay online for 1, 3, 5 or 10 years at once.",
      ),
    },
    {
      s: tr("Bagaimana jika saya sudah menjadi ahli kariah?", "What if I am already a member?"),
      j: tr(
        "Log masuk ke Portal Ahli anda, kemas kini maklumat, dan pilih pakej khairat untuk membayar yuran secara online. Keahlian khairat anda akan diaktifkan secara automatik selepas pembayaran berjaya.",
        "Log in to your Member Portal, update your details, and choose a death-benefit package to pay online. Your death-benefit membership will be activated automatically after successful payment.",
      ),
    },
  ];

  const langkah = [
    {
      t: tr("Daftar / Semak keahlian", "Register / Check membership"),
      d: tr(
        "Masukkan No. Kad Pengenalan anda. Jika belum berdaftar, isi borang pendaftaran ahli kariah (percuma). Jika sudah, teruskan log masuk.",
        "Enter your IC number. If you are not registered, fill in the member registration form (free). If you are, continue to log in.",
      ),
    },
    {
      t: tr("Kemas kini maklumat & tanggungan", "Update details & dependants"),
      d: tr(
        "Pastikan maklumat diri dan senarai tanggungan (isteri/suami, anak) lengkap supaya perlindungan meliputi keluarga anda.",
        "Make sure your personal details and list of dependants (spouse, children) are complete so coverage extends to your family.",
      ),
    },
    {
      t: tr("Pilih pakej & bayar online", "Choose a package & pay online"),
      d: tr(
        "Pilih pakej 1, 3, 5 atau 10 tahun dan bayar terus melalui FPX, kad atau e-wallet. Keahlian khairat aktif automatik selepas bayaran berjaya.",
        "Choose a 1, 3, 5 or 10-year package and pay via FPX, card or e-wallet. Death-benefit membership activates automatically after successful payment.",
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="overflow-hidden rounded-2xl border-2 border-teal-600 bg-gradient-to-br from-teal-700 to-emerald-800 p-6 text-white shadow-lg sm:p-10">
        <span className="inline-block rounded-full bg-amber-400 px-3 py-1 text-xs font-bold uppercase tracking-wide text-teal-900">
          {tr("Skim Khairat Kematian", "Death Benefit Scheme")}
        </span>
        <h1 className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl">
          {tr("Ringankan beban keluarga di saat dukacita", "Ease your family's burden in times of grief")}
        </h1>
        <p className="mt-3 max-w-2xl text-teal-50">
          {tr("Dengan hanya ", "For just ")}
          <span className="font-bold text-white">RM{YURAN_KHAIRAT_TAHUNAN}/{tr("tahun", "year")}</span>
          {tr(", anda dan keluarga dilindungi. Keluarga menerima pampasan ", ", you and your family are covered. The family receives a benefit of ")}
          <span className="font-bold text-white">RM{pampasanTeks}</span>
          {tr(" bagi setiap kematian yang dilindungi.", " for each covered death.")}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/daftar"
            className="rounded-lg bg-amber-400 px-6 py-3 text-center text-sm font-bold text-teal-900 shadow hover:bg-amber-300"
          >
            {tr("Daftar & Sertai Sekarang →", "Register & Join Now →")}
          </Link>
          <Link
            href="/masuk"
            className="rounded-lg border-2 border-white/70 px-6 py-3 text-center text-sm font-semibold text-white hover:bg-white/10"
          >
            {tr("Sudah Ahli? Log Masuk", "Already a member? Log in")}
          </Link>
        </div>
        {stafPreview && (
          <p className="mt-4 rounded-lg bg-amber-400/90 px-4 py-2 text-sm font-semibold text-teal-900">
            {tr(
              "PRATONTON SUPER ADMIN — halaman ini belum dilancarkan. Orang lain tidak nampak. Flip suis di /admin/tetapan bila sedia untuk lancar.",
              "SUPER ADMIN PREVIEW — this page is not yet launched. Nobody else can see it. Flip the switch at /admin/tetapan when ready to launch.",
            )}
          </p>
        )}
      </section>

      {/* Pakej */}
      <section>
        <h2 className="mb-1 text-xl font-bold text-slate-900">{tr("Pilihan Pakej Yuran", "Fee Package Options")}</h2>
        <p className="mb-4 text-sm text-slate-600">
          {tr(
            "Bayar untuk beberapa tahun sekali gus — lebih mudah, tidak perlu risau terlupa memperbaharui setiap tahun.",
            "Pay for several years at once — easier, with no worry about forgetting to renew each year.",
          )}
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {PAKEJ_KHAIRAT.map((pk) => (
            <div key={pk.tahun} className="rounded-xl border-2 border-surau/30 bg-white p-4 text-center shadow-sm">
              <div className="text-sm font-bold text-slate-900">
                {pk.tahun} {tr("Tahun", pk.tahun > 1 ? "Years" : "Year")}
              </div>
              <div className="mt-1 text-2xl font-extrabold text-surau">RM{YURAN_KHAIRAT_TAHUNAN * pk.tahun}</div>
              <div className="mt-0.5 text-xs text-slate-500">RM{YURAN_KHAIRAT_TAHUNAN}/{tr("tahun", "year")}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Cara sertai */}
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-bold text-slate-900">{tr("Cara Sertai", "How to Join")}</h2>
        <ol className="space-y-4">
          {langkah.map((s, i) => (
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
        <h2 className="mb-4 text-xl font-bold text-slate-900">{tr("Soalan Lazim", "Frequently Asked Questions")}</h2>
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
        <h2 className="text-lg font-bold text-slate-900">{tr("Sedia untuk menyertai?", "Ready to join?")}</h2>
        <p className="mx-auto mt-1 max-w-xl text-sm text-slate-600">
          {tr(
            "Sertai skim khairat kematian hari ini dan berikan ketenangan kepada keluarga anda.",
            "Join the death benefit scheme today and give your family peace of mind.",
          )}
        </p>
        <div className="mt-4 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/daftar"
            className="rounded-lg bg-surau px-6 py-3 text-sm font-semibold text-white hover:bg-surau-dark"
          >
            {tr("Daftar / Semak Keahlian →", "Register / Check Membership →")}
          </Link>
          <Link
            href="/masuk"
            className="rounded-lg border border-surau/40 px-6 py-3 text-sm font-semibold text-surau hover:bg-surau/10"
          >
            {tr("Log Masuk Portal Ahli", "Log in to Member Portal")}
          </Link>
        </div>
        <p className="mt-4 text-xs text-slate-400">
          {tr("Sebarang pertanyaan, hubungi Setiausaha Surau melalui e-mel ", "For any enquiries, contact the Surau Secretary via email ")}
          arraudhah.ecomajestic@gmail.com.
        </p>
      </section>
    </div>
  );
}
