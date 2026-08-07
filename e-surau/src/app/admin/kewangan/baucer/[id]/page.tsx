import Link from "next/link";
import { getProfil, bolehKewangan, bolehKewanganModul } from "@/lib/sesi";
import { PerluMasuk, TiadaAkses } from "@/components/PerluMasuk";
import { createAdminClient, adminConfigured } from "@/lib/supabaseAdmin";
import ButangCetak from "@/components/ButangCetak";
import { rm, tarikhMs, ringgitPerkataan } from "@/lib/format";
import { NAMA_SURAU, ALAMAT_SURAU, LOGO_SURAU_TEGAK } from "@/lib/tetapan";

export const dynamic = "force-dynamic";

export default async function BaucerPage({ params }: { params: { id: string } }) {
  if (!adminConfigured)
    return <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Supabase belum dikonfigurasi.</div>;
  const profil = await getProfil();
  if (!profil) return <PerluMasuk />;
  if (!bolehKewanganModul(profil)) return <TiadaAkses />;

  const db = createAdminClient();
  const { data } = await db
    .from("perbelanjaan")
    .select("*, kategori:kategori_belanja(nama)")
    .eq("id", params.id)
    .single();
  if (!data) return <p className="text-slate-500">Baucer tidak dijumpai.</p>;
  const b: any = data;

  // Jika baucer ini dijana dari tuntutan pembekal, ambil maklumat penerima
  // (nama & No. KP dari pendaftaran) + status pengesahan terima untuk "Diterima Oleh".
  const { data: tData } = await db
    .from("tuntutan_bayaran")
    .select("diterima_disah, tarikh_terima, pembekal:pembekal(nama, no_kp, syarikat)")
    .eq("perbelanjaan_id", params.id)
    .maybeSingle();
  const tuntut: any = tData;
  const penerima = tuntut?.pembekal ?? null;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="no-print mb-4 flex items-center justify-between">
        <Link href="/admin/kewangan" className="text-sm text-slate-500 hover:underline">← Kembali</Link>
        <ButangCetak />
      </div>

      <div className="resit rounded-xl border bg-white p-8 shadow-sm">
        {/* Header */}
        <div className="mb-4 flex flex-col items-center border-b pb-4 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_SURAU_TEGAK} alt="Surau" style={{ height: 60 }} />
          <h1 className="mt-2 text-lg font-bold text-slate-900">{NAMA_SURAU}</h1>
          <p className="text-xs text-slate-500">{ALAMAT_SURAU}</p>
          <p className="mt-1 text-sm font-semibold tracking-wide text-surau-dark">BAUCER BAYARAN</p>
          {b.status && b.status !== "dibayar" && (
            <p className="mt-1 text-xs font-bold uppercase tracking-wider text-amber-600">
              {b.status === "menunggu" ? "Menunggu Kelulusan Pengerusi" : b.status === "lulus" ? "Diluluskan — Belum Dibayar" : b.status === "tolak" ? "Ditolak" : ""}
            </p>
          )}
        </div>

        {/* Butiran baucer */}
        <dl className="space-y-2 text-sm">
          <Baris k="No. Baucer" v={b.no_baucer} />
          <Baris k="Tarikh" v={tarikhMs(b.tarikh)} />
          <Baris k="Kos Kategori" v={b.kategori?.nama} />
          <Baris k="Bayar Kepada" v={b.bayar_kepada} />
          <Baris k="Butiran" v={b.keterangan} />
          <Baris k="Tabung" v={b.dari_khairat ? "Khairat" : "Am"} />
          <Baris k="Cara Bayaran" v={b.cara_bayar || "Pindahan Atas Talian"} />
          <Baris k="No. Rujukan" v={b.no_rujukan_bayar} />
        </dl>

        {/* Jumlah */}
        <div className="mt-4 flex items-center justify-between rounded-lg bg-surau/10 p-4">
          <span className="font-bold text-slate-900">JUMLAH</span>
          <span className="text-2xl font-bold text-surau-dark">{rm(b.jumlah)}</span>
        </div>
        <p className="mt-2 text-sm italic text-slate-600">{ringgitPerkataan(b.jumlah)}</p>

        {/* Pengesahan — auto-isi nama, jawatan & tarikh dari rekod */}
        <div className="mt-6 grid grid-cols-3 gap-4 text-center text-xs">
          <TTD tajuk="Disediakan Oleh" jawatan={b.direkod_jawatan || "Bendahari"} nama={b.direkod_oleh} tarikh={b.tarikh} />
          <TTD tajuk="Kelulusan Oleh" jawatan={b.diluluskan_jawatan || "Setiausaha / Pengerusi"} nama={b.diluluskan_oleh} tarikh={b.tarikh_lulus} />
          <TTD tajuk="Dibayar Oleh" jawatan={b.dibayar_jawatan || "Bendahari"} nama={b.dibayar_oleh} tarikh={b.tarikh_bayar} />
        </div>

        {/* Diterima oleh — auto-isi dari pendaftaran penuntut jika baucer dari tuntutan pembekal */}
        {penerima ? (
          <div className="mt-6 rounded-lg border border-slate-200 p-4 text-xs text-slate-600">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-semibold text-slate-700">Diterima Oleh</span>
              {tuntut?.diterima_disah
                ? <span className="rounded bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-700">✓ Disahkan penerima</span>
                : <span className="rounded bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">Menunggu pengesahan penerima</span>}
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <div>Nama: <b className="text-slate-800">{penerima.nama || "-"}</b></div>
              <div>No. KP: <b className="text-slate-800">{penerima.no_kp || "-"}</b></div>
              {penerima.syarikat && <div>Syarikat: <b className="text-slate-800">{penerima.syarikat}</b></div>}
              <div>
                Tarikh terima:{" "}
                <b className="text-slate-800">
                  {tuntut?.tarikh_terima ? tarikhMs(tuntut.tarikh_terima) : "____________"}
                </b>
              </div>
            </div>
            {tuntut?.diterima_disah && (
              <p className="mt-3 text-[11px] italic text-slate-400">
                Penerimaan disahkan secara elektronik oleh penerima melalui portal pembekal — tandatangan tidak diperlukan.
              </p>
            )}
          </div>
        ) : (
          <div className="mt-6 rounded-lg border border-slate-200 p-4 text-xs text-slate-600">
            <div className="mb-3 font-semibold text-slate-700">Diterima Oleh</div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div>Nama: ____________________</div>
              <div>No. KP / Pasport: ____________________</div>
              <div>Tandatangan: ____________________</div>
              <div>Cop (jika ada): ____________________</div>
              <div>Tarikh: ____________________</div>
            </div>
          </div>
        )}

        <p className="mt-6 text-center text-[11px] text-slate-400">
          Asal untuk Bendahari · Salinan pertama untuk fail · Salinan kedua untuk penerima
        </p>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .resit { border: none !important; box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
}

function Baris({ k, v }: { k: string; v?: string | null }) {
  return (
    <div className="flex justify-between border-b border-slate-100 py-1.5">
      <dt className="text-slate-500">{k}</dt>
      <dd className="text-right font-medium text-slate-800">{v || "-"}</dd>
    </div>
  );
}

function TTD({ tajuk, jawatan, nama, tarikh }: { tajuk: string; jawatan: string; nama?: string | null; tarikh?: string | null }) {
  const t = tarikh ? new Date(tarikh).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Kuala_Lumpur" }) : "";
  return (
    <div>
      <div className="font-semibold text-slate-700">{tajuk}</div>
      <div className="mt-8 border-t border-slate-400 pt-1 font-medium text-slate-700">{nama || " "}</div>
      <div className="text-slate-500">{jawatan}</div>
      {t && <div className="text-[10px] text-slate-400">{t}</div>}
    </div>
  );
}
