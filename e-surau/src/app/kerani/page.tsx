import { getProfil, isKerani, isMaster } from "@/lib/sesi";
import { PerluMasuk, TiadaAkses } from "@/components/PerluMasuk";
import { adminConfigured, createAdminClient } from "@/lib/supabaseAdmin";
import KeraniCarian from "@/components/KeraniCarian";
import KeraniTambah from "@/components/KeraniTambah";
import StafPortal from "@/components/StafPortal";
import { hariIni } from "@/lib/staf";

export const dynamic = "force-dynamic";

export default async function KeraniPage() {
  if (!adminConfigured)
    return <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Supabase belum dikonfigurasi.</div>;
  const profil = await getProfil();
  if (!profil) return <PerluMasuk />;
  if (!(isKerani(profil) || isMaster(profil))) return <TiadaAkses />;

  const db = createAdminClient();
  const tarikh = hariIni();

  const [kehadiranRes, itemRes, logRes, tugasRes] = await Promise.all([
    db.from("staf_kehadiran").select("shift, masuk, keluar").eq("profil_id", profil.id).eq("tarikh", tarikh),
    db.from("staf_checklist_item").select("id, tajuk, shift, susunan").eq("aktif", true).order("susunan", { ascending: true }),
    db.from("staf_checklist_log").select("item_id").eq("tarikh", tarikh).eq("siap", true),
    db.from("staf_tugasan").select("id, tajuk, keterangan, tarikh_tugas").eq("status", "baru").order("tarikh_tugas", { ascending: false }),
  ]);

  const siapSet = new Set((logRes.data ?? []).map((r: any) => r.item_id));
  const checklist = (itemRes.data ?? []).map((it: any) => ({
    id: it.id, tajuk: it.tajuk, shift: it.shift, siap: siapSet.has(it.id),
  }));
  const kehadiran = (kehadiranRes.data ?? []) as { shift: string; masuk: string | null; keluar: string | null }[];
  const tugasan = (tugasRes.data ?? []) as { id: string; tajuk: string; keterangan: string | null; tarikh_tugas: string }[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Portal Staf Surau</h1>
          <p className="mt-1 text-sm text-slate-600">
            Kehadiran, tugas harian, tugasan khas, laporan &amp; log aktiviti.
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-500">
          {profil.nama && <span>👤 {profil.nama}</span>}
          <form action="/masuk/logout" method="post">
            <button className="hover:underline">Log keluar</button>
          </form>
        </div>
      </div>

      <StafPortal kehadiran={kehadiran} checklist={checklist} tugasan={tugasan} />

      <div className="border-t pt-6">
        <h2 className="mb-1 text-lg font-bold text-slate-900">Senarai Ahli Kariah</h2>
        <p className="mb-4 text-sm text-slate-600">
          Cari &amp; sahkan maklumat ahli untuk tally dengan borang hardcopy.
        </p>
        <KeraniTambah />
        <div className="mt-6">
          <KeraniCarian />
        </div>
      </div>
    </div>
  );
}
