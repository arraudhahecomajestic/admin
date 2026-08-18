import Link from "next/link";
import { getProfil, isPentadbir } from "@/lib/sesi";
import { PerluMasuk, TiadaAkses } from "@/components/PerluMasuk";
import { createAdminClient, adminConfigured } from "@/lib/supabaseAdmin";
import { NAMA_SURAU, ALAMAT_SURAU, LOGO_SURAU } from "@/lib/tetapan";
import { tarikhMs } from "@/lib/format";
import ButangCetak from "@/components/ButangCetak";

export const dynamic = "force-dynamic";

export default async function SenaraiPesertaCetak({ params }: { params: { id: string } }) {
  if (!adminConfigured) return <div className="p-4 text-sm">Supabase belum dikonfigurasi.</div>;
  const profil = await getProfil();
  if (!profil) return <PerluMasuk />;
  if (!isPentadbir(profil)) return <TiadaAkses />;

  const db = createAdminClient();
  const { data } = await db.from("program").select("*").eq("id", params.id).single();
  if (!data) return <p className="p-4 text-slate-500">Program tidak dijumpai.</p>;
  const p: any = data;

  let rows: any[] = [];
  if (p.berbayar) {
    const { data: d } = await db.from("program_pendaftaran").select("*").eq("program_id", params.id).order("dicipta", { ascending: true });
    rows = ((d as any[]) ?? []).filter((r) => r.status_bayar !== "tolak");
  } else {
    const { data: d } = await db.from("rsvp").select("nama, telefon, bil_orang, dicipta").eq("program_id", params.id).order("dicipta", { ascending: true });
    rows = (d as any[]) ?? [];
  }
  const jumlah = p.berbayar
    ? rows.reduce((s, r) => s + Number(r.bilangan || 1), 0)
    : rows.reduce((s, r) => s + Number(r.bil_orang || 0), 0);

  return (
    <div className="mx-auto max-w-4xl bg-white p-8 print:p-0">
      <div className="print-hide mb-4 flex items-center justify-between">
        <Link href={`/admin/program/${p.id}`} className="text-sm text-surau hover:underline">← Kembali</Link>
        <ButangCetak label="Cetak / Simpan PDF" />
      </div>

      <div className="flex items-center gap-3 border-b pb-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LOGO_SURAU} alt={NAMA_SURAU} className="h-12 w-auto" />
        <div className="text-xs text-slate-600">
          <div className="text-sm font-bold text-slate-900">{NAMA_SURAU}</div>
          <div>{ALAMAT_SURAU}</div>
        </div>
      </div>

      <h1 className="mt-5 text-center text-lg font-bold uppercase text-slate-900">Senarai Peserta</h1>
      <div className="mx-auto mt-1 text-center text-base font-semibold text-slate-800">{p.tajuk}</div>
      <div className="mt-1 text-center text-sm text-slate-600">
        {tarikhMs(p.tarikh)}{p.masa ? ` · ${p.masa}` : ""}{p.lokasi ? ` · ${p.lokasi}` : ""}
      </div>
      <div className="mt-1 text-center text-sm text-slate-600">
        Jumlah: <b>{rows.length}</b> {p.berbayar ? "pendaftaran" : "borang"} · <b>{jumlah}</b> orang{p.had_peserta ? ` (had ${p.had_peserta})` : ""}
      </div>

      <table className="mt-5 w-full border-collapse text-sm">
        <thead>
          <tr className="border-y bg-slate-50 text-left text-xs uppercase text-slate-500">
            <th className="border px-2 py-1.5 text-center">Bil</th>
            {p.berbayar ? (
              <>
                <th className="border px-2 py-1.5">Nama Anak / Peserta</th>
                <th className="border px-2 py-1.5 text-center">Bil</th>
                <th className="border px-2 py-1.5">Ibu Bapa / Penjaga</th>
                <th className="border px-2 py-1.5">Telefon</th>
                <th className="border px-2 py-1.5">Kesihatan</th>
                <th className="border px-2 py-1.5 text-center">Status</th>
                <th className="border px-2 py-1.5 text-center">Hadir</th>
              </>
            ) : (
              <>
                <th className="border px-2 py-1.5">Nama</th>
                <th className="border px-2 py-1.5">Telefon</th>
                <th className="border px-2 py-1.5 text-center">Bil. Orang</th>
                <th className="border px-2 py-1.5 text-center">Hadir</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={p.berbayar ? 8 : 5} className="border px-2 py-6 text-center text-slate-400">Tiada peserta.</td></tr>}
          {rows.map((r, i) => {
            if (p.berbayar) {
              const anak = (r.senarai_anak || r.nama_peserta || "").split("\n").map((x: string) => x.trim()).filter(Boolean);
              const status = r.status_bayar === "dibayar" ? "Sah" : r.status_bayar === "menunggu_sah" ? "Tunggu" : r.status_bayar === "percuma" ? "Percuma" : r.status_bayar || "";
              return (
                <tr key={r.id} className="align-top">
                  <td className="border px-2 py-1.5 text-center text-slate-500">{i + 1}</td>
                  <td className="border px-2 py-1.5">{anak.length ? anak.join(", ") : "—"}</td>
                  <td className="border px-2 py-1.5 text-center">{r.bilangan || 1}</td>
                  <td className="border px-2 py-1.5">{r.nama_penjaga || "—"}</td>
                  <td className="border px-2 py-1.5">{r.telefon_penjaga || "—"}</td>
                  <td className="border px-2 py-1.5 text-xs">{r.maklumat_kesihatan || "—"}</td>
                  <td className="border px-2 py-1.5 text-center text-xs">{status}</td>
                  <td className="border px-2 py-1.5 text-center text-slate-300">☐</td>
                </tr>
              );
            }
            return (
              <tr key={i}>
                <td className="border px-2 py-1.5 text-center text-slate-500">{i + 1}</td>
                <td className="border px-2 py-1.5">{r.nama}</td>
                <td className="border px-2 py-1.5">{r.telefon || "—"}</td>
                <td className="border px-2 py-1.5 text-center">{r.bil_orang}</td>
                <td className="border px-2 py-1.5 text-center text-slate-300">☐</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="mt-8 grid grid-cols-2 gap-8 text-sm print:mt-12">
        <div><div className="h-10 border-b border-slate-400" /><div className="mt-1 text-slate-600">Disediakan oleh (Urus Setia)</div></div>
        <div><div className="h-10 border-b border-slate-400" /><div className="mt-1 text-slate-600">Disemak oleh</div></div>
      </div>
    </div>
  );
}
