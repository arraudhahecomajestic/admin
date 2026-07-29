import { getProfil, isPentadbir, isMaster } from "@/lib/sesi";
import { PerluMasuk, TiadaAkses } from "@/components/PerluMasuk";
import { createAdminClient, adminConfigured } from "@/lib/supabaseAdmin";
import AdminNav from "@/components/AdminNav";
import KandunganAdmin from "@/components/KandunganAdmin";

export const dynamic = "force-dynamic";

export default async function AdminKandunganPage() {
  if (!adminConfigured)
    return <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Supabase belum dikonfigurasi.</div>;
  const profil = await getProfil();
  if (!profil) return <PerluMasuk />;
  if (!(isPentadbir(profil) || isMaster(profil))) return <TiadaAkses />;

  const db = createAdminClient();
  const [{ data: kv }, { data: carta }, { data: buletin }] = await Promise.all([
    db.from("kandungan_surau").select("kunci, nilai"),
    db.from("carta_organisasi").select("id, jawatan, nama, gambar_url, susunan").order("susunan"),
    db.from("buletin").select("id, tajuk, keterangan, url_fail, jenis_fail, tarikh, diterbitkan").order("tarikh", { ascending: false }),
  ]);
  const map: Record<string, string> = {};
  for (const r of (kv as any[]) ?? []) map[r.kunci] = r.nilai ?? "";

  return (
    <div className="space-y-6">
      <AdminNav aktif="/admin/kandungan" nama={profil.nama ?? profil.emel ?? undefined} peranan={profil.peranan} master={profil.master} />
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Kandungan Surau</h1>
        <p className="mt-1 text-sm text-slate-600">Isi di sini → terus tukar di halaman <a href="/tentang" target="_blank" className="text-surau underline">Tentang Surau</a>.</p>
      </div>
      <KandunganAdmin
        visi={map.visi ?? ""}
        misi={map.misi ?? ""}
        carta={((carta as any[]) ?? [])}
        buletin={((buletin as any[]) ?? [])}
      />
    </div>
  );
}
