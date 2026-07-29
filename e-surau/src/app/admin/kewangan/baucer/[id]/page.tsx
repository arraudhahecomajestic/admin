import Link from "next/link";
import { getProfil, bolehKewangan } from "@/lib/sesi";
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
  if (!bolehKewangan(profil)) return <TiadaAkses />;

  const db = createAdminClient();
  const { data } = await db
    .from("perbelanjaan")
    .select("*, kategori:kategori_belanja(nama)")
    .eq("id", params.id)
    .single();
  if (!data) return <p className="text-slate-500">Baucer tidak dijumpai.</p>;
  const b: any = data;

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

        {/* Pengesahan */}
        <div className="mt-6 grid grid-cols-3 gap-4 text-center text-xs">
          <TTD tajuk="Disediakan Oleh" jawatan="Penolong Bendahari" />
          <TTD tajuk="Kelulusan Oleh" jawatan="Setiausaha / Pengerusi" />
          <TTD tajuk="Dibayar Oleh" jawatan="Bendahari" />
        </div>

        {/* Diterima oleh */}
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

function TTD({ tajuk, jawatan }: { tajuk: string; jawatan: string }) {
  return (
    <div>
      <div className="font-semibold text-slate-700">{tajuk}</div>
      <div className="mt-10 border-t border-slate-400 pt-1 text-slate-500">{jawatan}</div>
    </div>
  );
}
