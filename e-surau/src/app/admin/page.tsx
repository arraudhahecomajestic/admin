import { getProfil, isPentadbir, isMaster } from "@/lib/sesi";
import { createAdminClient, adminConfigured } from "@/lib/supabaseAdmin";
import AdminNav from "@/components/AdminNav";
import { PerluMasuk, TiadaAkses } from "@/components/PerluMasuk";
import PengurusanAhli from "@/components/PengurusanAhli";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!adminConfigured)
    return <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Supabase belum dikonfigurasi.</div>;

  const profil = await getProfil();
  if (!profil) return <PerluMasuk />;
  if (!isPentadbir(profil)) return <TiadaAkses />;

  // Papar IC & Telefon: Admin (peranan) atau Master (super admin) sahaja.
  const bolehPapar = profil.peranan === "admin" || isMaster(profil);

  const db = createAdminClient();
  const { data, error } = await db
    .from("ahli_kariah")
    .select("id, no_ahli, nama, no_kp, telefon, status, peringkat, maklumat_disahkan, sumber, tarikh_daftar")
    .order("tarikh_daftar", { ascending: false });

  const senarai = (data as any[]) ?? [];

  return (
    <div className="space-y-6">
      <AdminNav aktif="/admin" nama={profil.nama ?? profil.emel ?? undefined} peranan={profil.peranan} master={profil.master} />
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pengurusan Ahli Kariah</h1>
        <p className="mt-1 text-sm text-slate-600">Luluskan permohonan, jejak kemas kini data &amp; hantar peringatan — semua di satu tempat.</p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error.message}</div>
      ) : (
        <PengurusanAhli senarai={senarai} bolehPapar={bolehPapar} />
      )}
    </div>
  );
}
