import Link from "next/link";
import { getProfil } from "@/lib/sesi";
import { PerluMasuk } from "@/components/PerluMasuk";
import { createAdminClient, adminConfigured } from "@/lib/supabaseAdmin";
import Borang, { GayaBorang } from "@/components/BorangPendaftaran";
import ButangCetakBorang from "@/components/ButangCetakBorang";

export const dynamic = "force-dynamic";

export default async function BorangAhliPage() {
  if (!adminConfigured)
    return <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Supabase belum dikonfigurasi.</div>;

  const profil = await getProfil();
  if (!profil) return <PerluMasuk />;
  if (!profil.ahli_id)
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Akaun anda belum dipautkan dengan rekod ahli kariah. Sila lengkapkan pendaftaran di Portal Ahli dahulu.
      </div>
    );

  const db = createAdminClient();
  const { data } = await db
    .from("ahli_kariah")
    .select("*, tanggungan(nama, hubungan, no_kp)")
    .eq("id", profil.ahli_id)
    .maybeSingle();
  const a: any = data;

  if (!a)
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Rekod ahli tidak dijumpai.
      </div>
    );

  // Hanya borang yang telah DILULUSKAN oleh AJK boleh dimuat turun.
  if (a.status !== "lulus") {
    const mesej =
      a.status === "tolak"
        ? "Permohonan keahlian anda tidak diluluskan. Sila hubungi AJK surau untuk keterangan lanjut."
        : "Borang pendaftaran anda masih dalam proses semakan AJK. Muat turun borang rasmi akan tersedia sebaik sahaja permohonan diluluskan.";
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900">Borang Pendaftaran</h1>
          <Link href="/ahli" className="text-sm font-medium text-surau hover:underline">← Portal Ahli</Link>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {mesej}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bar alat — sembunyi semasa cetak */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Borang Pendaftaran (Diluluskan)</h1>
          <p className="text-sm text-slate-600">Borang rasmi anda telah diluluskan AJK. Klik butang untuk muat turun / simpan sebagai PDF.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/ahli" className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200">← Portal Ahli</Link>
          <ButangCetakBorang />
        </div>
      </div>

      <Borang a={a} />

      <GayaBorang />
    </div>
  );
}
