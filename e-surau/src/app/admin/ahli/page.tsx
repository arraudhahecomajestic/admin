import { getProfil, isStaf } from "@/lib/sesi";
import { createAdminClient, adminConfigured } from "@/lib/supabaseAdmin";
import { PerluMasuk, TiadaAkses } from "@/components/PerluMasuk";
import AdminNav from "@/components/AdminNav";
import JejakAhli from "@/components/JejakAhli";

export const dynamic = "force-dynamic";

export default async function JejakAhliPage() {
  if (!adminConfigured)
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Supabase belum dikonfigurasi.
      </div>
    );
  const profil = await getProfil();
  if (!profil) return <PerluMasuk />;
  if (!isStaf(profil)) return <TiadaAkses />;

  let senarai: any[] = [];
  let ralat: string | null = null;
  try {
    const db = createAdminClient();
    const { data, error } = await db
      .from("ahli_kariah")
      .select("id, no_ahli, nama, no_kp, telefon, maklumat_disahkan, tarikh_kemaskini")
      .order("nama", { ascending: true })
      .limit(2000);
    if (error) ralat = error.message;
    else senarai = data ?? [];
  } catch (e: any) {
    ralat = e?.message ?? String(e);
  }

  return (
    <div className="space-y-6">
      <AdminNav aktif="/admin/ahli" nama={profil.nama ?? profil.emel ?? undefined} />
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Jejak Kemas Kini Ahli</h1>
        <p className="mt-1 text-sm text-slate-600">
          Pantau siapa dah kemas kini maklumat, cari ahli, dan hantar peringatan WhatsApp.
        </p>
      </div>

      {ralat ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{ralat}</div>
      ) : (
        <JejakAhli senarai={senarai} />
      )}
    </div>
  );
}
