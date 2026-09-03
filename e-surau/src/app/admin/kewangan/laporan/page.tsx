import Link from "next/link";
import { getProfil, bolehKewangan } from "@/lib/sesi";
import { PerluMasuk, TiadaAkses } from "@/components/PerluMasuk";
import { createAdminClient, adminConfigured } from "@/lib/supabaseAdmin";
import AdminNav from "@/components/AdminNav";
import ButangCetak from "@/components/ButangCetak";
import { rm } from "@/lib/format";
import { NAMA_SURAU } from "@/lib/tetapan";

export const dynamic = "force-dynamic";

const BULAN = ["Jan", "Feb", "Mac", "Apr", "Mei", "Jun", "Jul", "Ogo", "Sep", "Okt", "Nov", "Dis"];

export default async function LaporanPage({ searchParams }: { searchParams: { tahun?: string } }) {
  if (!adminConfigured)
    return <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Supabase belum dikonfigurasi.</div>;
  const profil = await getProfil();
  if (!profil) return <PerluMasuk />;
  if (!bolehKewangan(profil)) return <TiadaAkses />;

  const tahunKini = new Date().getFullYear();
  const tahun = Number(searchParams.tahun) || tahunKini;
  const mula = `${tahun}-01-01`;
  const tamat = `${tahun}-12-31`;

  const db = createAdminClient();
  const [kutipanRes, belanjaRes] = await Promise.all([
    db.from("kutipan").select("jumlah, tarikh, kategori:kategori_kutipan(nama, jenis_khairat)").gte("tarikh", mula).lte("tarikh", tamat).limit(10000),
    db.from("perbelanjaan").select("jumlah, tarikh, dari_khairat, kategori:kategori_belanja(nama)").eq("status", "dibayar").gte("tarikh", mula).lte("tarikh", tamat).limit(10000),
  ]);
  const kutipan = (kutipanRes.data as any[]) ?? [];
  const belanja = (belanjaRes.data as any[]) ?? [];

  const n = (x: any) => Number(x || 0);
  const totalMasuk = kutipan.reduce((s, k) => s + n(k.jumlah), 0);
  const totalKeluar = belanja.reduce((s, b) => s + n(b.jumlah), 0);
  const masukKhairat = kutipan.filter((k) => k.kategori?.jenis_khairat).reduce((s, k) => s + n(k.jumlah), 0);
  const keluarKhairat = belanja.filter((b) => b.dari_khairat).reduce((s, b) => s + n(b.jumlah), 0);
  const masukAm = totalMasuk - masukKhairat;
  const keluarAm = totalKeluar - keluarKhairat;

  // Ikut kategori
  const ikutKategori = (arr: any[]) => {
    const m = new Map<string, number>();
    for (const x of arr) {
      const nama = x.kategori?.nama ?? "Lain-lain";
      m.set(nama, (m.get(nama) ?? 0) + n(x.jumlah));
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };
  const masukKat = ikutKategori(kutipan);
  const keluarKat = ikutKategori(belanja);

  // Ikut bulan
  const bulanan = BULAN.map((_, i) => {
    const bln = String(i + 1).padStart(2, "0");
    const pfx = `${tahun}-${bln}`;
    const masuk = kutipan.filter((k) => String(k.tarikh).startsWith(pfx)).reduce((s, k) => s + n(k.jumlah), 0);
    const keluar = belanja.filter((b) => String(b.tarikh).startsWith(pfx)).reduce((s, b) => s + n(b.jumlah), 0);
    return { masuk, keluar };
  });

  return (
    <div className="space-y-6">
      <div className="no-print">
        <AdminNav aktif="/admin/kewangan" nama={profil.nama ?? profil.emel ?? undefined} peranan={profil.peranan} master={profil.master} />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link href="/admin/kewangan" className="text-sm text-slate-500 hover:underline">← Kembali ke Kewangan</Link>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[tahunKini, tahunKini - 1, tahunKini - 2].map((t) => (
                <Link key={t} href={`/admin/kewangan/laporan?tahun=${t}`} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${t === tahun ? "bg-surau text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{t}</Link>
              ))}
            </div>
            <ButangCetak />
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-4 text-center">
          <h1 className="text-xl font-bold text-slate-900">Penyata Kewangan {tahun}</h1>
          <p className="text-sm text-slate-500">{NAMA_SURAU}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Jumlah Kutipan" nilai={rm(totalMasuk)} warna="text-green-600" />
          <Stat label="Jumlah Belanja" nilai={rm(totalKeluar)} warna="text-red-600" />
          <Stat label="Baki Tabung Am" nilai={rm(masukAm - keluarAm)} warna="text-surau" />
          <Stat label="Baki Tabung Khairat" nilai={rm(masukKhairat - keluarKhairat)} warna="text-teal-600" />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Jadual tajuk="Kutipan Ikut Kategori" data={masukKat} jumlah={totalMasuk} warna="text-green-700" />
          <Jadual tajuk="Perbelanjaan Ikut Kategori" data={keluarKat} jumlah={totalKeluar} warna="text-red-700" />
        </div>

        <div className="mt-6">
          <h2 className="mb-2 font-semibold text-slate-900">Ringkasan Bulanan</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr><th className="px-3 py-2">Bulan</th><th className="px-3 py-2 text-right">Kutipan</th><th className="px-3 py-2 text-right">Belanja</th><th className="px-3 py-2 text-right">Baki</th></tr>
              </thead>
              <tbody>
                {bulanan.map((b, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="px-3 py-1.5">{BULAN[i]}</td>
                    <td className="px-3 py-1.5 text-right text-green-700">{rm(b.masuk)}</td>
                    <td className="px-3 py-1.5 text-right text-red-600">{rm(b.keluar)}</td>
                    <td className="px-3 py-1.5 text-right font-medium">{rm(b.masuk - b.keluar)}</td>
                  </tr>
                ))}
                <tr className="border-t-2 font-bold">
                  <td className="px-3 py-2">JUMLAH</td>
                  <td className="px-3 py-2 text-right text-green-700">{rm(totalMasuk)}</td>
                  <td className="px-3 py-2 text-right text-red-600">{rm(totalKeluar)}</td>
                  <td className="px-3 py-2 text-right">{rm(totalMasuk - totalKeluar)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-8 text-sm text-slate-600">
          <div>Disediakan oleh: ____________________<div className="mt-1 text-xs">Bendahari</div></div>
          <div>Disemak oleh: ____________________<div className="mt-1 text-xs">Pengerusi / Setiausaha</div></div>
        </div>
      </div>

      <style>{`@media print { .no-print { display:none !important; } body { background:white !important; } }`}</style>
    </div>
  );
}

function Stat({ label, nilai, warna }: { label: string; nilai: string; warna: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className={`text-lg font-bold ${warna}`}>{nilai}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}

function Jadual({ tajuk, data, jumlah, warna }: { tajuk: string; data: [string, number][]; jumlah: number; warna: string }) {
  return (
    <div>
      <h2 className="mb-2 font-semibold text-slate-900">{tajuk}</h2>
      <table className="w-full text-left text-sm">
        <tbody>
          {data.length === 0 && <tr><td className="px-3 py-2 text-slate-400">Tiada rekod.</td></tr>}
          {data.map(([nama, jum]) => (
            <tr key={nama} className="border-b last:border-0">
              <td className="px-3 py-1.5">{nama}</td>
              <td className={`px-3 py-1.5 text-right font-medium ${warna}`}>{rm(jum)}</td>
            </tr>
          ))}
          {data.length > 0 && (
            <tr className="border-t-2 font-bold"><td className="px-3 py-2">Jumlah</td><td className="px-3 py-2 text-right">{rm(jumlah)}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
