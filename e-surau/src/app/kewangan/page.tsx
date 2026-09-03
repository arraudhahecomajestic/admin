import Link from "next/link";
import { getProfil, isStaf } from "@/lib/sesi";
import { createAdminClient, adminConfigured } from "@/lib/supabaseAdmin";
import { kewanganAwamDibuka } from "@/lib/tetapanSistem";
import { NAMA_SURAU } from "@/lib/tetapan";
import KewanganCarta from "@/components/KewanganCarta";

export const dynamic = "force-dynamic";

type Baris = { nama: string; jumlah: number };

export default async function KewanganAwamPage() {
  if (!adminConfigured)
    return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-slate-500">Sistem belum dikonfigurasi.</div>;

  const [profil, awam] = await Promise.all([getProfil(), kewanganAwamDibuka()]);
  const staf = isStaf(profil);

  if (!awam && !staf) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-slate-900">Kewangan Surau</h1>
        <p className="mt-2 text-slate-500">Laporan kewangan belum diterbitkan buat masa ini. Sila semak semula kemudian.</p>
        <Link href="/" className="mt-4 inline-block text-sm text-surau hover:underline">&larr; Laman utama</Link>
      </div>
    );
  }

  const db = createAdminClient();
  const tahun = new Date().getFullYear();
  const [{ data: kut }, { data: bel }] = await Promise.all([
    db.from("kutipan").select("jumlah, tarikh, kategori:kategori_kutipan(nama, papar_awam)").gte("tarikh", `${tahun}-01-01`).lte("tarikh", `${tahun}-12-31`).limit(10000),
    db.from("perbelanjaan").select("jumlah, tarikh, kategori:kategori_belanja(nama)").eq("status", "dibayar").gte("tarikh", `${tahun}-01-01`).lte("tarikh", `${tahun}-12-31`).limit(10000),
  ]);

  const bulanM: Record<number, Record<string, number>> = {};
  const bulanK: Record<number, Record<string, number>> = {};
  const tahunMasuk: number[] = Array(12).fill(0);
  const tahunKeluar: number[] = Array(12).fill(0);

  for (const r of (kut as any[]) ?? []) {
    const kat = r.kategori;
    // Papar SEMUA kategori kutipan as-is — visibiliti umum dikawal oleh suis
    // global "Penyata Kewangan — Paparan Awam", bukan tapisan per-kategori.
    if (!kat) continue;
    const m = Number(String(r.tarikh).slice(5, 7)) - 1;
    if (m < 0 || m > 11) continue;
    const j = Number(r.jumlah || 0);
    if (!bulanM[m]) bulanM[m] = {};
    bulanM[m][kat.nama] = (bulanM[m][kat.nama] || 0) + j;
    tahunMasuk[m] += j;
  }
  for (const r of (bel as any[]) ?? []) {
    const nama = r.kategori?.nama || "Lain-lain";
    const m = Number(String(r.tarikh).slice(5, 7)) - 1;
    if (m < 0 || m > 11) continue;
    const j = Number(r.jumlah || 0);
    if (!bulanK[m]) bulanK[m] = {};
    bulanK[m][nama] = (bulanK[m][nama] || 0) + j;
    tahunKeluar[m] += j;
  }

  const bulanAda: number[] = [];
  for (let m = 0; m < 12; m++) if (tahunMasuk[m] > 0 || tahunKeluar[m] > 0) bulanAda.push(m);

  const toArr = (o?: Record<string, number>): Baris[] =>
    Object.entries(o || {}).map(([nama, jumlah]) => ({ nama, jumlah: Number(jumlah) })).sort((a, b) => b.jumlah - a.jumlah);

  const dataBulan: Record<number, { masuk: Baris[]; keluar: Baris[] }> = {};
  for (const m of bulanAda) dataBulan[m] = { masuk: toArr(bulanM[m]), keluar: toArr(bulanK[m]) };

  const adaData = bulanAda.length > 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {!adaData ? (
        <div className="rounded-xl bg-white p-10 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">Kewangan Surau {tahun}</h1>
          <p className="mt-2 text-slate-500">Tiada rekod kewangan untuk tahun ini lagi.</p>
          <Link href="/" className="mt-4 inline-block text-sm text-surau hover:underline">&larr; Laman utama</Link>
        </div>
      ) : (
        <KewanganCarta
          tahun={tahun}
          nama={NAMA_SURAU}
          bulanAda={bulanAda}
          dataBulan={dataBulan}
          tahunMasuk={tahunMasuk}
          tahunKeluar={tahunKeluar}
          pratonton={!awam && staf}
        />
      )}
    </div>
  );
}
