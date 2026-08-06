import { getProfil, isPentadbir, isMaster, isAdmin } from "@/lib/sesi";
import { PerluMasuk, TiadaAkses } from "@/components/PerluMasuk";
import AdminNav from "@/components/AdminNav";
import Link from "next/link";

export const dynamic = "force-dynamic";

const KAD = [
  { href: "/admin/su/mesyuarat", ikon: "", tajuk: "Minit Mesyuarat", nota: "Agenda, minit, jejak tindakan AJK" },
  { href: "/admin/su/surat", ikon: "", tajuk: "Surat Rasmi & Daftar", nota: "Karang surat keluar, rekod surat masuk" },
  { href: "/admin/pengumuman", ikon: "", tajuk: "Pengumuman", nota: "Tulis pengumuman untuk halaman utama" },
  { href: "/admin/maklum-balas", ikon: "", tajuk: "Maklum Balas", nota: "Komplen & cadangan dari kariah" },
  { href: "/admin/kandungan", ikon: "", tajuk: "Carta & Visi/Misi", nota: "Kemas kini AJK, visi, misi, buletin" },
  { href: "/admin/ahli", ikon: "", tajuk: "Rekod Ahli Kariah", nota: "Jejak & urus data keahlian" },
  { href: "/admin/kariah-kawasan", ikon: "", tajuk: "Ahli Ikut Kawasan", nota: "Statistik pendaftaran ikut fasa" },
  { href: "/admin/program", ikon: "", tajuk: "Program & Aktiviti", nota: "Urus takwim & program surau" },
];

export default async function PanelSetiausahaPage() {
  const profil = await getProfil();
  if (!profil) return <PerluMasuk />;
  if (!isAdmin(profil)) return <TiadaAkses />;

  return (
    <div className="space-y-6">
      <AdminNav aktif="/admin/su" nama={profil.nama ?? profil.emel ?? undefined} peranan={profil.peranan} master={profil.master} />
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Panel Setiausaha</h1>
        <p className="mt-1 text-sm text-slate-600">Pusat tugas pentadbiran surau — mesyuarat, surat, rekod &amp; laporan.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {KAD.map((k) => (
          <Link key={k.href} href={k.href} className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-surau hover:shadow">
            <div className="font-semibold text-slate-900 group-hover:text-surau">{k.tajuk}</div>
            <div className="mt-1 text-sm text-slate-500">{k.nota}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
