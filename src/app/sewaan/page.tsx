import Link from "next/link";
import { supabase, supabaseConfigured } from "@/lib/supabaseClient";
import KalendarSewaan from "@/components/KalendarSewaan";
import SewaanForm from "@/components/SewaanForm";
import { NAMA_SURAU } from "@/lib/tetapan";
import { bayaranOnlineDibuka } from "@/lib/tetapanSistem";

export const dynamic = "force-dynamic";

export default async function SewaanPage() {
  let tempahan: any[] = [];
  if (supabaseConfigured) {
    const { data } = await supabase.from("v_sewaan_kalendar").select("*");
    tempahan = (data as any[]) ?? [];
  }
  const bayaranDibuka = await bayaranOnlineDibuka();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Permohonan Sewaan Ruang Surau</h1>
        <p className="mt-1 text-sm text-slate-600">
          {NAMA_SURAU} · Sila semak kalendar tempahan sebelum memohon. Permohonan diproses dalam 3–5 hari bekerja.
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Kalendar Tempahan</h2>
        <KalendarSewaan tempahan={tempahan} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Borang Permohonan</h2>
        <SewaanForm bayaranDibuka={bayaranDibuka} />
      </section>

      <p className="text-center">
        <Link href="/" className="text-sm text-slate-500 hover:underline">← Kembali ke laman utama</Link>
      </p>
    </div>
  );
}
