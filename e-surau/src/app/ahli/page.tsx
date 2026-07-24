import Link from "next/link";
import { getProfil } from "@/lib/sesi";
import { PerluMasuk } from "@/components/PerluMasuk";
import { createAdminClient, adminConfigured } from "@/lib/supabaseAdmin";
import { rm, tarikhMs } from "@/lib/format";
import { sertaiKhairat } from "./actions";

export const dynamic = "force-dynamic";

const TAHUN = new Date().getFullYear();

export default async function AhliPage() {
  if (!adminConfigured)
    return <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Sistem belum dikonfigurasi.</div>;

  const profil = await getProfil();
  if (!profil) return <PerluMasuk />;

  // Staf tanpa rekod ahli — halakan ke panel admin
  if (!profil.ahli_id) {
    return (
      <div className="mx-auto max-w-md rounded-xl bg-white p-6 text-center shadow-sm">
        <h1 className="text-lg font-bold text-slate-900">Akaun belum dipautkan</h1>
        <p className="mt-2 text-sm text-slate-600">
          Akaun anda ({profil.emel}) belum dipautkan ke sebarang rekod ahli kariah.
          Pastikan emel akaun sama dengan emel dalam borang pendaftaran, atau hubungi admin surau.
        </p>
        {["admin", "bendahari", "ajk"].includes(profil.peranan) && (
          <Link href="/admin" className="mt-4 inline-block rounded-lg bg-surau px-5 py-2.5 font-semibold text-white">Ke Panel Admin →</Link>
        )}
      </div>
    );
  }

  const db = createAdminClient();
  const [ahliRes, khairatRes, kutipanRes, invoisRes] = await Promise.all([
    db.from("ahli_kariah").select("*, tanggungan(nama, hubungan, dilindungi_khairat)").eq("id", profil.ahli_id).single(),
    db.from("keahlian_khairat").select("id, no_khairat, status, kadar_yuran_tahunan, yuran_khairat(tahun, lunas)").eq("ahli_id", profil.ahli_id).maybeSingle(),
    db.from("kutipan").select("no_resit, jumlah, tarikh, kategori:kategori_kutipan(nama)").eq("ahli_id", profil.ahli_id).order("tarikh", { ascending: false }).limit(20),
    db.from("invois").select("no_invois, jumlah, status, tarikh").eq("ahli_id", profil.ahli_id).order("tarikh", { ascending: false }).limit(20),
  ]);

  const a: any = ahliRes.data;
  const kh: any = khairatRes.data;
  const kutipan = (kutipanRes.data as any[]) ?? [];
  const invois = (invoisRes.data as any[]) ?? [];
  const yuranTahunIni = kh?.yuran_khairat?.some((y: any) => y.tahun === TAHUN && y.lunas);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <div className="text-xs text-slate-500">Portal Ahli</div>
          <h1 className="text-2xl font-bold text-slate-900">{a?.nama}</h1>
          <p className="text-sm text-slate-500">{a?.no_ahli}</p>
        </div>
        <form action="/masuk/logout" method="post">
          <button className="text-sm text-slate-500 hover:underline">Log keluar</button>
        </form>
      </div>

      {/* Status permohonan */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Kad label="Status Keahlian" nilai={a?.status === "lulus" ? "Diluluskan" : a?.status === "tolak" ? "Tidak Diluluskan" : "Menunggu"} warna={a?.status === "lulus" ? "text-green-600" : a?.status === "tolak" ? "text-red-600" : "text-amber-600"} />
        <Kad label="Khairat Kematian" nilai={kh ? (kh.status === "aktif" ? "Aktif" : "Tertunggak") : "Tidak sertai"} warna={kh?.status === "aktif" ? "text-green-600" : "text-slate-500"} />
        <Kad label={`Yuran Khairat ${TAHUN}`} nilai={kh ? (yuranTahunIni ? "Lunas" : "Belum bayar") : "-"} warna={yuranTahunIni ? "text-green-600" : "text-red-600"} />
      </div>

      {/* Skim Khairat Kematian */}
      <section className="rounded-xl border-2 border-surau/30 bg-surau/5 p-5">
        <h2 className="mb-2 font-semibold text-slate-900">Skim Khairat Kematian</h2>
        {!kh ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Anda belum menyertai skim khairat. Yuran <b>RM60 setahun</b>, pampasan tetap
              <b> RM1,400</b> setiap kematian ahli atau tanggungan yang dilindungi.
            </p>
            <form action={sertaiKhairat}>
              <button className="rounded-lg bg-surau px-5 py-2.5 text-sm font-semibold text-white hover:bg-surau-dark">
                Sertai Skim Khairat →
              </button>
            </form>
          </div>
        ) : kh.status === "aktif" ? (
          <p className="text-sm text-slate-700">
            ✓ Keahlian khairat anda <b className="text-green-700">AKTIF</b>. No. Khairat: {kh.no_khairat}.
            Yuran {TAHUN}: <b>{yuranTahunIni ? "Lunas" : "Belum bayar"}</b>.
          </p>
        ) : (
          <div className="space-y-2 text-sm text-slate-700">
            <p>
              Anda telah <b>memohon sertai</b> khairat (No. {kh.no_khairat}). Status:
              <b className="text-amber-700"> Tertunggak</b>.
            </p>
            <p className="rounded-lg bg-amber-50 p-3 text-amber-800">
              Sila jelaskan yuran <b>RM60</b> kepada AJK / di kaunter surau untuk mengaktifkan keahlian.
              Pembayaran atas talian akan datang tidak lama lagi.
            </p>
          </div>
        )}
      </section>

      {/* Maklumat diri */}
      <section className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-semibold text-surau">Maklumat Saya</h2>
        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <Row k="No. KP" v={a?.no_kp} />
          <Row k="Telefon" v={a?.telefon} />
          <Row k="E-mel" v={a?.emel} />
          <Row k="Alamat" v={a?.alamat} />
        </dl>
        {a?.tanggungan?.length > 0 && (
          <div className="mt-3 text-sm">
            <div className="font-medium text-slate-700">Tanggungan:</div>
            <ul className="list-inside list-disc text-slate-600">
              {a.tanggungan.map((t: any, i: number) => (<li key={i}>{t.nama} ({t.hubungan}){t.dilindungi_khairat ? " · dilindungi khairat" : ""}</li>))}
            </ul>
          </div>
        )}
      </section>

      {/* Sejarah sumbangan */}
      <section className="rounded-xl bg-white shadow-sm">
        <h2 className="border-b px-5 py-3 font-semibold text-slate-900">Sejarah Sumbangan & Resit</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr><th className="px-4 py-2">Resit</th><th className="px-4 py-2">Tarikh</th><th className="px-4 py-2">Kategori</th><th className="px-4 py-2 text-right">Jumlah</th></tr>
            </thead>
            <tbody>
              {kutipan.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">Tiada sumbangan direkod lagi.</td></tr>}
              {kutipan.map((k, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="px-4 py-2 font-mono text-xs">{k.no_resit}</td>
                  <td className="px-4 py-2">{tarikhMs(k.tarikh)}</td>
                  <td className="px-4 py-2">{k.kategori?.nama}</td>
                  <td className="px-4 py-2 text-right font-medium">{rm(k.jumlah)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Invois */}
      {invois.length > 0 && (
        <section className="rounded-xl bg-white shadow-sm">
          <h2 className="border-b px-5 py-3 font-semibold text-slate-900">Invois / Bil</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr><th className="px-4 py-2">No.</th><th className="px-4 py-2">Tarikh</th><th className="px-4 py-2">Status</th><th className="px-4 py-2 text-right">Jumlah</th></tr>
              </thead>
              <tbody>
                {invois.map((v, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="px-4 py-2 font-mono text-xs">{v.no_invois}</td>
                    <td className="px-4 py-2">{tarikhMs(v.tarikh)}</td>
                    <td className="px-4 py-2">{v.status}</td>
                    <td className="px-4 py-2 text-right font-medium">{rm(v.jumlah)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function Kad({ label, nilai, warna }: { label: string; nilai: string; warna: string }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className={`text-lg font-bold ${warna}`}>{nilai}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}

function Row({ k, v }: { k: string; v?: string | null }) {
  return (
    <div className="flex justify-between border-b border-slate-100 py-1">
      <dt className="text-slate-500">{k}</dt>
      <dd className="text-right font-medium text-slate-800">{v || "-"}</dd>
    </div>
  );
}
