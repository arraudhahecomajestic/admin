import Link from "next/link";
import PrayerTimes from "@/components/PrayerTimes";
import { supabase, supabaseConfigured } from "@/lib/supabaseClient";
import { NAMA_SURAU, ZON_SOLAT, KHAIRAT_DIBUKA } from "@/lib/tetapan";
import { rm, tarikhMs } from "@/lib/format";

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

export default async function Home() {
  const zon = ZON_SOLAT;
  const namaSurau = NAMA_SURAU;
  const [pengumuman, tabung, program] = await Promise.all([ambilPengumuman(), ambilTabung(), ambilProgram()]);

  return (
    <div className="space-y-8">
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">
          Selamat datang ke {namaSurau}
        </h1>
        <p className="mt-2 text-slate-600">
          Portal rasmi kariah — daftar ahli, sertai khairat kematian, dan ikuti
          program surau.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {/* Ahli baharu */}
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="text-sm font-semibold text-slate-900">Ahli baharu?</div>
            <p className="mt-1 text-sm text-slate-500">
              Belum pernah daftar sebagai ahli kariah. Isi borang pendaftaran penuh.
            </p>
            <Link
              href="/daftar"
              className="mt-3 inline-block rounded-lg bg-surau px-5 py-2.5 text-sm font-semibold text-white hover:bg-surau-dark"
            >
              Daftar Ahli Kariah →
            </Link>
          </div>

          {/* Ahli sedia ada */}
          <div className="rounded-xl border-2 border-surau/30 bg-surau/5 p-4">
            <div className="text-sm font-semibold text-slate-900">Sudah ahli kariah?</div>
            <p className="mt-1 text-sm text-slate-600">
              Akaun anda <b>sudah didaftarkan</b>. Log masuk untuk kemas kini maklumat anda.
            </p>
            <Link
              href="/masuk"
              className="mt-3 inline-block rounded-lg bg-hitam px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              Log Masuk & Kemas Kini →
            </Link>
            <p className="mt-2 text-xs text-slate-500">
              Kata laluan kali pertama = <b>No. Kad Pengenalan anda</b> (tanpa sengkang).
            </p>
          </div>
        </div>
      </section>

      <PrayerTimes zon={zon} />

      {/* Tabung Kutipan Surau */}
      {tabung.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-bold text-slate-900">Kutipan Tabung Surau</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {tabung.map((t) => {
              const belumLancar = t.jenis_khairat && !KHAIRAT_DIBUKA;
              return (
              <div key={t.kategori_id} className="rounded-xl bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900">{t.nama}</h3>
                  {t.jenis_khairat && (
                    <span className="rounded bg-teal-100 px-2 py-0.5 text-xs font-semibold text-teal-700">Khairat</span>
                  )}
                </div>
                {belumLancar ? (
                  <div className="mt-3 rounded-lg bg-slate-50 p-4 text-center text-sm font-medium text-slate-500">
                    Tabung khairat belum dilancarkan.
                  </div>
                ) : (
                  <>
                    <div className="mt-3">
                      <div className="text-2xl font-bold text-surau">{rm(t.terkini_jumlah)}</div>
                      <div className="text-xs text-slate-500">
                        Kutipan terkini{t.terkini_tarikh ? ` · ${tarikhMs(t.terkini_tarikh)}` : " · belum ada rekod"}
                      </div>
                    </div>
                    <div className="mt-3 flex gap-6 border-t pt-3 text-sm">
                      <div>
                        <div className="font-semibold text-slate-800">{rm(t.jumlah_bulan_ini)}</div>
                        <div className="text-xs text-slate-500">Bulan ini</div>
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800">{rm(t.jumlah_terkumpul)}</div>
                        <div className="text-xs text-slate-500">Terkumpul</div>
                      </div>
                    </div>
                  </>
                )}
              </div>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Dikemas kini automatik apabila bendahari merekod kutipan. Semoga Allah membalas jariah anda.
          </p>
        </section>
      )}

      {/* Program akan datang */}
      {program.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Program Akan Datang</h2>
            <Link href="/program" className="text-sm font-medium text-surau hover:underline">Lihat semua →</Link>
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
        <h2 className="mb-3 text-xl font-bold text-slate-900">Pengumuman</h2>
        {pengumuman.length === 0 ? (
          <p className="rounded-lg bg-white p-4 text-sm text-slate-500 shadow-sm">
            Tiada pengumuman buat masa ini.
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
                      Penting
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
