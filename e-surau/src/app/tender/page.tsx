import Link from "next/link";
import { createAdminClient, adminConfigured } from "@/lib/supabaseAdmin";
import { tarikhMs } from "@/lib/format";
import { tenderTutup, clsStatusTender, hariIniMY } from "@/lib/tender";

export const dynamic = "force-dynamic";

export default async function TenderAwamPage() {
  if (!adminConfigured) return <p className="p-8 text-center text-slate-500">Sistem belum dikonfigurasi.</p>;
  const db = createAdminClient();
  const { data } = await db.from("tender").select("id, no_ruj, tajuk, keterangan, kategori, tarikh_iklan, tarikh_tutup, status")
    .neq("status", "batal").order("tarikh_tutup", { ascending: true, nullsFirst: false }).order("dicipta", { ascending: false });
  const semua = (data as any[]) ?? [];
  const hariIni = hariIniMY();
  const aktif = semua.filter((t) => !tenderTutup(t, hariIni));
  const tutup = semua.filter((t) => tenderTutup(t, hariIni));

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-surau">Surau Ar-Raudhah, Eco Majestic</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Iklan Tender & Sebut Harga</h1>
        <p className="mt-1 text-sm text-slate-600">Peluang tender & pembekalan surau. Kariah &amp; vendor dialu-alukan menyertai.</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">Tender Aktif ({aktif.length})</h2>
        {aktif.length === 0 && <p className="rounded-xl bg-white p-6 text-center text-slate-400 shadow-sm">Tiada tender aktif buat masa ini.</p>}
        {aktif.map((t) => <Kad key={t.id} t={t} tutup={false} />)}
      </section>

      {tutup.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">Tender Ditutup ({tutup.length})</h2>
          {tutup.map((t) => <Kad key={t.id} t={t} tutup={true} />)}
        </section>
      )}

      <div className="text-center"><Link href="/" className="text-sm text-surau hover:underline">← Laman utama</Link></div>
    </div>
  );
}

function Kad({ t, tutup }: { t: any; tutup: boolean }) {
  return (
    <Link href={`/tender/${t.id}`} className="block rounded-xl bg-white p-5 shadow-sm transition hover:shadow">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {t.kategori && <span className="rounded bg-surau/10 px-2 py-0.5 text-xs font-semibold text-surau">{t.kategori}</span>}
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${clsStatusTender(tutup)}`}>{tutup ? "Ditutup" : "Aktif"}</span>
          </div>
          <h3 className="mt-1 font-bold text-slate-900">{t.tajuk}</h3>
          {t.no_ruj && <p className="text-xs text-slate-400">Rujukan: {t.no_ruj}</p>}
        </div>
      </div>
      {t.keterangan && <p className="mt-2 line-clamp-2 whitespace-pre-line text-sm text-slate-600">{t.keterangan}</p>}
      <div className="mt-2 text-xs text-slate-500">
        {t.tarikh_tutup ? <>Tarikh tutup: <b className={tutup ? "" : "text-surau-dark"}>{tarikhMs(t.tarikh_tutup)}</b></> : "Tiada tarikh tutup ditetapkan"}
      </div>
      <span className="mt-2 inline-block text-sm font-semibold text-surau">Lihat butiran →</span>
    </Link>
  );
}
