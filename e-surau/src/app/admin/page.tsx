import Link from "next/link";
import { getProfil, isPentadbir } from "@/lib/sesi";
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
  sumber: string;
  tarikh_daftar: string;
  tanggungan: { id: string }[];
  keahlian_khairat: { no_khairat: string | null }[];
};

// Kategori pemohon untuk penapisan
function kategoriAhli(a: { sumber: string; maklumat_disahkan: boolean }): "baru" | "sedia" | "kemas" {
  if (a.sumber === "baru") return "baru";
  return a.maklumat_disahkan ? "kemas" : "sedia";
}
const kategoriLabel: Record<string, { t: string; c: string }> = {
  baru: { t: "Pemohon Baru", c: "bg-emerald-100 text-emerald-700" },
  sedia: { t: "Sedia Ada", c: "bg-slate-100 text-slate-600" },
  kemas: { t: "Kemas Kini Data", c: "bg-blue-100 text-blue-700" },
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

export default async function AdminPage({ searchParams }: { searchParams: { tapis?: string } }) {
  if (!adminConfigured)
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Supabase belum dikonfigurasi.
      </div>
    );

  const tapis = searchParams?.tapis ?? "";
  let ahli: Ahli[] = [];
  let ralat: string | null = null;
  let namaStaf: string | undefined;
  let perananStaf: string | undefined;
  let masterStaf = false;
  let jum = { menunggu: 0, lulus: 0, khairat: 0, belumKemas: 0 };
  let kira = { baru: 0, sedia: 0, kemas: 0 };

  try {
    const profil = await getProfil();
    if (!profil) return <PerluMasuk />;
    if (!isPentadbir(profil)) return <TiadaAkses />;
    namaStaf = profil.nama ?? profil.emel ?? undefined;
    perananStaf = profil.peranan;
    masterStaf = profil.master;

    const db = createAdminClient();
    const { data, error } = await db
      .from("ahli_kariah")
      .select("id, no_ahli, nama, no_kp, telefon, status, peringkat, maklumat_disahkan, sumber, tarikh_daftar, tanggungan(id), keahlian_khairat(no_khairat)")
      .order("tarikh_daftar", { ascending: false });
    if (error) {
      ralat = error.message + (error.hint ? ` (${error.hint})` : "");
    } else {
      ahli = ((data as Ahli[]) ?? []).map((a) => ({
        ...a,
        tanggungan: a.tanggungan ?? [],
        keahlian_khairat: a.keahlian_khairat ?? [],
      }));
      jum = {
        menunggu: ahli.filter((a) => a.status === "menunggu").length,
        lulus: ahli.filter((a) => a.status === "lulus").length,
        khairat: ahli.filter((a) => (a.keahlian_khairat?.length ?? 0) > 0).length,
        belumKemas: ahli.filter((a) => !a.maklumat_disahkan).length,
      };
      kira = {
        baru: ahli.filter((a) => kategoriAhli(a) === "baru").length,
        sedia: ahli.filter((a) => kategoriAhli(a) === "sedia").length,
        kemas: ahli.filter((a) => kategoriAhli(a) === "kemas").length,
      };
    }
  } catch (e: any) {
    ralat = e?.message ?? String(e);
  }

  if (ralat)
    return (
      <div className="space-y-4">
        <AdminNav aktif="/admin" nama={namaStaf} peranan={perananStaf} master={masterStaf} />
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <div className="font-semibold">Ralat (v3) — punca sebenar:</div>
          <p className="mt-1 break-words font-mono text-xs">{ralat}</p>
          <p className="mt-2 text-xs text-red-500">
            Jika ralat menyebut kolum <code>maklumat_disahkan</code> tidak wujud, sila jalankan
            fail <code>schema_fasa7_kemaskini.sql</code> di Supabase SQL Editor.
          </p>
        </div>
      </div>
    );

  const senarai = tapis ? ahli.filter((a) => kategoriAhli(a) === tapis) : ahli;

  return (
    <div className="space-y-6">
      <AdminNav aktif="/admin" nama={namaStaf} peranan={perananStaf} master={masterStaf} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-slate-900">Permohonan Ahli Kariah</h1>
        <Link href="/admin/seed-akaun" className="rounded-lg border border-surau/40 px-3 py-1.5 text-xs font-semibold text-surau hover:bg-surau/10">
          Sediakan Akaun Ahli
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Menunggu Tindakan" nilai={jum.menunggu} warna="text-amber-600" />
        <Stat label="Ahli Diluluskan" nilai={jum.lulus} warna="text-green-600" />
        <Stat label="Ahli Khairat" nilai={jum.khairat} warna="text-surau" />
        <Stat label="Belum Kemas Kini" nilai={jum.belumKemas} warna="text-orange-600" />
      </div>

      {/* Penapis kategori pemohon */}
      <div className="flex flex-wrap gap-2">
        <Tapis label="Semua" bil={ahli.length} href="/admin" aktif={!tapis} />
        <Tapis label="Pemohon Baru" bil={kira.baru} href="/admin?tapis=baru" aktif={tapis === "baru"} />
        <Tapis label="Sedia Ada (belum kemas kini)" bil={kira.sedia} href="/admin?tapis=sedia" aktif={tapis === "sedia"} />
        <Tapis label="Kemas Kini Data" bil={kira.kemas} href="/admin?tapis=kemas" aktif={tapis === "kemas"} />
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">No. Ahli</th>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Kategori</th>
              <th className="px-4 py-3">Peringkat</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Maklumat</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {senarai.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Tiada permohonan dalam kategori ini.</td></tr>
            )}
            {senarai.map((a) => (
              <tr key={a.id} className="border-b last:border-0">
                <td className="px-4 py-3 font-mono text-xs">{a.no_ahli}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{a.nama}</div>
                  <div className="text-xs text-slate-400">{a.no_kp}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded px-2 py-0.5 text-xs font-semibold ${kategoriLabel[kategoriAhli(a)]?.c}`}>
                    {kategoriLabel[kategoriAhli(a)]?.t}
                  </span>
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

function Tapis({ label, bil, href, aktif }: { label: string; bil: number; href: string; aktif: boolean }) {
  return (
    <Link
      href={href}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium ${aktif ? "bg-surau text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
    >
      {label} <span className={`ml-1 rounded-full px-1.5 py-0.5 text-xs ${aktif ? "bg-white/25" : "bg-white"}`}>{bil}</span>
    </Link>
  );
}
