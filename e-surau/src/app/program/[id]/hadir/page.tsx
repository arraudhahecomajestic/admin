import Link from "next/link";
import { createAdminClient, adminConfigured } from "@/lib/supabaseAdmin";
import { tarikhMs } from "@/lib/format";
import CheckInKehadiranForm from "@/components/CheckInKehadiranForm";

export const dynamic = "force-dynamic";

export default async function CheckInPage({ params }: { params: { id: string } }) {
  if (!adminConfigured) return <p className="text-center text-slate-500">Sistem belum dikonfigurasi.</p>;

  const db = createAdminClient();
  const { data } = await db
    .from("program")
    .select("id, tajuk, tarikh, masa, lokasi, checkin_dibuka")
    .eq("id", params.id)
    .maybeSingle();
  const p: any = data;

  if (!p) {
    return (
      <div className="mx-auto max-w-lg rounded-xl bg-white p-8 text-center shadow-sm">
        <p className="text-slate-500">Program tidak dijumpai.</p>
        <Link href="/" className="mt-4 inline-block text-sm text-surau hover:underline">← Laman utama</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-5">
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="bg-surau/10 px-6 py-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-surau">Check-in Kehadiran · Surau Ar-Raudhah</p>
        </div>
        <div className="p-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900">{p.tajuk}</h1>
          <div className="mt-1 text-sm text-slate-600">{tarikhMs(p.tarikh)}{p.masa ? ` · ${p.masa}` : ""}{p.lokasi ? ` · ${p.lokasi}` : ""}</div>
        </div>
      </div>

      {p.checkin_dibuka ? (
        <CheckInKehadiranForm programId={p.id} />
      ) : (
        <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-5 text-center text-sm font-semibold text-amber-800">
          Check-in untuk program ini belum dibuka. Sila hubungi AJK di lokasi.
        </div>
      )}

      <p className="text-center">
        <Link href="/" className="text-sm text-slate-500 hover:underline">← Laman utama</Link>
      </p>
    </div>
  );
}
