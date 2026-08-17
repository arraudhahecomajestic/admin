import Link from "next/link";
import { getProfil, isAdmin } from "@/lib/sesi";
import { PerluMasuk, TiadaAkses } from "@/components/PerluMasuk";
import { createAdminClient, adminConfigured } from "@/lib/supabaseAdmin";
import AdminNav from "@/components/AdminNav";
import TenderForm from "@/components/TenderForm";
import { tarikhMs } from "@/lib/format";
import { tenderTutup, clsStatusTender, hariIniMY } from "@/lib/tender";

export const dynamic = "force-dynamic";

export default async function AdminTenderPage() {
  if (!adminConfigured) return <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Supabase belum dikonfigurasi.</div>;
  const profil = await getProfil();
  if (!profil) return <PerluMasuk />;
  if (!isAdmin(profil)) return <TiadaAkses />;

  const db = createAdminClient();
  const { data } = await db.from("tender").select("id, no_ruj, tajuk, kategori, tarikh_tutup, status, dicipta").order("dicipta", { ascending: false });
  const senarai = (data as any[]) ?? [];
  const { data: minatData } = await db.from("tender_minat").select("tender_id");
  const kiraMinat: Record<string, number> = {};
  ((minatData as any[]) ?? []).forEach((m) => { kiraMinat[m.tender_id] = (kiraMinat[m.tender_id] || 0) + 1; });
  const hariIni = hariIniMY();

  return (
    <div className="space-y-6">
      <AdminNav aktif="/admin/tender" nama={profil.nama ?? profil.emel ?? undefined} peranan={profil.peranan} master={profil.master} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tender & Iklan</h1>
          <p className="mt-1 text-sm text-slate-600">Hebahkan tender/sebut harga. Kariah &amp; vendor boleh tengok, kongsi, muat turun &amp; nyata minat di <Link href="/tender" className="text-surau underline">/tender</Link>.</p>
        </div>
        <Link href="/admin/su" className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50">← Panel SU</Link>
      </div>

      <section className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-semibold text-slate-900">Tambah Tender Baru</h2>
        <TenderForm />
      </section>

      <section className="rounded-xl bg-white shadow-sm">
        <h2 className="border-b px-5 py-3 font-semibold text-slate-900">Senarai Tender ({senarai.length})</h2>
        <div className="divide-y">
          {senarai.length === 0 && <p className="px-5 py-6 text-center text-slate-400">Belum ada tender.</p>}
          {senarai.map((t) => {
            const tutup = tenderTutup(t, hariIni);
            return (
              <Link key={t.id} href={`/admin/tender/${t.id}`} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 hover:bg-slate-50">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-slate-900">{t.tajuk}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${clsStatusTender(tutup)}`}>{tutup ? "Ditutup" : "Aktif"}</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {t.kategori ? `${t.kategori} · ` : ""}{t.no_ruj ? `${t.no_ruj} · ` : ""}{t.tarikh_tutup ? `Tutup ${tarikhMs(t.tarikh_tutup)}` : "Tiada tarikh tutup"}
                  </div>
                </div>
                <span className="rounded-full bg-surau/10 px-2.5 py-0.5 text-xs font-semibold text-surau">{kiraMinat[t.id] || 0} minat</span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
