import Link from "next/link";
import { getProfil, isStaf } from "@/lib/sesi";
import { createAdminClient, adminConfigured } from "@/lib/supabaseAdmin";
import AdminNav from "@/components/AdminNav";
import { PerluMasuk, TiadaAkses } from "@/components/PerluMasuk";

export const dynamic = "force-dynamic";

type Ahli = {
  id: string;
  no_ahli: string | null;
  nama: string;
  no_kp: string;
  telefon: string;
  status: "menunggu" | "lulus" | "tolak";
  peringkat: "baru" | "disokong_su" | "disokong_nazir" | "selesai";
  maklumat_disahkan: boolean;
  tarikh_daftar: string;
  tanggungan: { id: string }[];
  keahlian_khairat: { no_khairat: string | null }[];
};

const peringkatLabel: Record<string, { t: string; c: string }> = {
  baru: { t: "Baru dihantar", c: "bg-slate-100 text-slate-600" },
  disokong_su: { t: "Disokong Setiausaha", c: "bg-blue-100 text-blue-700" },
  disokong_nazir: { t: "Disokong Nazir", c: "bg-indigo-100 text-indigo-700" },
  selesai: { t: "Selesai", c: "bg-green-100 text-green-700" },
};
const statusLabel: Record<string, string> = {
  menunggu: "bg-amber-100 text-amber-700",
  lulus: "bg-green-100 text-green-700",
  tolak: "bg-red-100 text-red-700",
};

export default async function AdminPage() {
  if (!adminConfigured)
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Supabase belum dikonfigurasi.
      </div>
    );

  const profil = await getProfil();
  if (!profil) return <PerluMasuk />;
  if (!isStaf(profil)) return <TiadaAkses />;

  const db = createAdminClient();
  const { data } = await db
    .from("ahli_kariah")
    .select("id, no_ahli, nama, no_kp, telefon, status, peringkat, maklumat_disahkan, tarikh_daftar, tanggungan(id), keahlian_khairat(no_khairat)")
    .order("tarikh_daftar", { ascending: false });
  const ahli = (data as Ahli[]) ?? [];

  const jum = {
    menunggu: ahli.filter((a) => a.status === "menunggu").length,
    lulus: ahli.filter((a) => a.status === "lulus").length,
    khairat: ahli.filter((a) => a.keahlian_khairat.length > 0).length,
    belumKemas: ahli.filter((a) => !a.maklumat_disahkan).length,
  };

  return (
    <div className="space-y-6">
      <AdminNav aktif="/admin" nama={profil.nama ?? profil.emel ?? undefined} />
      <h1 className="text-2xl font-bold text-slate-900">Permohonan Ahli Kariah</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Menunggu Tindakan" nilai={jum.menunggu} warna="text-amber-600" />
        <Stat label="Ahli Diluluskan" nilai={jum.lulus} warna="text-green-600" />
        <Stat label="Ahli Khairat" nilai={jum.khairat} warna="text-surau" />
        <Stat label="Belum Kemas Kini" nilai={jum.belumKemas} warna="text-orange-600" />
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">No. Ahli</th>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Peringkat</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Maklumat</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {ahli.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Tiada permohonan lagi.</td></tr>
            )}
            {ahli.map((a) => (
              <tr key={a.id} className="border-b last:border-0">
                <td className="px-4 py-3 font-mono text-xs">{a.no_ahli}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{a.nama}</div>
                  <div className="text-xs text-slate-400">{a.no_kp}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded px-2 py-0.5 text-xs font-semibold ${peringkatLabel[a.peringkat]?.c}`}>
                    {peringkatLabel[a.peringkat]?.t}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded px-2 py-0.5 text-xs font-semibold ${statusLabel[a.status]}`}>{a.status}</span>
                </td>
                <td className="px-4 py-3">
                  {a.maklumat_disahkan
                    ? <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">Disahkan</span>
                    : <span className="rounded bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">Belum</span>}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/permohonan/${a.id}`} className="rounded-lg bg-surau px-3 py-1.5 text-xs font-semibold text-white hover:bg-surau-dark">
                    Semak →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, nilai, warna }: { label: string; nilai: number; warna: string }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className={`text-2xl font-bold ${warna}`}>{nilai}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}
