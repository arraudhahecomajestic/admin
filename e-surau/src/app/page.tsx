import Link from "next/link";
import PrayerTimes from "@/components/PrayerTimes";
import { supabase, supabaseConfigured } from "@/lib/supabaseClient";
import { NAMA_SURAU, ZON_SOLAT, YURAN_KHAIRAT_TAHUNAN } from "@/lib/tetapan";
import { khairatDibuka, pampasanKhairat, kewanganAwamDibuka } from "@/lib/tetapanSistem";
import { getProfil, isStaf } from "@/lib/sesi";
import { rm, tarikhMs } from "@/lib/format";
import { bahasaSemasa } from "@/lib/bahasa";
import { buatT } from "@/lib/i18n";
import { createAdminClient, adminConfigured } from "@/lib/supabaseAdmin";
import { KAWASAN, kenalKawasan } from "@/lib/kawasan";
import StatFasaChart from "@/components/StatFasaChart";

export const dynamic = "force-dynamic";

type Pengumuman = {
  id: string;
  tajuk: string;
  kandungan: string;
  penting: boolean;
  tarikh: string;
};

type Tabung = {
  kategori_id: number;
  nama: string;
  jenis_khairat: boolean;
  jumlah_terkumpul: number | string;
  jumlah_bulan_ini: number | string;
  terkini_jumlah: number | string | null;
  terkini_tarikh: string | null;
};

async function ambilPengumuman(): Promise<Pengumuman[]> {
  if (!supabaseConfigured) return [];
  const { data, error } = await supabase
    .from("pengumuman")
    .select("id, tajuk, kandungan, penting, tarikh")
    .eq("diterbitkan", true)
    .order("tarikh", { ascending: false })
    .limit(10);
  if (error) return [];
  return data ?? [];
}

async function ambilTabung(): Promise<Tabung[]> {
  if (!supabaseConfigured) return [];
  const { data, error } = await supabase
    .from("v_kutipan_ringkasan")
    .select("kategori_id, nama, jenis_khairat, jumlah_terkumpul, jumlah_bulan_ini, terkini_jumlah, terkini_tarikh")
    .order("urutan", { ascending: true });
  if (error) return [];
  return (data as Tabung[]) ?? [];
}

async function ambilProgram(): Promise<any[]> {
  if (!supabaseConfigured) return [];
  const { data, error } = await supabase.from("v_program_awam").select("*").limit(3);
  if (error) return [];
  return (data as any[]) ?? [];
}

async function ambilStatFasa(): Promise<{ data: { nama: string; bil: number }[]; total: number }> {
  if (!adminConfigured) return { data: [], total: 0 };
  try {
    const db = createAdminClient();
    const { data } = await db.from("ahli_kariah").select("alamat, alamat_kp, kawasan");
    const rows = (data as any[]) ?? [];
    const kira: Record<string, number> = {};
    for (const k of KAWASAN) kira[k.kod] = 0;
    let total = 0;
    for (const a of rows) {
      const kw = kenalKawasan(a.alamat || a.alamat_kp, a.kawasan);
      if (kw.kod === "lain") continue; // graf awam tunjuk fasa dikenali sahaja
      kira[kw.kod] = (kira[kw.kod] ?? 0) + 1;
      total++;
    }
    return { data: KAWASAN.map((k) => ({ nama: k.nama, bil: kira[k.kod] ?? 0 })), total };
  } catch {
    return { data: [], total: 0 };
  }
}

export default async function Home() {
  const zon = ZON_SOLAT;
  const namaSurau = NAMA_SURAU;
  const tr = buatT(bahasaSemasa());
  const [pengumuman, tabung, program, statFasa, khDibuka, pampasan, kewanganAwam, profil] = await Promise.all([
    ambilPengumuman(),
    ambilTabung(),
    ambilProgram(),
    ambilStatFasa(),
    khairatDibuka(),
    pampasanKhairat(),
    kewanganAwamDibuka(),
    getProfil(),
  ]);
  const stafKewangan = isStaf(profil); // SU/Pengerusi/AJK + Bendahari
  const paparKewangan = kewanganAwam || stafKewangan; // awam nampak hanya bila diterbitkan

  return (
    <div className="space-y-8">
      {/* Kempen Khairat Kematian — banner besar (dikawal toggle admin) */}
      {khDibuka && (
        <section className="overflow-hidden rounded-2xl border-2 border-teal-600 bg-gradient-to-br from-teal-700 to-emerald-800 p-6 text-white shadow-lg sm:p-8">
          <span className="inline-block rounded-full bg-amber-400 px-3 py-1 text-xs font-bold uppercase tracking-wide text-teal-900">
            {tr("Baru Dibuka", "Now Open")}
          </span>
          <h2 className="mt-3 text-2xl font-extrabold leading-tight sm:text-3xl">
            {tr("Sertai Skim Khairat Kematian Surau Ar Raudhah", "Join the Surau Ar Raudhah Death Benefit Scheme")}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-teal-50 sm:text-base">
            {tr("Ringankan beban keluarga di saat dukacita. Dengan hanya ", "Ease your family's burden in times of grief. For just ")}
            <span className="font-bold text-white">RM{YURAN_KHAIRAT_TAHUNAN}/{tr("tahun", "year")}</span>
            {tr(", keluarga menerima pampasan khairat ", ", your family receives a death benefit of ")}
            <span className="font-bold text-white">RM{rm(pampasan).replace("RM", "")}</span>
            {tr(" bagi setiap kematian yang dilindungi. Sertai sekarang — jangan tunggu hingga terlambat.", " for each covered death. Join now — don't wait until it's too late.")}
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/daftar"
              className="rounded-lg bg-amber-400 px-6 py-3 text-center text-sm font-bold text-teal-900 shadow hover:bg-amber-300"
            >
              {tr("Daftar Khairat Kematian →", "Register for Death Benefit →")}
            </Link>
            <Link
              href="/masuk"
              className="rounded-lg border-2 border-white/70 px-6 py-3 text-center text-sm font-semibold text-white hover:bg-white/10"
            >
              {tr("Sudah Ahli? Kemas Kini & Sertai", "Already a member? Update & Join")}
            </Link>
            <Link
              href="/khairat"
              className="rounded-lg px-6 py-3 text-center text-sm font-semibold text-teal-100 underline underline-offset-4 hover:text-white"
            >
              {tr("Apa itu Khairat Kematian?", "What is the Death Benefit?")}
            </Link>
          </div>
        </section>
      )}

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">
          {tr("Selamat datang ke", "Welcome to")} {namaSurau}
        </h1>
        <p className="mt-2 text-slate-600">
          {tr(
            "Portal rasmi kariah — daftar ahli, sertai khairat kematian, dan ikuti program surau.",
            "The official community portal — register as a member, join the death benefit scheme, and follow surau programmes.",
          )}
        </p>

        <div className="mt-5 rounded-xl border-2 border-surau/30 bg-surau/5 p-5">
          <div className="text-base font-semibold text-slate-900">{tr("Daftar Ahli Kariah", "Register as a Community Member")}</div>
          <p className="mt-1 text-sm text-slate-600">
            {tr(
              "Masukkan No. Kad Pengenalan anda — sistem akan semak sama ada anda sudah berdaftar atau belum. Jika belum, isi borang pendaftaran. Jika sudah, teruskan untuk akses portal & kemas kini maklumat.",
              "Enter your IC number — the system will check whether you are already registered. If not, fill in the registration form. If yes, continue to access the portal & update your details.",
            )}
          </p>
          <Link
            href="/daftar"
            className="mt-3 inline-block rounded-lg bg-surau px-6 py-2.5 text-sm font-semibold text-white hover:bg-surau-dark"
          >
            {tr("Daftar / Semak Keahlian →", "Register / Check Membership →")}
          </Link>
        </div>
      </section>

      {statFasa.total > 0 && (
        <StatFasaChart
          data={statFasa.data}
          total={statFasa.total}
          tajuk={tr("Pendaftaran Ahli Kariah Ikut Fasa", "Member Registration by Phase")}
          nota={tr(
            "Bilangan ahli kariah berdaftar mengikut fasa kediaman. Belum daftar? Ayuh sertai kariah anda.",
            "Registered community members by residential phase. Not registered yet? Join your neighbourhood.",
          )}
        />
      )}

      <PrayerTimes zon={zon} />

      {/* Tabung Kutipan Surau — disorok dari umum sehingga diterbitkan (suis admin) */}
      {tabung.length > 0 && paparKewangan && (
        <section>
          {stafKewangan && !kewanganAwam && (
            <div className="mb-2 rounded-lg bg-amber-400/90 px-4 py-2 text-sm font-semibold text-amber-950">
              👁️ PRATONTON STAF — penyata kewangan belum diterbitkan kepada orang ramai. Flip suis di /admin/tetapan bila sedia.
            </div>
          )}
          <h2 className="mb-3 text-xl font-bold text-slate-900">{tr("Kutipan Tabung Surau", "Surau Fund Collections")}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {tabung.map((t) => {
              const belumLancar = t.jenis_khairat && !khDibuka;
              return (
              <div key={t.kategori_id} className="rounded-xl bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900">{t.nama}</h3>
                  {t.jenis_khairat && (
                    <span className="rounded bg-teal-100 px-2 py-0.5 text-xs font-semibold text-teal-700">{tr("Khairat", "Death Benefit")}</span>
                  )}
                </div>
                {belumLancar ? (
                  <div className="mt-3 rounded-lg bg-slate-50 p-4 text-center text-sm font-medium text-slate-500">
                    {tr("Tabung khairat belum dilancarkan.", "The death benefit fund has not been launched yet.")}
                  </div>
                ) : (
                  <>
                    <div className="mt-3">
                      <div className="text-2xl font-bold text-surau">{rm(t.terkini_jumlah)}</div>
                      <div className="text-xs text-slate-500">
                        {tr("Kutipan terkini", "Latest collection")}{t.terkini_tarikh ? ` · ${tarikhMs(t.terkini_tarikh)}` : ` · ${tr("belum ada rekod", "no records yet")}`}
                      </div>
                    </div>
                    <div className="mt-3 flex gap-6 border-t pt-3 text-sm">
                      <div>
                        <div className="font-semibold text-slate-800">{rm(t.jumlah_bulan_ini)}</div>
                        <div className="text-xs text-slate-500">{tr("Bulan ini", "This month")}</div>
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800">{rm(t.jumlah_terkumpul)}</div>
                        <div className="text-xs text-slate-500">{tr("Terkumpul", "Total collected")}</div>
                      </div>
                    </div>
                  </>
                )}
              </div>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-slate-400">
            {tr(
              "Dikemas kini automatik apabila bendahari merekod kutipan. Semoga Allah membalas jariah anda.",
              "Updated automatically when the treasurer records a collection. May Allah reward your charity.",
            )}
          </p>
        </section>
      )}

      {/* Yaasin & Tahlil malam Jumaat */}
      <section className="rounded-xl border-2 border-surau/30 bg-surau/5 p-5">
        <h2 className="font-semibold text-slate-900">{tr("Yaasin & Tahlil · Malam Jumaat", "Yaasin & Tahlil · Thursday Night")}</h2>
        <p className="mt-1 text-sm text-slate-600">
          {tr(
            "Hantar nama arwah ahli keluarga untuk disebut dalam bacaan Yaasin & Tahlil selepas Maghrib.",
            "Submit the names of departed family members to be recited during Yaasin & Tahlil after Maghrib.",
          )}
        </p>
        <Link href="/tahlil" className="mt-3 inline-block rounded-lg bg-surau px-5 py-2.5 text-sm font-semibold text-white hover:bg-surau-dark">
          {tr("Hantar Nama Arwah →", "Submit Names of the Deceased →")}
        </Link>
      </section>

      {/* Program akan datang */}
      {program.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">{tr("Program Akan Datang", "Upcoming Programmes")}</h2>
            <Link href="/program" className="text-sm font-medium text-surau hover:underline">{tr("Lihat semua →", "View all →")}</Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {program.map((p) => (
              <Link key={p.id} href="/program" className="rounded-xl bg-white p-4 shadow-sm hover:shadow">
                {p.kategori && <span className="rounded bg-surau/10 px-2 py-0.5 text-xs font-semibold text-surau">{p.kategori}</span>}
                <div className="mt-2 font-semibold text-slate-900">{p.tajuk}</div>
                <div className="mt-1 text-xs text-slate-500">📅 {tarikhMs(p.tarikh)}{p.masa ? ` · ${p.masa}` : ""}</div>
                {p.lokasi && <div className="text-xs text-slate-500">📍 {p.lokasi}</div>}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-xl font-bold text-slate-900">{tr("Pengumuman", "Announcements")}</h2>
        {pengumuman.length === 0 ? (
          <p className="rounded-lg bg-white p-4 text-sm text-slate-500 shadow-sm">
            {tr("Tiada pengumuman buat masa ini.", "No announcements at this time.")}
          </p>
        ) : (
          <div className="space-y-3">
            {pengumuman.map((p) => (
              <article
                key={p.id}
                className={`rounded-lg border-l-4 bg-white p-4 shadow-sm ${
                  p.penting ? "border-amber-500" : "border-surau"
                }`}
              >
                <div className="flex items-center gap-2">
                  {p.penting && (
                    <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                      {tr("Penting", "Important")}
                    </span>
                  )}
                  <h3 className="font-semibold text-slate-900">{p.tajuk}</h3>
                </div>
                <p className="mt-1 text-sm text-slate-600">{p.kandungan}</p>
              </article>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
