import Link from "next/link";
import { getProfil, isPentadbir } from "@/lib/sesi";
import { PerluMasuk, TiadaAkses } from "@/components/PerluMasuk";
import { createAdminClient, adminConfigured } from "@/lib/supabaseAdmin";
import AdminNav from "@/components/AdminNav";
import { rm, tarikhMs } from "@/lib/format";
import TuntutanForm, { type KeahlianRingkas } from "@/components/TuntutanForm";
import TanggunganKhairatPanel from "@/components/TanggunganKhairatPanel";
import ButangHantar from "@/components/ButangHantar";
import { bayarYuran, tukarStatusTuntutan } from "./actions";

export const dynamic = "force-dynamic";

const TAHUN = new Date().getFullYear();

export default async function KhairatPage({
  searchParams,
}: {
  searchParams: { ok?: string; ralat?: string };
}) {
  if (!adminConfigured)
    return <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Supabase belum dikonfigurasi.</div>;
  const profil = await getProfil();
  if (!profil) return <PerluMasuk />;
  if (!isPentadbir(profil)) return <TiadaAkses />;

  const db = createAdminClient();
  const [keahlianRes, yuranRes, tggRes, tuntutanRes, tggKhRes] = await Promise.all([
    db.from("keahlian_khairat").select("id, no_khairat, status, tarikh_sertai, ahli:ahli_kariah(id, nama, no_ahli)").order("no_khairat"),
    db.from("yuran_khairat").select("keahlian_id, tahun, lunas"),
    db.from("tanggungan").select("id, ahli_id, nama, dilindungi_khairat"),
    db.from("tuntutan_khairat").select("id, no_tuntutan, nama_si_mati, jenis_si_mati, tarikh_kematian, jumlah_pampasan, status, nama_waris, keahlian:keahlian_khairat(no_khairat, ahli:ahli_kariah(nama))").order("dicipta", { ascending: false }),
    db.from("tanggungan").select("nama, hubungan, no_kp, dilindungi_khairat, ahli:ahli_kariah(id, nama, no_ahli, telefon)").eq("dilindungi_khairat", true),
  ]);

  const keahlian = (keahlianRes.data ?? []) as any[];
  const yuran = (yuranRes.data ?? []) as any[];
  const tanggungan = (tggRes.data ?? []) as any[];
  const tuntutan = (tuntutanRes.data ?? []) as any[];

  // Kumpul tanggungan khairat ikut ahli
  const petaKh = new Map<string, { ahli_id: string; nama: string; no_ahli: string | null; telefon: string | null; tanggungan: { nama: string; hubungan: string | null; no_kp: string | null }[] }>();
  for (const t of (tggKhRes.data ?? []) as any[]) {
    const a = t.ahli;
    if (!a?.id) continue;
    if (!petaKh.has(a.id)) petaKh.set(a.id, { ahli_id: a.id, nama: a.nama, no_ahli: a.no_ahli, telefon: a.telefon, tanggungan: [] });
    petaKh.get(a.id)!.tanggungan.push({ nama: t.nama, hubungan: t.hubungan, no_kp: t.no_kp });
  }
  const senaraiKhairat = Array.from(petaKh.values()).sort((a, b) => (a.nama || "").localeCompare(b.nama || ""));

  const bayarTahunIni = (kid: string) =>
    yuran.some((y) => y.keahlian_id === kid && y.tahun === TAHUN && y.lunas);

  const senaraiForm: KeahlianRingkas[] = keahlian.map((k) => ({
    keahlian_id: k.id,
    nama_ahli: k.ahli?.nama ?? "-",
    no_khairat: k.no_khairat,
    status: k.status,
    ahli_id: k.ahli?.id ?? "",
    tanggungan: tanggungan
      .filter((t) => t.ahli_id === k.ahli?.id)
      .map((t) => ({ id: t.id, nama: t.nama, dilindungi_khairat: t.dilindungi_khairat })),
  }));

  const stat = {
    aktif: keahlian.filter((k) => k.status === "aktif").length,
    tertunggak: keahlian.filter((k) => k.status !== "aktif").length,
    tuntutanMenunggu: tuntutan.filter((t) => t.status === "menunggu").length,
    pampasan: tuntutan.filter((t) => t.status === "dibayar").reduce((s, t) => s + Number(t.jumlah_pampasan || 0), 0),
  };

  return (
    <div className="space-y-6">
      <AdminNav aktif="/admin/khairat" nama={profil.nama ?? profil.emel ?? undefined} peranan={profil.peranan} master={profil.master} />
      <h1 className="text-2xl font-bold text-slate-900">Khairat Kematian</h1>

      {searchParams.ok === "tuntutan" && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">✓ Tuntutan berjaya direkod.</div>
      )}
      {searchParams.ralat === "tak_layak" && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">⚠️ Tuntutan tidak dapat direkod — keahlian tertunggak yuran tahun {TAHUN}.</div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label={`Ahli Aktif (${TAHUN})`} nilai={String(stat.aktif)} warna="text-green-600" />
        <Stat label="Tertunggak Yuran" nilai={String(stat.tertunggak)} warna="text-amber-600" />
        <Stat label="Tuntutan Menunggu" nilai={String(stat.tuntutanMenunggu)} warna="text-red-600" />
        <Stat label="Pampasan Dibayar" nilai={rm(stat.pampasan)} warna="text-surau" />
      </div>

      {/* Kariah yang daftar tanggungan khairat */}
      <TanggunganKhairatPanel data={senaraiKhairat} />

      {/* Senarai ahli khairat + kutip yuran */}
      <section className="rounded-xl bg-white shadow-sm">
        <h2 className="border-b px-5 py-3 font-semibold text-slate-900">Ahli Khairat & Yuran {TAHUN}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">No. Khairat</th>
                <th className="px-4 py-2">Nama</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Yuran {TAHUN}</th>
                <th className="px-4 py-2">Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {keahlian.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">Belum ada ahli khairat.</td></tr>
              )}
              {keahlian.map((k) => {
                const lunas = bayarTahunIni(k.id);
                return (
                  <tr key={k.id} className="border-b last:border-0">
                    <td className="px-4 py-2 font-mono text-xs">{k.no_khairat}</td>
                    <td className="px-4 py-2">{k.ahli?.nama}</td>
                    <td className="px-4 py-2">
                      <span className={`rounded px-2 py-0.5 text-xs font-semibold ${k.status === "aktif" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{k.status}</span>
                    </td>
                    <td className="px-4 py-2">{lunas ? <span className="text-green-600">Selesai</span> : <span className="text-red-600">Belum</span>}</td>
                    <td className="px-4 py-2">
                      {lunas ? (
                        <span className="text-xs text-slate-400">—</span>
                      ) : (
                        <form action={bayarYuran.bind(null, k.id, k.ahli?.id ?? null)} className="flex items-center gap-2">
                          <input type="hidden" name="tahun" value={TAHUN} />
                          <select name="kaedah" className="rounded border border-slate-300 px-1.5 py-1 text-xs">
                            <option value="tunai">Tunai</option>
                            <option value="online">Online</option>
                          </select>
                          <ButangHantar className="rounded bg-surau px-2.5 py-1 text-xs font-semibold text-white hover:bg-surau-dark disabled:opacity-50" pendingText="…">
                            Kutip RM60
                          </ButangHantar>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Buat tuntutan */}
      <section className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-semibold text-slate-900">Rekod Tuntutan Kematian</h2>
        <div className="max-w-md">
          <TuntutanForm senarai={senaraiForm} />
        </div>
      </section>

      {/* Senarai tuntutan */}
      <section className="rounded-xl bg-white shadow-sm">
        <h2 className="border-b px-5 py-3 font-semibold text-slate-900">Senarai Tuntutan</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">No.</th>
                <th className="px-4 py-2">Si Mati</th>
                <th className="px-4 py-2">Keahlian</th>
                <th className="px-4 py-2">Tarikh</th>
                <th className="px-4 py-2 text-right">Pampasan</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {tuntutan.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400">Tiada tuntutan.</td></tr>
              )}
              {tuntutan.map((t) => (
                <tr key={t.id} className="border-b last:border-0">
                  <td className="px-4 py-2 font-mono text-xs">{t.no_tuntutan}</td>
                  <td className="px-4 py-2">
                    <div>{t.nama_si_mati}</div>
                    <div className="text-xs text-slate-400">{t.jenis_si_mati}</div>
                  </td>
                  <td className="px-4 py-2 text-xs">{t.keahlian?.no_khairat}<br />{t.keahlian?.ahli?.nama}</td>
                  <td className="px-4 py-2">{tarikhMs(t.tarikh_kematian)}</td>
                  <td className="px-4 py-2 text-right font-medium">{rm(t.jumlah_pampasan)}</td>
                  <td className="px-4 py-2">
                    <span className={`rounded px-2 py-0.5 text-xs font-semibold ${badgeTuntutan(t.status)}`}>{t.status}</span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-1">
                      {t.status === "menunggu" && (
                        <>
                          <Btn id={t.id} status="lulus" label="Lulus" warna="bg-blue-600" />
                          <Btn id={t.id} status="tolak" label="Tolak" warna="bg-red-500" />
                        </>
                      )}
                      {t.status === "lulus" && (
                        <Btn id={t.id} status="dibayar" label="Tanda Dibayar" warna="bg-green-600" />
                      )}
                      {(t.status === "dibayar" || t.status === "tolak") && (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Btn({ id, status, label, warna }: { id: string; status: "lulus" | "dibayar" | "tolak"; label: string; warna: string }) {
  return (
    <form action={tukarStatusTuntutan.bind(null, id, status)}>
      <ButangHantar className={`rounded px-2 py-1 text-xs font-semibold text-white ${warna} disabled:opacity-50`} pendingText="…">{label}</ButangHantar>
    </form>
  );
}

function badgeTuntutan(s: string) {
  return {
    menunggu: "bg-amber-100 text-amber-700",
    lulus: "bg-blue-100 text-blue-700",
    dibayar: "bg-green-100 text-green-700",
    tolak: "bg-red-100 text-red-700",
  }[s] ?? "bg-slate-100 text-slate-600";
}

function Stat({ label, nilai, warna }: { label: string; nilai: string; warna: string }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className={`text-xl font-bold ${warna}`}>{nilai}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}
