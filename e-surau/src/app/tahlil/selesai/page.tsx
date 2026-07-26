import Link from "next/link";
import { createAdminClient, adminConfigured } from "@/lib/supabaseAdmin";
import { laksanakanBayaran } from "@/lib/bayaran";
import { rm } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function TahlilSelesaiPage({ searchParams }: { searchParams: { ref?: string; gagal?: string } }) {
  const ref = searchParams?.ref || "";
  const gagal = searchParams?.gagal === "1";

  let status: "dibayar" | "menunggu" | "gagal" = gagal ? "gagal" : "menunggu";
  let jumlah = 0;

  if (adminConfigured && ref) {
    const db = createAdminClient();
    const { data } = await db
      .from("bayaran")
      .select("*")
      .eq("no_rujukan", ref)
      .order("dicipta", { ascending: false })
      .limit(1)
      .maybeSingle();
    const b: any = data;
    if (b) {
      jumlah = Number(b.jumlah || 0);
      status = b.status;
      if (b.status === "menunggu" && b.chip_id) {
        try {
          const r = await laksanakanBayaran(b.chip_id);
          if (r.dibayar) status = "dibayar";
        } catch { /* biar status sedia ada */ }
      }
    }
  }

  const ikon = status === "dibayar" ? "✓" : status === "gagal" ? "✕" : "⏳";
  const warna = status === "dibayar" ? "bg-green-100 text-green-700" : status === "gagal" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700";
  const tajuk = status === "dibayar" ? "Sumbangan Diterima" : status === "gagal" ? "Pembayaran Tidak Berjaya" : "Pembayaran Sedang Diproses";
  const mesej =
    status === "dibayar"
      ? `Jazakumullah khairan. Sumbangan${jumlah ? ` sebanyak ${rm(jumlah)}` : ""} telah diterima. Semoga Allah membalas dengan kebaikan.`
      : status === "gagal"
      ? "Pembayaran tidak berjaya atau dibatalkan. Anda boleh cuba semula."
      : "Pembayaran anda sedang disahkan. Jika anda telah membayar, status akan dikemas kini sebentar lagi.";

  return (
    <div className="mx-auto max-w-lg rounded-xl bg-white p-8 text-center shadow-sm">
      <div className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full text-2xl ${warna}`}>{ikon}</div>
      <h1 className="text-xl font-bold text-slate-900">{tajuk}</h1>
      <p className="mt-2 text-slate-600">{mesej}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/tahlil" className="rounded-lg bg-surau px-5 py-2.5 text-sm font-semibold text-white hover:bg-surau-dark">Kembali ke Tahlil</Link>
        <Link href="/" className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Laman Utama</Link>
      </div>
    </div>
  );
}
