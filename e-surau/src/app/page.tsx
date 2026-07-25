import Link from "next/link";
import PrayerTimes from "@/components/PrayerTimes";
import { supabase, supabaseConfigured } from "@/lib/supabaseClient";
import { NAMA_SURAU, ZON_SOLAT } from "@/lib/tetapan";

export const dynamic = "force-dynamic";

type Pengumuman = {
  id: string;
  tajuk: string;
  kandungan: string;
  penting: boolean;
  tarikh: string;
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

export default async function Home() {
  const zon = ZON_SOLAT;
  const namaSurau = NAMA_SURAU;
  const pengumuman = await ambilPengumuman();

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
