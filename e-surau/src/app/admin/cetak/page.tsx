import Link from "next/link";
import { getProfil, isAdmin } from "@/lib/sesi";
import { PerluMasuk, TiadaAkses } from "@/components/PerluMasuk";
import { createAdminClient, adminConfigured } from "@/lib/supabaseAdmin";
import ButangCetak from "@/components/ButangCetak";
import Borang, { GayaBorang } from "@/components/BorangPendaftaran";
import { NAMA_SURAU } from "@/lib/tetapan";

export const dynamic = "force-dynamic";

const namaSurau = NAMA_SURAU;

export default async function CetakPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  if (!adminConfigured)
    return <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Supabase belum dikonfigurasi.</div>;
  const profil = await getProfil();
  if (!profil) return <PerluMasuk />;
  if (!isAdmin(profil)) return <TiadaAkses />;

  const db = createAdminClient();
  let q = db
    .from("ahli_kariah")
    .select("*, tanggungan(nama, hubungan, no_kp)")
    .order("tarikh_daftar", { ascending: false });
  if (searchParams.status && ["menunggu", "lulus", "tolak"].includes(searchParams.status)) {
    q = q.eq("status", searchParams.status);
  }
  const { data } = await q;
  const senarai = (data as any[]) ?? [];

  return (
    <div>
      {/* Bar alat — sembunyi semasa cetak */}
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cetak Borang Pendaftaran</h1>
          <p className="text-sm text-slate-600">{senarai.length} borang · format rasmi JAIS · satu borang satu muka surat.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 text-sm">
            <TapisLink label="Semua" href="/admin/cetak" aktif={!searchParams.status} />
            <TapisLink label="Menunggu" href="/admin/cetak?status=menunggu" aktif={searchParams.status === "menunggu"} />
            <TapisLink label="Diluluskan" href="/admin/cetak?status=lulus" aktif={searchParams.status === "lulus"} />
          </div>
          <ButangCetak />
        </div>
      </div>

      {senarai.length === 0 && (
        <p className="no-print rounded-lg bg-white p-6 text-center text-slate-400 shadow-sm">Tiada borang untuk dicetak.</p>
      )}

      {/* Borang-borang */}
      <div className="space-y-6">
        {senarai.map((a) => (
          <Borang key={a.id} a={a} nama={namaSurau} />
        ))}
      </div>

      <GayaBorang />
    </div>
  );
}

function TapisLink({ label, href, aktif }: { label: string; href: string; aktif: boolean }) {
  return (
    <Link href={href} className={`rounded-lg px-3 py-1.5 font-medium ${aktif ? "bg-surau text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
      {label}
    </Link>
  );
}
