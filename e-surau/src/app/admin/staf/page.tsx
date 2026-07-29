import { getProfil, isPentadbir, isMaster } from "@/lib/sesi";
import { PerluMasuk, TiadaAkses } from "@/components/PerluMasuk";
import { createAdminClient, adminConfigured } from "@/lib/supabaseAdmin";
import AdminNav from "@/components/AdminNav";
import AdminStafPanel from "@/components/AdminStafPanel";
import { hariIni } from "@/lib/staf";

export const dynamic = "force-dynamic";

export default async function AdminStafPage() {
  if (!adminConfigured)
    return <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Supabase belum dikonfigurasi.</div>;
  const profil = await getProfil();
  if (!profil) return <PerluMasuk />;
  if (!(isPentadbir(profil) || isMaster(profil))) return <TiadaAkses />;

  const db = createAdminClient();
  const tarikh = hariIni();

  const [kehadiranRes, tugasRes, laporanRes, itemRes, logRes] = await Promise.all([
    db.from("staf_kehadiran").select("nama, shift, masuk, keluar").eq("tarikh", tarikh).order("masuk", { ascending: true }),
    db.from("staf_tugasan").select("id, tajuk, keterangan, status, tarikh_tugas, tarikh_siap, nota_siap").neq("status", "batal").order("tarikh_tugas", { ascending: false }).limit(50),
    db.from("staf_laporan").select("id, tajuk, keterangan, url_gambar, status, oleh, tindakan, tarikh").order("tarikh", { ascending: false }).limit(50),
    db.from("staf_checklist_item").select("id, tajuk, shift, aktif").order("susunan", { ascending: true }),
    db.from("staf_log").select("id, nama, shift, catatan, dicipta").order("dicipta", { ascending: false }).limit(30),
  ]);

  const kehadiran = (kehadiranRes.data ?? []) as any[];
  const tugasan = (tugasRes.data ?? []) as any[];
  const laporan = (laporanRes.data ?? []) as any[];
  const checklist = (itemRes.data ?? []) as any[];
  const log = (logRes.data ?? []) as any[];

  return (
    <div className="space-y-6">
      <AdminNav aktif="/admin/staf" nama={profil.nama ?? profil.emel ?? undefined} peranan={profil.peranan} master={profil.master} />
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pengurusan Staf Surau</h1>
        <p className="mt-1 text-sm text-slate-600">Pantau kehadiran, beri tugasan, uruskan laporan &amp; templat tugas harian Penolong Pengurus Surau.</p>
      </div>
      <AdminStafPanel kehadiran={kehadiran} tugasan={tugasan} laporan={laporan} checklist={checklist} log={log} />
    </div>
  );
}
