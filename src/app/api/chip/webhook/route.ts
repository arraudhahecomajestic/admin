import { NextRequest, NextResponse } from "next/server";
import { laksanakanBayaran } from "@/lib/bayaran";

export const dynamic = "force-dynamic";

// Webhook success_callback dari CHIP. Untuk keselamatan, kita ambil semula
// status Purchase terus dari CHIP (guna secret key kita) sebelum tandakan dibayar.
export async function POST(req: NextRequest) {
  let body: any = {};
  try { body = await req.json(); } catch { /* mungkin form-encoded */ }
  const id = body?.id || new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, msg: "no id" }, { status: 200 });

  try { await laksanakanBayaran(String(id)); }
  catch { /* jangan gagalkan webhook */ }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
