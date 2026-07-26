import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { statusPurchase } from "@/lib/chip";

export const dynamic = "force-dynamic";

// Webhook success_callback dari CHIP. Untuk keselamatan, kita TIDAK percaya
// badan permintaan bulat-bulat — kita ambil semula status Purchase terus dari
// CHIP (guna secret key kita) untuk sahkan ia benar-benar 'paid'.
export async function POST(req: NextRequest) {
  let body: any = {};
  try { body = await req.json(); } catch { /* mungkin form-encoded */ }
  const id = body?.id || new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, msg: "no id" }, { status: 200 });

  let p: any;
  try { p = await statusPurchase(String(id)); }
  catch { return NextResponse.json({ ok: false, msg: "verify failed" }, { status: 200 }); }

  const dibayar = p?.status === "paid";
  const db = createAdminClient();

  const { data: b } = await db
    .from("bayaran")
    .select("id, rujukan_id, jenis, status")
    .eq("chip_id", String(id))
    .maybeSingle();

  await db.from("bayaran").update({
    status: dibayar ? "dibayar" : "gagal",
    tarikh_bayar: dibayar ? new Date().toISOString() : null,
  }).eq("chip_id", String(id));

  if (dibayar && (b as any)?.jenis === "sewaan" && (b as any)?.rujukan_id) {
    await db.from("sewaan").update({ kaedah_bayar: "Online (CHIP)" }).eq("id", (b as any).rujukan_id);
  }

  return NextResponse.json({ ok: true });
}

// CHIP kadangkala hantar GET untuk pengesahan URL
export async function GET() {
  return NextResponse.json({ ok: true });
}
