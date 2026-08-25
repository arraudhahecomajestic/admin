import Link from "next/link";
import { createAdminClient, adminConfigured } from "@/lib/supabaseAdmin";
import { tarikhMs } from "@/lib/format";
import AkadPenaja from "@/components/AkadPenaja";
import ButangCetakAkad from "@/components/ButangCetakAkad";

export const dynamic = "force-dynamic";

// Akad terisi automatik ikut rujukan bayaran penaja — boleh cetak / simpan PDF.
export default async function AkadTerisiPage({ params }: { params: { ref: string } }) {
  const ref = decodeURIComponent(params.ref);
  let butiran: any = { ref };

  if (adminConfigured) {
    const db = createAdminClient();
    const { data: b } = await db
      .from("bayaran").select("nama, jumlah, rujukan_id, tarikh_bayar, dicipta")
      .eq("no_rujukan", ref).eq("jenis", "penaja")
      .order("dicipta", { ascending: false }).limit(1).maybeSingle();
    const bb: any = b;
    if (bb) {
      butiran.syarikat = bb.nama;
      butiran.jumlah = Number(bb.jumlah || 0);
      const t = bb.tarikh_bayar || bb.dicipta;
      butiran.tarikh = t ? tarikhMs(String(t).slice(0, 10)) : "";
      if (bb.rujukan_id) {
        const { data: p } = await db.from("penaja").select("nama, pakej, tempoh_bulan").eq("id", bb.rujukan_id).maybeSingle();
        const pp: any = p;
        if (pp) {
          butiran.syarikat = pp.nama || butiran.syarikat;
          butiran.pakej = pp.pakej;
          butiran.tempoh = pp.tempoh_bulan;
        }
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="print-hide flex flex-wrap items-center justify-between gap-2">
        <Link href="/rakan" className="text-sm text-surau hover:underline">&larr; Direktori Rakan Surau</Link>
        <ButangCetakAkad />
      </div>
      <AkadPenaja butiran={butiran} />
    </div>
  );
}
