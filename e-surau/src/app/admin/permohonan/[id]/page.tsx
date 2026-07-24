import Link from "next/link";
import { getProfil, isStaf } from "@/lib/sesi";
import { PerluMasuk, TiadaAkses } from "@/components/PerluMasuk";
import { createAdminClient, adminConfigured } from "@/lib/supabaseAdmin";
import AdminNav from "@/components/AdminNav";
import { tarikhMs } from "@/lib/format";
import { ulasanSU, ulasanNazir, keputusan } from "./actions";

export const dynamic = "force-dynamic";

export default async function PermohonanPage({ params }: { params: { id: string } }) {
  if (!adminConfigured)
    return <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Supabase belum dikonfigurasi.</div>;
  const profil = await getProfil();
  if (!profil) return <PerluMasuk />;
  if (!isStaf(profil)) return <TiadaAkses />;

  const db = createAdminClient();
  const { data } = await db
    .from("ahli_kariah")
    .select("*, tanggungan(nama, hubungan, no_kp, dilindungi_khairat)")
    .eq("id", params.id)
    .single();
  if (!data) return <p className="text-slate-500">Permohonan tidak dijumpai.</p>;
  const a: any = data;

  async function signed(path: string | null) {
    if (!path) return null;
    const rel = path.replace(/^salinan-kp\//, "");
    const { data } = await db.storage.from("salinan-kp").createSignedUrl(rel, 3600);
    return data?.signedUrl ?? null;
  }
  const [depan, belakang] = await Promise.all([signed(a.url_kp_depan), signed(a.url_kp_belakang)]);
  const bolehKeputusan = profil.peranan === "admin";
  const tempoh = a.tempoh_menetap_nilai ? `${a.tempoh_menetap_nilai} ${a.tempoh_menetap_unit ?? ""}` : "-";

  return (
    <div className="space-y-6">
      <AdminNav aktif="/admin" nama={profil.nama ?? profil.emel ?? undefined} />
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin" className="text-sm text-slate-500 hover:underline">← Senarai permohonan</Link>
          <h1 className="text-2xl font-bold text-slate-900">{a.nama}</h1>
          <p className="text-sm text-slate-500">{a.no_ahli} · {a.no_kp}</p>
        </div>
        <span className={`rounded px-3 py-1 text-sm font-semibold ${a.status === "lulus" ? "bg-green-100 text-green-700" : a.status === "tolak" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
          {a.status}
        </span>
      </div>

      {/* BAHAGIAN A */}
      <section className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-semibold text-surau">BAHAGIAN A · Butiran Ahli</h2>
        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <Row k="Alamat dalam KP" v={a.alamat_kp} />
          <Row k="Alamat sekarang" v={a.alamat} />
          <Row k="Telefon Rumah" v={a.no_telefon_rumah} />
          <Row k="No. H/P" v={a.telefon} />
          <Row k="E-mel" v={a.emel} />
          <Row k="Status Perkahwinan" v={a.status_perkahwinan} />
          <Row k="Tempoh Menetap" v={tempoh} />
          <Row k="Pengakuan" v={a.pengakuan ? "✓ Diakui benar" : "—"} />
        </dl>

        {(depan || belakang) && (
          <div className="mt-4">
            <div className="mb-1 text-sm font-medium text-slate-700">Gambar Kad Pengenalan</div>
            <div className="flex flex-wrap gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {depan && <a href={depan} target="_blank"><img src={depan} alt="IC Depan" className="h-28 rounded border" /></a>}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {belakang && <a href={belakang} target="_blank"><img src={belakang} alt="IC Belakang" className="h-28 rounded border" /></a>}
            </div>
          </div>
        )}

        {a.tanggungan?.length > 0 && (
          <div className="mt-4 text-sm">
            <div className="mb-1 font-medium text-slate-700">Tanggungan:</div>
            <ul className="list-inside list-disc text-slate-600">
              {a.tanggungan.map((t: any, i: number) => (
                <li key={i}>{t.nama} ({t.hubungan}){t.dilindungi_khairat ? " · khairat" : ""}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* BAHAGIAN B1 */}
      <UlasanSeksyen
        tajuk="BAHAGIAN B1 · Ulasan Setiausaha / Pengerusi MPKK"
        sokong={a.ulasan_su_sokong}
        catatan={a.ulasan_su_catatan}
        oleh={a.ulasan_su_oleh}
        tarikh={a.ulasan_su_tarikh}
        action={ulasanSU.bind(null, a.id)}
      />

      {/* BAHAGIAN B2 */}
      <UlasanSeksyen
        tajuk="BAHAGIAN B2 · Ulasan Nazir / Pengerusi Surau"
        sokong={a.ulasan_nazir_sokong}
        catatan={a.ulasan_nazir_catatan}
        oleh={a.ulasan_nazir_oleh}
        tarikh={a.ulasan_nazir_tarikh}
        action={ulasanNazir.bind(null, a.id)}
      />

      {/* BAHAGIAN C */}
      <section className="rounded-xl border-2 border-surau/30 bg-surau/5 p-5">
        <h2 className="mb-3 font-semibold text-slate-900">BAHAGIAN C · Keputusan Jawatankuasa Kariah</h2>
        {a.status !== "menunggu" ? (
          <p className="text-sm text-slate-700">
            Keputusan: <b>{a.status === "lulus" ? "Diluluskan" : "Tidak Diluluskan"}</b>
            {a.keputusan_oleh ? ` · oleh ${a.keputusan_oleh}` : ""} {a.keputusan_tarikh ? `· ${tarikhMs(a.keputusan_tarikh)}` : ""}
          </p>
        ) : bolehKeputusan ? (
          <div className="flex flex-wrap gap-2">
            <form action={keputusan.bind(null, a.id)}>
              <input type="hidden" name="keputusan" value="lulus" />
              <button className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700">
                ✓ Luluskan Permohonan
              </button>
            </form>
            <form action={keputusan.bind(null, a.id)}>
              <input type="hidden" name="keputusan" value="tolak" />
              <button className="rounded-lg bg-red-100 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-200">
                ✗ Tidak Luluskan
              </button>
            </form>
          </div>
        ) : (
          <p className="text-sm text-amber-700">Hanya admin / Pengerusi JK boleh membuat keputusan akhir. Sila pastikan ulasan B1 & B2 selesai dahulu.</p>
        )}
      </section>
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

function UlasanSeksyen({
  tajuk, sokong, catatan, oleh, tarikh, action,
}: {
  tajuk: string;
  sokong: boolean | null;
  catatan: string | null;
  oleh: string | null;
  tarikh: string | null;
  action: (formData: FormData) => void;
}) {
  const sudah = sokong !== null && sokong !== undefined;
  return (
    <section className="rounded-xl bg-white p-5 shadow-sm">
      <h2 className="mb-3 font-semibold text-slate-900">{tajuk}</h2>
      {sudah && (
        <div className={`mb-3 rounded-lg p-3 text-sm ${sokong ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          <b>{sokong ? "☑ Menyokong" : "☒ Tidak Menyokong"}</b>
          {catatan ? ` — ${catatan}` : ""}
          <div className="mt-1 text-xs text-slate-500">Oleh: {oleh ?? "-"} · {tarikh ? tarikhMs(tarikh) : ""}</div>
        </div>
      )}
      <form action={action} className="space-y-3">
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-1.5">
            <input type="radio" name="sokong" value="ya" defaultChecked={sokong === true} required /> Menyokong
          </label>
          <label className="flex items-center gap-1.5">
            <input type="radio" name="sokong" value="tidak" defaultChecked={sokong === false} /> Tidak Menyokong
          </label>
        </div>
        <input name="catatan" defaultValue={catatan ?? ""} placeholder="Catatan (pilihan)" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-surau" />
        <button className="rounded-lg bg-surau px-4 py-2 text-sm font-semibold text-white hover:bg-surau-dark">
          {sudah ? "Kemas kini ulasan" : "Simpan ulasan"}
        </button>
      </form>
    </section>
  );
}
