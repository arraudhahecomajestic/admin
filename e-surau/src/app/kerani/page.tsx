import { getProfil, isKerani, isMaster } from "@/lib/sesi";
import { PerluMasuk, TiadaAkses } from "@/components/PerluMasuk";
import { adminConfigured, createAdminClient } from "@/lib/supabaseAdmin";
import KeraniCarian from "@/components/KeraniCarian";
import KeraniTambah from "@/components/KeraniTambah";
import StafPortal from "@/components/StafPortal";
import { hariIni } from "@/lib/staf";
import { labelJenisDok, clsJenisDok } from "@/lib/dokumen";

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

  const { data: jadualData } = await db
    .from("staf_jadual").select("id, tarikh, shift, catatan").gte("tarikh", tarikh).order("tarikh", { ascending: true }).limit(14);
  const jadual = (jadualData as any[]) ?? [];
  const { data: wiData } = await db.from("staf_wi").select("tajuk, kandungan").eq("aktif", true).order("susunan", { ascending: true });
  const wi = (wiData as any[]) ?? [];

  // Dokumen Saya — surat tawaran, WI, penilaian, slip gaji dll milik staf ini.
  const { data: dokData } = await db
    .from("staf_dokumen")
    .select("id, jenis, tajuk, nama_fail, tarikh_dokumen, catatan, url_fail")
    .eq("profil_id", profil.id)
    .order("dicipta", { ascending: false });
  const dokumen = await Promise.all(((dokData as any[]) ?? []).map(async (d) => {
    let signedUrl: string | null = null;
    if (d.url_fail) {
      const rel = String(d.url_fail).replace(/^salinan-kp\//, "");
      const { data } = await db.storage.from("salinan-kp").createSignedUrl(rel, 3600);
      signedUrl = data?.signedUrl ?? null;
    }
    return { ...d, signedUrl };
  }));
  const HARI = ["Ahad", "Isnin", "Selasa", "Rabu", "Khamis", "Jumaat", "Sabtu"];
  const lblShift: Record<string, string> = { pagi: "Pagi (8:00–5:00)", petang: "Petang (2:00–10:00)", rehat: "Rehat", cuti: "Cuti" };
  const clsShift: Record<string, string> = { pagi: "bg-amber-100 text-amber-700", petang: "bg-indigo-100 text-indigo-700", rehat: "bg-slate-100 text-slate-600", cuti: "bg-red-100 text-red-700" };

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
          <a href="/admin/tuntutan-saya" className="rounded-lg border border-surau/40 px-3 py-1 font-medium text-surau hover:bg-surau/10">Tuntutan Saya</a>
          {profil.nama && <span>{profil.nama}</span>}
          <form action="/masuk/logout" method="post">
            <button className="hover:underline">Log keluar</button>
          </form>
        </div>
      </div>

      {jadual.length > 0 && (
        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-semibold text-slate-900">Jadual Kerja Anda</h2>
          <div className="divide-y">
            {jadual.map((j) => {
              const d = new Date(j.tarikh + "T00:00:00");
              return (
                <div key={j.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <div className="text-sm text-slate-700">
                    <span className="font-medium">{HARI[d.getDay()]}, {d.getDate()}/{d.getMonth() + 1}/{d.getFullYear()}</span>
                    {j.catatan && <span className="ml-2 text-xs text-slate-500">— {j.catatan}</span>}
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${clsShift[j.shift] ?? "bg-slate-100 text-slate-600"}`}>{lblShift[j.shift] ?? j.shift}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {wi.length > 0 && (
        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-2 font-semibold text-slate-900">Arahan Kerja (WI)</h2>
          <p className="mb-3 text-xs text-slate-500">Rujukan tugas & piawaian kerja anda. Ketik setiap tajuk untuk baca.</p>
          <div className="space-y-2">
            {wi.map((s, i) => (
              <details key={i} className="rounded-lg border border-slate-200">
                <summary className="cursor-pointer px-4 py-2.5 text-sm font-semibold text-slate-800">{s.tajuk}</summary>
                <div className="whitespace-pre-line border-t px-4 py-3 text-sm text-slate-600">{s.kandungan}</div>
              </details>
            ))}
          </div>
        </section>
      )}

      {dokumen.length > 0 && (
        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-2 font-semibold text-slate-900">Dokumen Saya</h2>
          <p className="mb-3 text-xs text-slate-500">Surat tawaran, WI, penilaian prestasi, slip gaji &amp; dokumen rasmi anda.</p>
          <div className="divide-y">
            {dokumen.map((d) => (
              <div key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded px-2 py-0.5 text-xs font-semibold ${clsJenisDok(d.jenis)}`}>{labelJenisDok(d.jenis)}</span>
                    <span className="text-sm font-medium text-slate-800">{d.tajuk}</span>
                  </div>
                  {(d.tarikh_dokumen || d.catatan) && (
                    <div className="mt-0.5 text-xs text-slate-500">
                      {d.tarikh_dokumen ? `${d.tarikh_dokumen}` : ""}{d.tarikh_dokumen && d.catatan ? " · " : ""}{d.catatan ?? ""}
                    </div>
                  )}
                </div>
                {d.signedUrl && (
                  <a href={d.signedUrl} target="_blank" rel="noreferrer" className="shrink-0 text-sm font-medium text-surau hover:underline">Lihat →</a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

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
