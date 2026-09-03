import Link from "next/link";
import { getProfil, bolehKewangan, isPentadbir, bolehLulusVendor, bolehKewanganModul } from "@/lib/sesi";
import { PerluMasuk, TiadaAkses } from "@/components/PerluMasuk";
import { createAdminClient, adminConfigured } from "@/lib/supabaseAdmin";
import AdminNav from "@/components/AdminNav";
import ButangHantar from "@/components/ButangHantar";
import { rm, tarikhMs } from "@/lib/format";
import { STATUS_TUNTUTAN, STATUS_PEMBEKAL } from "@/lib/pembekal";
import { tetapkanStatusPembekal, sahAjk, lulusBendahari, tolakTuntutan, sahAjkDalaman, janaBaucerDalaman, tolakTuntutanDalaman } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminTuntutanPage() {
  if (!adminConfigured) return <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Supabase belum dikonfigurasi.</div>;
  const profil = await getProfil();
  if (!profil) return <PerluMasuk />;
  if (!isPentadbir(profil) && !bolehKewangan(profil)) return <TiadaAkses />;

  const db = createAdminClient();
  const [pbRes, tuRes, katRes] = await Promise.all([
    db.from("pembekal").select("*").order("dicipta", { ascending: false }),
    db.from("tuntutan_bayaran").select("*, pembekal:pembekal(nama, jenis, bank, no_akaun, nama_akaun, telefon)").order("dicipta", { ascending: false }),
    db.from("kategori_belanja").select("id, nama").order("id"),
  ]);
  const pembekal = (pbRes.data as any[]) ?? [];
  const tuntutan = (tuRes.data as any[]) ?? [];
  const katBelanja = (katRes.data as any[]) ?? [];

  // Tuntutan Dalaman (AJK/staf)
  const { data: tdData } = await db.from("tuntutan_dalaman").select("*").order("dicipta", { ascending: false });
  const tuntutanDalaman = (tdData as any[]) ?? [];

  async function signed(path: string | null) {
    if (!path) return null;
    const rel = path.replace(/^salinan-kp\//, "");
    const { data } = await db.storage.from("salinan-kp").createSignedUrl(rel, 3600);
    return data?.signedUrl ?? null;
  }
  const dokMap: Record<string, string | null> = {};
  await Promise.all(tuntutan.filter((t) => t.url_dokumen).map(async (t) => { dokMap[t.id] = await signed(t.url_dokumen); }));
  const tdDokMap: Record<string, string | null> = {};
  await Promise.all(tuntutanDalaman.filter((t) => t.url_dokumen).map(async (t) => { tdDokMap[t.id] = await signed(t.url_dokumen); }));

  // Signed URL dokumen pembekal (untuk semakan AJK)
  const pbDok: Record<string, { depan?: string | null; belakang?: string | null; profil?: string | null; katalog?: string | null }> = {};
  await Promise.all(pembekal.map(async (p) => {
    pbDok[p.id] = {
      depan: await signed(p.url_kp_depan),
      belakang: await signed(p.url_kp_belakang),
      profil: await signed(p.url_profil_syarikat),
      katalog: await signed(p.url_katalog),
    };
  }));

  const pembekalMenunggu = pembekal.filter((p) => p.status === "menunggu");
  const boleh$ = bolehKewangan(profil);
  const bolehVendor = bolehLulusVendor(profil); // lulus pendaftaran vendor — Admin & Bendahari
  const bolehJanaDalaman = bolehKewanganModul(profil); // jana baucer tuntutan dalaman — Bendahari/Admin
  const tdMenunggu = tuntutanDalaman.filter((t) => t.status === "baru");

  return (
    <div className="space-y-6">
      <AdminNav aktif="/admin/tuntutan" nama={profil.nama ?? profil.emel ?? undefined} peranan={profil.peranan} master={profil.master} />
      <h1 className="text-2xl font-bold text-slate-900">Tuntutan Bayaran</h1>

      {/* Tuntutan Dalaman (AJK / Staf) */}
      <section className="rounded-xl bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-3">
          <h2 className="font-semibold text-slate-900">Tuntutan Dalaman (AJK / Staf)</h2>
          {tdMenunggu.length > 0 && <span className="rounded-lg bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">{tdMenunggu.length} menunggu</span>}
        </div>
        <div className="divide-y">
          {tuntutanDalaman.length === 0 && <p className="px-5 py-6 text-center text-slate-400">Tiada tuntutan dalaman.</p>}
          {tuntutanDalaman.map((t) => {
            const warna = t.status === "dibayar" ? "bg-green-100 text-green-700" : t.status === "diproses" ? "bg-blue-100 text-blue-700" : t.status === "disah_ajk" ? "bg-indigo-100 text-indigo-700" : t.status === "ditolak" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700";
            const label = t.status === "dibayar" ? "Dibayar" : t.status === "diproses" ? "Baucer dijana" : t.status === "disah_ajk" ? "Disah AJK · tunggu Bendahari" : t.status === "ditolak" ? "Ditolak" : "Menunggu semakan AJK";
            const tuntutanSendiri = t.profil_id && t.profil_id === profil.id;
            return (
              <div key={t.id} className="px-5 py-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs text-slate-400">{t.no_tuntutan}</span>
                    <div className="font-semibold text-slate-900">{t.butiran}</div>
                    <div className="text-xs text-slate-500">{t.nama_pemohon}{t.jawatan ? ` · ${t.jawatan}` : ""} · Hantar: {tarikhMs(t.dicipta)}{t.tarikh_bekal ? ` · Tarikh bekal: ${tarikhMs(t.tarikh_bekal)}` : ""}</div>
                    {(t.bank || t.no_akaun) && <div className="text-xs text-slate-500">Akaun: {t.bank || "-"} {t.no_akaun || ""}{t.nama_akaun ? ` (${t.nama_akaun})` : ""}</div>}
                    {t.sah_ajk_oleh && <div className="text-[11px] text-indigo-600">Disah AJK: {t.sah_ajk_oleh}</div>}
                    {t.url_dokumen && (tdDokMap[t.id]
                      ? <a href={tdDokMap[t.id]!} target="_blank" rel="noreferrer" className="text-xs font-semibold text-surau hover:underline">Lihat Resit</a>
                      : <span className="text-xs text-slate-400">Resit</span>)}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-surau">{rm(t.jumlah)}</div>
                    <span className={`rounded px-2 py-0.5 text-xs font-semibold ${warna}`}>{label}</span>
                  </div>
                </div>

                {/* Langkah 1 — AJK bertugas semak & sah */}
                {t.status === "baru" && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
                    {boleh$ && !tuntutanSendiri ? (
                      <>
                        <form action={sahAjkDalaman}>
                          <input type="hidden" name="id" value={t.id} />
                          <ButangHantar className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50" pendingText="…">✓ Semak & Sah (AJK)</ButangHantar>
                        </form>
                        <form action={tolakTuntutanDalaman}>
                          <input type="hidden" name="id" value={t.id} />
                          <ButangHantar className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 disabled:opacity-50" pendingText="…" konfirmasi="Tolak tuntutan ini?">Tolak</ButangHantar>
                        </form>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400">{tuntutanSendiri ? "Tuntutan anda sendiri — AJK lain perlu semak." : "Menunggu semakan AJK bertugas."}</span>
                    )}
                  </div>
                )}

                {/* Langkah 2 — Bendahari jana baucer (selepas disah AJK) */}
                {t.status === "disah_ajk" && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
                    {bolehJanaDalaman && !tuntutanSendiri ? (
                      <>
                        <form action={janaBaucerDalaman} className="flex flex-wrap items-center gap-2">
                          <input type="hidden" name="id" value={t.id} />
                          <select name="kategori_id" className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm">
                            <option value="">Kategori belanja…</option>
                            {katBelanja.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
                          </select>
                          <ButangHantar className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50" pendingText="…">Jana Baucer</ButangHantar>
                        </form>
                        <form action={tolakTuntutanDalaman}>
                          <input type="hidden" name="id" value={t.id} />
                          <ButangHantar className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 disabled:opacity-50" pendingText="…" konfirmasi="Tolak tuntutan ini?">Tolak</ButangHantar>
                        </form>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400">Disah AJK — menunggu Bendahari jana baucer.</span>
                    )}
                  </div>
                )}

                {t.status === "diproses" && <div className="mt-1 text-xs text-slate-500">Baucer dijana — tunggu kelulusan Pengerusi & bayaran di Kewangan.</div>}
                {t.status === "ditolak" && t.catatan && <div className="mt-1 text-xs text-red-500">Sebab: {t.catatan}</div>}
              </div>
            );
          })}
        </div>
      </section>

      {/* Pembekal menunggu kelulusan */}
      {pembekalMenunggu.length > 0 && bolehVendor && (
        <section className="rounded-xl bg-white shadow-sm">
          <h2 className="border-b px-5 py-3 font-semibold text-slate-900">Pembekal Baharu — Menunggu Kelulusan ({pembekalMenunggu.length})</h2>
          <div className="divide-y">
            {pembekalMenunggu.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <div className="text-sm">
                  <div className="font-medium text-slate-900">{p.nama}
                    <span className="ml-1 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{p.jenis}</span>
                    <span className="ml-1 rounded bg-surau/10 px-2 py-0.5 text-xs text-surau">{p.jenis_entiti === "syarikat" ? "Syarikat" : "Individu"}</span>
                  </div>
                  <div className="text-xs text-slate-500">{p.emel}{p.telefon ? ` · ${p.telefon}` : ""} · Bank: {p.bank} {p.no_akaun}{p.no_ssm ? ` · SSM: ${p.no_ssm}` : ""}</div>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs">
                    {pbDok[p.id]?.depan && <a href={pbDok[p.id].depan!} target="_blank" className="text-surau underline">IC Depan</a>}
                    {pbDok[p.id]?.belakang && <a href={pbDok[p.id].belakang!} target="_blank" className="text-surau underline">IC Belakang</a>}
                    {pbDok[p.id]?.profil && <a href={pbDok[p.id].profil!} target="_blank" className="text-surau underline">Profil Syarikat</a>}
                    {pbDok[p.id]?.katalog && <a href={pbDok[p.id].katalog!} target="_blank" className="text-surau underline">Katalog</a>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <form action={tetapkanStatusPembekal}><input type="hidden" name="id" value={p.id} /><input type="hidden" name="status" value="lulus" /><ButangHantar className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50" pendingText="…">Luluskan</ButangHantar></form>
                  <form action={tetapkanStatusPembekal}><input type="hidden" name="id" value={p.id} /><input type="hidden" name="status" value="tolak" /><ButangHantar className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 disabled:opacity-50" pendingText="…">Tolak</ButangHantar></form>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Senarai tuntutan */}
      <section className="space-y-4">
        {tuntutan.length === 0 && <p className="rounded-xl bg-white p-6 text-center text-slate-400 shadow-sm">Tiada tuntutan lagi.</p>}
        {tuntutan.map((t) => {
          const st = STATUS_TUNTUTAN[t.status] ?? STATUS_TUNTUTAN.baru;
          return (
            <div key={t.id} className="rounded-xl bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-400">{t.no_tuntutan}</span>
                    <span className={`rounded px-2 py-0.5 text-xs font-semibold ${st.warna}`}>{st.label}</span>
                  </div>
                  <div className="mt-1 font-semibold text-slate-900">{t.pembekal?.nama} <span className="text-xs font-normal text-slate-400">· {t.pembekal?.jenis}</span></div>
                  <div className="text-sm text-slate-600">{t.butiran}</div>
                  <div className="text-xs text-slate-500">Bank: {t.pembekal?.bank} · {t.pembekal?.no_akaun} · {t.pembekal?.nama_akaun}</div>
                  {t.sah_ajk_oleh && <div className="text-xs text-slate-400">Disah AJK: {t.sah_ajk_oleh} · {tarikhMs(t.tarikh_sah_ajk)}</div>}
                  {t.lulus_oleh && <div className="text-xs text-slate-400">Diluluskan: {t.lulus_oleh} · {tarikhMs(t.tarikh_lulus)}</div>}
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-surau">{rm(t.jumlah)}</div>
                  {dokMap[t.id] && <a href={dokMap[t.id]!} target="_blank" className="text-xs font-semibold text-surau hover:underline">Lihat Dokumen</a>}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
                {t.status === "baru" && boleh$ && (
                  <form action={sahAjk}><input type="hidden" name="id" value={t.id} /><ButangHantar className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50" pendingText="…">✓ Sahkan</ButangHantar></form>
                )}
                {t.status === "disah_ajk" && boleh$ && (
                  <form action={lulusBendahari} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="id" value={t.id} />
                    <select name="kategori_id" required defaultValue="" className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs">
                      <option value="" disabled>Pilih kategori belanja…</option>
                      {katBelanja.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
                    </select>
                    <ButangHantar className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50" pendingText="…">Jana Baucer</ButangHantar>
                  </form>
                )}
                {t.perbelanjaan_id && (
                  <Link href={`/admin/kewangan/baucer/${t.perbelanjaan_id}`} target="_blank" className="rounded-lg border border-surau/40 px-3 py-1.5 text-xs font-semibold text-surau hover:bg-surau/10">Baucer</Link>
                )}
                {t.status === "diluluskan" && (
                  <span className="text-xs text-amber-600">Baucer dijana — luluskan Pengerusi &amp; bayar di <Link href="/admin/kewangan" className="font-semibold underline">Kewangan</Link></span>
                )}
                {t.status === "dibayar" && <span className="text-xs font-semibold text-green-700">Selesai dibayar{t.rujukan_bayar ? ` · Ruj: ${t.rujukan_bayar}` : ""}</span>}
                {["baru", "disah_ajk"].includes(t.status) && (
                  <form action={tolakTuntutan} className="ml-auto"><input type="hidden" name="id" value={t.id} /><ButangHantar className="text-xs font-semibold text-red-600 hover:underline" pendingText="…">Tolak</ButangHantar></form>
                )}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
