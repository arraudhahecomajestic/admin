import Link from "next/link";
import { getProfil, bolehNilaiStaf } from "@/lib/sesi";
import { PerluMasuk, TiadaAkses } from "@/components/PerluMasuk";
import { createAdminClient, adminConfigured } from "@/lib/supabaseAdmin";
import AdminNav from "@/components/AdminNav";
import BorangPenilaianStaf from "@/components/BorangPenilaianStaf";

export const dynamic = "force-dynamic";

export default async function PenilaianBaruPage({ searchParams }: { searchParams: { staf?: string } }) {
  if (!adminConfigured) return <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Supabase belum dikonfigurasi.</div>;
  const profil = await getProfil();
  if (!profil) return <PerluMasuk />;
  if (!bolehNilaiStaf(profil)) return <TiadaAkses />;

  const stafId = searchParams.staf ?? "";
  const db = createAdminClient();
  const { data } = await db.from("staf_gaji_config")
    .select("profil_id, nama, no_kp, jawatan, gaji_pokok, elaun_telefon, elaun_perjalanan, elaun_perkhidmatan, maks_elaun_hadir")
    .eq("profil_id", stafId).maybeSingle();
  const s: any = data;

  return (
    <div className="space-y-6">
      <AdminNav aktif="/admin/staf" nama={profil.nama ?? profil.emel ?? undefined} peranan={profil.peranan} master={profil.master} />
      <div>
        <Link href="/admin/staf/penilaian" className="text-sm text-slate-500 hover:underline">← Senarai penilaian</Link>
        <h1 className="text-2xl font-bold text-slate-900">Borang Penilaian Prestasi</h1>
      </div>

      {!s ? (
        <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          Staf tidak dijumpai. Sila pilih staf dari <Link href="/admin/staf/penilaian" className="font-semibold underline">senarai penilaian</Link>.
        </div>
      ) : (
        <BorangPenilaianStaf
          profilId={s.profil_id}
          nama={s.nama ?? "—"}
          noKp={s.no_kp ?? undefined}
          jawatan={s.jawatan ?? undefined}
          gajiSemasa={Number(s.gaji_pokok || 0)}
        />
      )}

      <style>{`.inp{width:100%;border-radius:.5rem;border:1px solid #cbd5e1;padding:.5rem .75rem;font-size:.875rem;outline:none}.inp:focus{border-color:#b8860b;box-shadow:0 0 0 2px rgba(184,134,11,.2)}`}</style>
    </div>
  );
}
