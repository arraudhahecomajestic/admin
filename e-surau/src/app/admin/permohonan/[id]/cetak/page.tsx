import { getProfil, isPentadbir } from "@/lib/sesi";
import { PerluMasuk, TiadaAkses } from "@/components/PerluMasuk";
import { createAdminClient, adminConfigured } from "@/lib/supabaseAdmin";
import ButangCetak from "@/components/ButangCetak";
import { tarikhMs } from "@/lib/format";
import { NAMA_SURAU, LOGO_JAIS, LOGO_SELANGOR, LOGO_SURAU_TEGAK } from "@/lib/tetapan";

export const dynamic = "force-dynamic";

export default async function CetakIndividuPage({ params }: { params: { id: string } }) {
  if (!adminConfigured)
    return <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Supabase belum dikonfigurasi.</div>;
  const profil = await getProfil();
  if (!profil) return <PerluMasuk />;
  if (!isPentadbir(profil)) return <TiadaAkses />;

  const db = createAdminClient();
  const { data } = await db
    .from("ahli_kariah")
    .select("*, tanggungan(nama, hubungan, no_kp)")
    .eq("id", params.id)
    .single();
  if (!data) return <p className="text-slate-500">Rekod tidak dijumpai.</p>;
  const a: any = data;

  async function signed(path: string | null) {
    if (!path) return null;
    const rel = path.replace(/^salinan-kp\//, "");
    const { data } = await db.storage.from("salinan-kp").createSignedUrl(rel, 3600);
    return data?.signedUrl ?? null;
  }
  const [depan, belakang, selfie, ttd] = await Promise.all([
    signed(a.url_kp_depan), signed(a.url_kp_belakang), signed(a.url_selfie), signed(a.url_tandatangan),
  ]);
  const tempoh = a.tempoh_menetap_nilai ? `${a.tempoh_menetap_nilai} ${a.tempoh_menetap_unit ?? ""}` : "";

  return (
    <div>
      <div className="no-print mb-4 flex items-center justify-between">
        <a href={`/admin/permohonan/${a.id}`} className="text-sm text-slate-500 hover:underline">← Kembali</a>
        <ButangCetak />
      </div>

      <article className="borang mx-auto max-w-[800px] rounded-lg bg-white p-8 shadow-sm" style={{ fontFamily: "serif" }}>
        <header className="mb-4 flex items-center justify-between gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_SELANGOR} alt="Selangor" style={{ height: 64 }} />
          <div className="flex flex-col items-center text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO_SURAU_TEGAK} alt="Surau" style={{ height: 46, marginBottom: 4 }} />
            <h2 className="text-base font-bold">BORANG PENDAFTARAN</h2>
            <h2 className="text-base font-bold">AHLI KARIAH MASJID DAN SURAU NEGERI SELANGOR</h2>
            <p className="mt-1 text-sm">Kariah: <b>{a.kariah || NAMA_SURAU}</b></p>
            <p className="text-xs text-slate-500">No. Rujukan: {a.no_ahli || "-"}</p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_JAIS} alt="JAIS" style={{ height: 56 }} />
        </header>

        <div className="mb-2 inline-block bg-slate-800 px-2 py-0.5 text-xs font-bold text-white">BAHAGIAN A : BUTIRAN AHLI KARIAH</div>
        <Baris label="1. Nama Pemohon" nilai={[a.gelaran, a.nama].filter(Boolean).join(" ")} />
        <Baris label="2. No. Kad Pengenalan" nilai={a.no_kp} />
        <Baris label="3. Alamat Dalam KP / Passport" nilai={a.alamat_kp} />
        <Baris label="4. Alamat Tempat Tinggal Sekarang" nilai={a.alamat} />
        <div className="grid grid-cols-3 gap-2">
          <Baris label="5. Telefon Rumah" nilai={a.no_telefon_rumah} />
          <Baris label="No. H/P" nilai={a.telefon} />
          <Baris label="E-mel" nilai={a.emel} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Baris label="6. Status Perkahwinan" nilai={a.status_perkahwinan} />
          <Baris label="7. Tempoh Menetap" nilai={tempoh} />
        </div>

        {a.tanggungan?.length > 0 && (
          <div className="mb-2">
            <div className="text-xs font-semibold">Tanggungan / Isi Rumah:</div>
            <table className="w-full border-collapse text-xs">
              <thead><tr><th className="border px-1 text-left">Nama</th><th className="border px-1 text-left">Hubungan</th><th className="border px-1 text-left">No. KP</th></tr></thead>
              <tbody>
                {a.tanggungan.map((t: any, i: number) => (
                  <tr key={i}><td className="border px-1">{t.nama}</td><td className="border px-1">{t.hubungan}</td><td className="border px-1">{t.no_kp || "-"}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-2 text-xs">8. Saya mengaku maklumat dalam Bahagian A adalah benar. {a.pengakuan ? "☑" : "☐"}</p>
        <div className="mb-2 mt-2 flex items-end justify-between text-xs">
          <div>
            <div className="mb-1">Tandatangan Pemohon:</div>
            {ttd
              ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={ttd} alt="Tandatangan" style={{ height: 60 }} />
              : <div>____________________</div>}
          </div>
          <span>Tarikh: {tarikhMs(a.tarikh_esign || a.tarikh_kemaskini || a.tarikh_daftar)}</span>
        </div>

        {/* Salinan dokumen */}
        <div className="mt-4 border-t pt-3">
          <div className="mb-2 inline-block bg-slate-800 px-2 py-0.5 text-xs font-bold text-white">SALINAN DOKUMEN PENGESAHAN</div>
          <div className="grid grid-cols-3 gap-3">
            <Gambar tajuk="Kad Pengenalan (Depan)" url={depan} />
            <Gambar tajuk="Kad Pengenalan (Belakang)" url={belakang} />
            <Gambar tajuk="Swafoto (Selfie)" url={selfie} />
          </div>
        </div>
      </article>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .borang { box-shadow: none !important; border: none !important; margin: 0 !important; }
          body { background: white !important; }
        }
        .borang { background: white; }
        .kotak { border: 1px solid #000; padding: 2px 6px; min-height: 20px; font-size: 12px; }
      `}</style>
    </div>
  );
}

function Baris({ label, nilai }: { label: string; nilai?: string | null }) {
  return (
    <div className="mb-2">
      <div className="text-xs font-semibold">{label}</div>
      <div className="kotak">{nilai || " "}</div>
    </div>
  );
}

function Gambar({ tajuk, url }: { tajuk: string; url: string | null }) {
  return (
    <div className="text-center">
      <div className="mb-1 text-xs font-semibold">{tajuk}</div>
      {url
        ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={url} alt={tajuk} style={{ width: "100%", aspectRatio: "1.586", objectFit: "contain", background: "#fff", border: "1px solid #000" }} />
        : <div className="flex items-center justify-center border border-black text-xs text-slate-400" style={{ aspectRatio: "1.586" }}>Tiada</div>}
    </div>
  );
}
