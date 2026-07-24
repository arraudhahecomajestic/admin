import Link from "next/link";
import { getProfil, isStaf } from "@/lib/sesi";
import { PerluMasuk, TiadaAkses } from "@/components/PerluMasuk";
import { createAdminClient, adminConfigured } from "@/lib/supabaseAdmin";
import ButangCetak from "@/components/ButangCetak";
import { NAMA_SURAU, LOGO_JAIS, LOGO_SELANGOR, LOGO_SURAU_TEGAK } from "@/lib/tetapan";

export const dynamic = "force-dynamic";

const namaSurau = NAMA_SURAU;

function ms(d: string | null) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("ms-MY", { day: "2-digit", month: "long", year: "numeric" });
}

export default async function CetakPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  if (!adminConfigured)
    return <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Supabase belum dikonfigurasi.</div>;
  const profil = await getProfil();
  if (!profil) return <PerluMasuk />;
  if (!isStaf(profil)) return <TiadaAkses />;

  const db = createAdminClient();
  let q = db
    .from("ahli_kariah")
    .select("*, tanggungan(nama, hubungan, no_kp)")
    .order("tarikh_daftar", { ascending: false });
  if (searchParams.status && ["menunggu", "lulus", "tolak"].includes(searchParams.status)) {
    q = q.eq("status", searchParams.status);
  }
  const { data } = await q;
  const senarai = (data as any[]) ?? [];

  return (
    <div>
      {/* Bar alat — sembunyi semasa cetak */}
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cetak Borang Pendaftaran</h1>
          <p className="text-sm text-slate-600">{senarai.length} borang · format rasmi JAIS · satu borang satu muka surat.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 text-sm">
            <TapisLink label="Semua" href="/admin/cetak" aktif={!searchParams.status} />
            <TapisLink label="Menunggu" href="/admin/cetak?status=menunggu" aktif={searchParams.status === "menunggu"} />
            <TapisLink label="Diluluskan" href="/admin/cetak?status=lulus" aktif={searchParams.status === "lulus"} />
          </div>
          <ButangCetak />
        </div>
      </div>

      {senarai.length === 0 && (
        <p className="no-print rounded-lg bg-white p-6 text-center text-slate-400 shadow-sm">Tiada borang untuk dicetak.</p>
      )}

      {/* Borang-borang */}
      <div className="space-y-6">
        {senarai.map((a) => (
          <Borang key={a.id} a={a} nama={namaSurau} />
        ))}
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .borang { page-break-after: always; box-shadow: none !important; border: none !important; margin: 0 !important; }
          body { background: white !important; }
        }
        .borang { background: white; }
        .kotak { border: 1px solid #000; padding: 2px 6px; min-height: 22px; }
        .lbl { font-size: 12px; color: #111; }
      `}</style>
    </div>
  );
}

function TapisLink({ label, href, aktif }: { label: string; href: string; aktif: boolean }) {
  return (
    <Link href={href} className={`rounded-lg px-3 py-1.5 font-medium ${aktif ? "bg-surau text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
      {label}
    </Link>
  );
}

function Baris({ label, nilai }: { label: string; nilai?: string | null }) {
  return (
    <div className="mb-2">
      <div className="lbl font-semibold">{label}</div>
      <div className="kotak">{nilai || " "}</div>
    </div>
  );
}

function Ulasan({ tajuk, sokong, catatan, oleh, tarikh }: { tajuk: string; sokong: boolean | null; catatan: string | null; oleh: string | null; tarikh: string | null }) {
  return (
    <div className="mb-3 border-t pt-2">
      <div className="lbl font-semibold">{tajuk}</div>
      <div className="lbl">
        Status:{" "}
        {sokong === null ? "☐ Menyokong  ☐ Tidak Menyokong" : sokong ? "☑ Menyokong" : "☑ Tidak Menyokong"}
      </div>
      <div className="lbl">Catatan: {catatan || "________________________________"}</div>
      <div className="mt-1 flex justify-between lbl">
        <span>T/Tangan & Cop: {oleh || "____________________"}</span>
        <span>Tarikh: {ms(tarikh) || "____________"}</span>
      </div>
    </div>
  );
}

function Borang({ a, nama }: { a: any; nama: string }) {
  const tempoh = a.tempoh_menetap_nilai ? `${a.tempoh_menetap_nilai} ${a.tempoh_menetap_unit || ""}` : "";
  return (
    <article className="borang mx-auto max-w-[800px] rounded-lg bg-white p-8 shadow-sm" style={{ fontFamily: "serif" }}>
      <header className="mb-4 flex items-center justify-between gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LOGO_SELANGOR} alt="Selangor" style={{ height: 64, width: "auto" }} />
        <div className="flex flex-col items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_SURAU_TEGAK} alt="Surau" style={{ height: 46, width: "auto", marginBottom: 4 }} />
          <h2 className="text-base font-bold">BORANG PENDAFTARAN</h2>
          <h2 className="text-base font-bold">AHLI KARIAH MASJID DAN SURAU</h2>
          <p className="text-sm font-semibold">NEGERI SELANGOR</p>
          <p className="mt-1 text-sm">Kariah Masjid / Surau: <b>{a.kariah || nama}</b></p>
          <p className="text-xs text-slate-500">No. Rujukan: {a.no_ahli || "-"}</p>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LOGO_JAIS} alt="JAIS" style={{ height: 56, width: "auto" }} />
      </header>

      <div className="mb-2 inline-block bg-slate-800 px-2 py-0.5 text-xs font-bold text-white">BAHAGIAN A : BUTIRAN AHLI KARIAH</div>
      <Baris label="1. Nama Pemohon" nilai={a.nama} />
      <Baris label="2. No. Kad Pengenalan" nilai={a.no_kp} />
      <Baris label="3. Alamat Dalam Kad Pengenalan / Passport" nilai={a.alamat_kp} />
      <Baris label="4. Alamat Tempat Tinggal Sekarang" nilai={a.alamat} />
      <div className="grid grid-cols-3 gap-2">
        <Baris label="5. No. Telefon Rumah" nilai={a.no_telefon_rumah} />
        <Baris label="No. H/P" nilai={a.telefon} />
        <Baris label="E-mel" nilai={a.emel} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Baris label="6. Status Perkahwinan" nilai={a.status_perkahwinan === "berkahwin" ? "Sudah Berkahwin" : a.status_perkahwinan === "bujang" ? "Bujang" : a.status_perkahwinan} />
        <Baris label="7. Tempoh Masa Telah Menetap" nilai={tempoh} />
      </div>

      {a.tanggungan?.length > 0 && (
        <div className="mb-2">
          <div className="lbl font-semibold">Tanggungan / Isi Rumah:</div>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr><th className="border px-1 text-left">Nama</th><th className="border px-1 text-left">Hubungan</th><th className="border px-1 text-left">No. KP</th></tr>
            </thead>
            <tbody>
              {a.tanggungan.map((t: any, i: number) => (
                <tr key={i}><td className="border px-1">{t.nama}</td><td className="border px-1">{t.hubungan}</td><td className="border px-1">{t.no_kp || "-"}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-2 lbl">8. Saya mengaku bahawa segala maklumat dalam Bahagian A adalah benar. {a.pengakuan ? "☑" : "☐"}</p>
      <div className="mb-4 mt-1 flex justify-between lbl">
        <span>Tandatangan Pemohon: ____________________</span>
        <span>Tarikh: {ms(a.tarikh_daftar)}</span>
      </div>

      <div className="mb-2 inline-block bg-slate-800 px-2 py-0.5 text-xs font-bold text-white">BAHAGIAN B : ULASAN</div>
      <Ulasan tajuk="Ulasan Pengerusi MPKK / JPP / Setiausaha Masjid / Surau" sokong={a.ulasan_su_sokong} catatan={a.ulasan_su_catatan} oleh={a.ulasan_su_oleh} tarikh={a.ulasan_su_tarikh} />
      <Ulasan tajuk="Ulasan Nazir Masjid / Pengerusi Surau" sokong={a.ulasan_nazir_sokong} catatan={a.ulasan_nazir_catatan} oleh={a.ulasan_nazir_oleh} tarikh={a.ulasan_nazir_tarikh} />

      <div className="mb-2 mt-2 inline-block bg-slate-800 px-2 py-0.5 text-xs font-bold text-white">BAHAGIAN C : KEPUTUSAN PERMOHONAN</div>
      <p className="lbl">
        Keputusan: {a.status === "lulus" ? "☑ Diluluskan" : a.status === "tolak" ? "☑ Tidak Diluluskan" : "☐ Diluluskan   ☐ Tidak Diluluskan"}
      </p>
      <div className="mt-3 flex justify-between lbl">
        <span>Pengerusi Mesyuarat JK Kariah/Surau: {a.keputusan_oleh || "____________________"}</span>
        <span>Tarikh: {ms(a.keputusan_tarikh) || "____________"}</span>
      </div>
    </article>
  );
}
