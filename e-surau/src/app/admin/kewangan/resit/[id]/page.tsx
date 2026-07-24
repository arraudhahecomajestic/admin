import Link from "next/link";
import { getProfil, isStaf } from "@/lib/sesi";
import { PerluMasuk, TiadaAkses } from "@/components/PerluMasuk";
import { createAdminClient, adminConfigured } from "@/lib/supabaseAdmin";
import ButangCetak from "@/components/ButangCetak";
import { rm, tarikhMs } from "@/lib/format";
import { NAMA_SURAU, LOGO_SURAU_TEGAK } from "@/lib/tetapan";

export const dynamic = "force-dynamic";

export default async function ResitPage({ params }: { params: { id: string } }) {
  if (!adminConfigured)
    return <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Supabase belum dikonfigurasi.</div>;
  const profil = await getProfil();
  if (!profil) return <PerluMasuk />;
  if (!isStaf(profil)) return <TiadaAkses />;

  const db = createAdminClient();
  const { data } = await db
    .from("kutipan")
    .select("no_resit, jumlah, kaedah, tarikh, catatan, kategori:kategori_kutipan(nama), ahli:ahli_kariah(nama, no_ahli)")
    .eq("id", params.id)
    .single();
  if (!data) return <p className="text-slate-500">Resit tidak dijumpai.</p>;
  const k: any = data;

  return (
    <div className="mx-auto max-w-lg">
      <div className="no-print mb-4 flex items-center justify-between">
        <Link href="/admin/kewangan" className="text-sm text-slate-500 hover:underline">← Kembali</Link>
        <ButangCetak />
      </div>

      <div className="resit rounded-xl border bg-white p-8 shadow-sm">
        <div className="mb-4 flex flex-col items-center border-b pb-4 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_SURAU_TEGAK} alt="Surau" style={{ height: 60 }} />
          <h1 className="mt-2 text-lg font-bold text-slate-900">{NAMA_SURAU}</h1>
          <p className="mt-1 text-sm font-semibold tracking-wide text-surau-dark">RESIT RASMI</p>
        </div>

        <dl className="space-y-2 text-sm">
          <Baris k="No. Resit" v={k.no_resit} />
          <Baris k="Tarikh" v={tarikhMs(k.tarikh)} />
          <Baris k="Kategori" v={k.kategori?.nama} />
          <Baris k="Daripada" v={k.ahli ? `${k.ahli.nama} (${k.ahli.no_ahli})` : "Umum"} />
          <Baris k="Kaedah" v={k.kaedah} />
          {k.catatan && <Baris k="Catatan" v={k.catatan} />}
        </dl>

        <div className="mt-4 flex items-center justify-between rounded-lg bg-surau/10 p-4">
          <span className="font-bold text-slate-900">JUMLAH</span>
          <span className="text-2xl font-bold text-surau-dark">{rm(k.jumlah)}</span>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Resit ini dijana secara automatik oleh sistem e-Surau. Terima kasih atas sumbangan anda.
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
      <dd className="font-medium text-slate-800">{v || "-"}</dd>
    </div>
  );
}
