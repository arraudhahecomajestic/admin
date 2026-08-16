import Link from "next/link";
import { getProfil, isAdmin, bolehNilaiStaf } from "@/lib/sesi";
import { PerluMasuk, TiadaAkses } from "@/components/PerluMasuk";
import { createAdminClient, adminConfigured } from "@/lib/supabaseAdmin";
import AdminNav from "@/components/AdminNav";
import ButangHantar from "@/components/ButangHantar";
import { tarikhMs } from "@/lib/format";
import { gredDari, KEPUTUSAN_LABEL } from "@/lib/penilaian";
import { sahkanPenilaian, padamPenilaian } from "./actions";

export const dynamic = "force-dynamic";

export default async function PenilaianStafPage() {
  if (!adminConfigured) return <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Supabase belum dikonfigurasi.</div>;
  const profil = await getProfil();
  if (!profil) return <PerluMasuk />;
  if (!bolehNilaiStaf(profil)) return <TiadaAkses />;
  const bolehSah = isAdmin(profil); // sahkan/padam: Admin/SU/Pengerusi sahaja

  const db = createAdminClient();
  const [{ data: stafData }, { data: penData }] = await Promise.all([
    db.from("staf_gaji_config").select("profil_id, nama, jawatan").order("nama"),
    db.from("staf_penilaian").select("*").order("dicipta", { ascending: false }),
  ]);
  const staf = (stafData as any[]) ?? [];
  const penilaian = (penData as any[]) ?? [];

  return (
    <div className="space-y-6">
      <AdminNav aktif="/admin/staf" nama={profil.nama ?? profil.emel ?? undefined} peranan={profil.peranan} master={profil.master} />
      <div>
        {bolehSah && <Link href="/admin/staf" className="text-sm text-slate-500 hover:underline">← Pengurusan Staf</Link>}
        <h1 className="text-2xl font-bold text-slate-900">Penilaian Prestasi Staf</h1>
        <p className="mt-1 text-sm text-slate-600">Nilai staf ikut KPI (offer letter). Kenaikan gaji perlu penilaian yang lulus & disahkan.</p>
      </div>

      {/* Mula penilaian baru */}
      <section className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-semibold text-slate-900">Penilaian Baru</h2>
        {staf.length === 0 ? (
          <p className="text-sm text-slate-400">Tiada staf. Sila daftar staf di modul Gaji dahulu.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {staf.map((s) => (
              <Link key={s.profil_id} href={`/admin/staf/penilaian/baru?staf=${s.profil_id}`}
                className="rounded-lg border border-surau/40 px-4 py-2 text-sm font-medium text-surau hover:bg-surau/10">
                Nilai: {s.nama ?? "—"}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Rekod penilaian */}
      <section className="rounded-xl bg-white shadow-sm">
        <h2 className="border-b px-5 py-3 font-semibold text-slate-900">Rekod Penilaian</h2>
        <div className="divide-y">
          {penilaian.length === 0 && <p className="px-5 py-6 text-center text-slate-400">Tiada penilaian lagi.</p>}
          {penilaian.map((r) => {
            const g = gredDari(Number(r.markah_akhir) || 0);
            return (
              <div key={r.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-900">{r.nama}</span>
                    <span className={`rounded px-2 py-0.5 text-xs font-bold ${g.cls}`}>{Number(r.markah_akhir).toFixed(1)}% · {r.gred}</span>
                    {r.status === "disahkan"
                      ? <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">Disahkan</span>
                      : <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">Menunggu Pengesahan</span>}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {r.tempoh ? `${r.tempoh} · ` : ""}{r.keputusan ? KEPUTUSAN_LABEL[r.keputusan] ?? r.keputusan : "—"}
                    {r.gaji_cadangan ? ` · Cadang gaji RM${Number(r.gaji_cadangan).toFixed(0)}` : ""}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-400">
                    Dinilai oleh {r.penyelia_nama ?? "—"} · {tarikhMs(r.tarikh_penilaian || r.dicipta)}
                    {r.disahkan_oleh ? ` · Disahkan: ${r.disahkan_oleh}` : ""}
                  </div>
                  {(r.kekuatan || r.penambahbaikan) && (
                    <div className="mt-1 text-xs text-slate-600">
                      {r.kekuatan && <div><b>Kekuatan:</b> {r.kekuatan}</div>}
                      {r.penambahbaikan && <div><b>Penambahbaikan:</b> {r.penambahbaikan}</div>}
                    </div>
                  )}
                </div>
                {bolehSah && (
                  <div className="flex items-center gap-2">
                    {r.status !== "disahkan" && (
                      <form action={sahkanPenilaian}>
                        <input type="hidden" name="id" value={r.id} />
                        <ButangHantar className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50" pendingText="…">Sahkan (Pengerusi)</ButangHantar>
                      </form>
                    )}
                    <form action={padamPenilaian}>
                      <input type="hidden" name="id" value={r.id} />
                      <ButangHantar className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-red-600 disabled:opacity-50" pendingText="…">Padam</ButangHantar>
                    </form>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
