import Link from "next/link";
import { createAdminClient, adminConfigured } from "@/lib/supabaseAdmin";
import { statusPurchase } from "@/lib/chip";
import { rm } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function SewaanSelesaiPage({ searchParams }: { searchParams: { ref?: string; gagal?: string } }) {
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
      // Jika masih menunggu, sahkan terus dari CHIP (webhook mungkin lambat)
      if (b.status === "menunggu" && b.chip_id) {
        try {
          const p = await statusPurchase(b.chip_id);
          if (p?.status === "paid") {
            status = "dibayar";
            await db.from("bayaran").update({ status: "dibayar", tarikh_bayar: new Date().toISOString() }).eq("id", b.id);
            if (b.rujukan_id) await db.from("sewaan").update({ kaedah_bayar: "Online (CHIP)" }).eq("id", b.rujukan_id);
          } else if (p?.status && p.status !== "created" && p.status !== "pending_execute") {
            status = "gagal";
          }
        } catch { /* biar status sedia ada */ }
      }
    }
  }

  const ikon = status === "dibayar" ? "✓" : status === "gagal" ? "✕" : "⏳";
  const warna = status === "dibayar" ? "bg-green-100 text-green-700" : status === "gagal" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700";
  const tajuk = status === "dibayar" ? "Pembayaran Berjaya" : status === "gagal" ? "Pembayaran Tidak Berjaya" : "Pembayaran Sedang Diproses";
  const mesej =
    status === "dibayar"
      ? `Terima kasih. Pembayaran sewaan${jumlah ? ` sebanyak ${rm(jumlah)}` : ""} telah diterima. AJK Surau akan memproses permohonan anda.`
      : status === "gagal"
      ? "Pembayaran tidak berjaya atau dibatalkan. Anda boleh cuba semula atau pilih bayaran tunai di pejabat surau."
      : "Pembayaran anda sedang disahkan. Jika anda telah membayar, status akan dikemas kini sebentar lagi.";

  return (
    <div className="mx-auto max-w-lg rounded-xl bg-white p-8 text-center shadow-sm">
      <div className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full text-2xl ${warna}`}>{ikon}</div>
      <h1 className="text-xl font-bold text-slate-900">{tajuk}</h1>
      {ref && <p className="mt-1 text-sm text-slate-400">No. Rujukan: {ref}</p>}
      <p className="mt-2 text-slate-600">{mesej}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/sewaan" className="rounded-lg bg-surau px-5 py-2.5 text-sm font-semibold text-white hover:bg-surau-dark">Kembali ke Sewaan</Link>
        <Link href="/" className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Laman Utama</Link>
      </div>
    </div>
  );
}
