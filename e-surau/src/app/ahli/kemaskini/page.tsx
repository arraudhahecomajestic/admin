import Link from "next/link";
import { getProfil } from "@/lib/sesi";
import { PerluMasuk } from "@/components/PerluMasuk";
import { createAdminClient, adminConfigured } from "@/lib/supabaseAdmin";
import KemaskiniForm from "@/components/KemaskiniForm";

export const dynamic = "force-dynamic";

export default async function KemaskiniPage() {
  if (!adminConfigured)
    return <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Sistem belum dikonfigurasi.</div>;
  const profil = await getProfil();
  if (!profil) return <PerluMasuk />;
  if (!profil.ahli_id)
    return <div className="rounded-lg bg-white p-6 text-center text-sm text-slate-600 shadow-sm">Akaun anda belum dipautkan ke rekod ahli. Sila hubungi admin surau.</div>;

  const db = createAdminClient();
  const { data } = await db
    .from("ahli_kariah")
    .select("*, tanggungan(nama, no_kp, hubungan, tarikh_lahir, dilindungi_khairat)")
    .eq("id", profil.ahli_id)
    .single();

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <Link href="/ahli" className="text-sm text-slate-500 hover:underline">← Kembali ke Portal</Link>
        <h1 className="text-2xl font-bold text-slate-900">Kemas Kini Maklumat</h1>
        <p className="mt-1 text-sm text-slate-600">
          Sila semak, betulkan, dan lengkapkan maklumat anda di bawah. Selepas simpan,
          maklumat anda akan ditandakan sebagai <b>disahkan</b>.
        </p>
      </div>
      <KemaskiniForm awal={data} />
    </div>
  );
}
