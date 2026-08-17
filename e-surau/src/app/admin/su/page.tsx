import { getProfil, isAdmin } from "@/lib/sesi";
import { PerluMasuk, TiadaAkses } from "@/components/PerluMasuk";
import { createAdminClient, adminConfigured } from "@/lib/supabaseAdmin";
import AdminNav from "@/components/AdminNav";
import SuTugasan from "@/components/SuTugasan";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Kad = { href: string; tajuk: string; nota: string; lencana?: number };

export default async function PanelSetiausahaPage() {
  const profil = await getProfil();
  if (!profil) return <PerluMasuk />;
  if (!isAdmin(profil)) return <TiadaAkses />;
  if (!adminConfigured)
    return <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Supabase belum dikonfigurasi.</div>;

  const db = createAdminClient();
  const hariIni = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" });
  const c = (q: any) => q.then((r: any) => r.count ?? 0);

  const [
    jumlahAhli, permohonanBaru, programAkanDatang, maklumBaru, mesyuaratBelum, penilaianMenunggu, tenderAktif, tugasanData,
  ] = await Promise.all([
    c(db.from("ahli_kariah").select("id", { count: "exact", head: true }).eq("status", "lulus")),
    c(db.from("ahli_kariah").select("id", { count: "exact", head: true }).not("status", "in", "(lulus,tolak)")),
    c(db.from("program").select("id", { count: "exact", head: true }).gte("tarikh", hariIni)),
    c(db.from("maklum_balas").select("id", { count: "exact", head: true }).eq("status", "baru")),
    c(db.from("mesyuarat").select("id", { count: "exact", head: true }).neq("status", "selesai")),
    c(db.from("staf_penilaian").select("id", { count: "exact", head: true }).neq("status", "disahkan")),
    c(db.from("tender").select("id", { count: "exact", head: true }).eq("status", "aktif")),
    db.from("su_tugasan").select("id, tajuk, catatan, tarikh_tamat, siap").order("siap", { ascending: true }).order("tarikh_tamat", { ascending: true, nullsFirst: false }).order("dicipta", { ascending: false }),
  ]);
  const tugasan = (tugasanData?.data as any[]) ?? [];

  const stat = [
    { label: "Ahli kariah (sah)", nilai: jumlahAhli, href: "/admin/ahli", warna: "text-surau-dark" },
    { label: "Permohonan perlu perhatian", nilai: permohonanBaru, href: "/admin", warna: "text-amber-600" },
    { label: "Program akan datang", nilai: programAkanDatang, href: "/admin/program", warna: "text-indigo-600" },
    { label: "Maklum balas baru", nilai: maklumBaru, href: "/admin/maklum-balas", warna: "text-rose-600" },
    { label: "Mesyuarat belum selesai", nilai: mesyuaratBelum, href: "/admin/su/mesyuarat", warna: "text-slate-700" },
    { label: "Penilaian menunggu sah", nilai: penilaianMenunggu, href: "/admin/staf/penilaian", warna: "text-green-700" },
  ];

  const KUMPULAN: { tajuk: string; kad: Kad[] }[] = [
    { tajuk: "Pentadbiran", kad: [
      { href: "/admin/su/mesyuarat", tajuk: "Minit Mesyuarat", nota: "Agenda, minit & jejak tindakan AJK", lencana: mesyuaratBelum },
      { href: "/admin/su/surat", tajuk: "Surat Rasmi & Daftar", nota: "Karang surat keluar, rekod surat masuk" },
      { href: "/admin/tender", tajuk: "Tender & Iklan", nota: "Hebahan tender — kariah tengok, kongsi & nyata minat", lencana: tenderAktif },
      { href: "/admin/pengumuman", tajuk: "Pengumuman", nota: "Tulis pengumuman untuk halaman utama" },
      { href: "/admin/maklum-balas", tajuk: "Maklum Balas", nota: "Komplen & cadangan dari kariah", lencana: maklumBaru },
      { href: "/admin/kandungan", tajuk: "Carta & Visi/Misi", nota: "Kemas kini AJK, visi, misi, buletin" },
    ]},
    { tajuk: "Ahli & Kariah", kad: [
      { href: "/admin", tajuk: "Permohonan Keahlian", nota: "Sokong & luluskan pendaftaran baru", lencana: permohonanBaru },
      { href: "/admin/ahli", tajuk: "Rekod Ahli Kariah", nota: "Jejak & urus data keahlian" },
      { href: "/admin/kariah-kawasan", tajuk: "Ahli Ikut Kawasan", nota: "Statistik pendaftaran ikut fasa" },
      { href: "/admin/cetak", tajuk: "Cetak Borang", nota: "Jana borang & dokumen keahlian" },
    ]},
    { tajuk: "Program & Aktiviti", kad: [
      { href: "/admin/program", tajuk: "Program & Aktiviti", nota: "Urus takwim & program surau", lencana: programAkanDatang },
      { href: "/admin/tahlil", tajuk: "Tahlil", nota: "Senarai & jadual tahlil" },
      { href: "/admin/sewaan", tajuk: "Sewaan Dewan", nota: "Tempahan & rekod sewaan" },
    ]},
    { tajuk: "Pengurusan Staf", kad: [
      { href: "/admin/staf", tajuk: "Portal Staf", nota: "Kehadiran, tugasan & laporan staf" },
      { href: "/admin/staf/penilaian", tajuk: "Penilaian Prestasi", nota: "Nilai KPI staf (panel purata)", lencana: penilaianMenunggu },
      { href: "/admin/staf/gaji", tajuk: "Gaji & Kenaikan", nota: "Slip gaji & kenaikan berasas KPI" },
      { href: "/admin/staf/wi", tajuk: "Arahan Kerja (WI)", nota: "Piawaian kerja staf" },
      { href: "/admin/staf/dokumen", tajuk: "Dokumen Staf", nota: "Surat tawaran, WI, slip, KP" },
    ]},
    { tajuk: "Kewangan", kad: [
      { href: "/admin/kewangan", tajuk: "Kewangan", nota: "Kutipan, belanja & baucer" },
      { href: "/admin/tuntutan", tajuk: "Tuntutan", nota: "Tuntutan vendor & dalaman" },
      { href: "/admin/khairat", tajuk: "Khairat Kematian", nota: "Ahli khairat & sumbangan" },
    ]},
  ];

  return (
    <div className="space-y-6">
      <AdminNav aktif="/admin/su" nama={profil.nama ?? profil.emel ?? undefined} peranan={profil.peranan} master={profil.master} />
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Panel Setiausaha</h1>
        <p className="mt-1 text-sm text-slate-600">Pusat tugas pentadbiran surau — ringkasan, tugasan, mesyuarat, surat, rekod &amp; staf.</p>
      </div>

      {/* Dashboard ringkasan hidup */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stat.map((s) => (
          <Link key={s.href + s.label} href={s.href} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-surau hover:shadow">
            <div className={`text-2xl font-bold ${s.warna}`}>{s.nilai}</div>
            <div className="mt-1 text-xs font-medium leading-tight text-slate-500">{s.label}</div>
          </Link>
        ))}
      </div>

      {/* Tugasan SU */}
      <SuTugasan awal={tugasan} hariIni={hariIni} />

      {/* Kad modul ikut kategori */}
      {KUMPULAN.map((g) => (
        <div key={g.tajuk}>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-400">{g.tajuk}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {g.kad.map((k) => (
              <Link key={k.href} href={k.href} className="group relative rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-surau hover:shadow">
                {!!k.lencana && k.lencana > 0 && (
                  <span className="absolute right-3 top-3 rounded-full bg-surau px-2 py-0.5 text-xs font-bold text-white">{k.lencana}</span>
                )}
                <div className="font-semibold text-slate-900 group-hover:text-surau">{k.tajuk}</div>
                <div className="mt-1 text-sm text-slate-500">{k.nota}</div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
