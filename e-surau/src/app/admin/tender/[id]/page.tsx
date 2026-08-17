import Link from "next/link";
import { getProfil, isAdmin } from "@/lib/sesi";
import { PerluMasuk, TiadaAkses } from "@/components/PerluMasuk";
import { createAdminClient, adminConfigured } from "@/lib/supabaseAdmin";
import AdminNav from "@/components/AdminNav";
import TenderForm from "@/components/TenderForm";
import { TenderKawalan, PadamMinatButton } from "@/components/TenderKawalan";
import { tarikhMs } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminTenderDetail({ params }: { params: { id: string } }) {
  if (!adminConfigured) return <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Supabase belum dikonfigurasi.</div>;
  const profil = await getProfil();
  if (!profil) return <PerluMasuk />;
  if (!isAdmin(profil)) return <TiadaAkses />;

  const db = createAdminClient();
  const [{ data: t }, { data: minatData }] = await Promise.all([
    db.from("tender").select("*").eq("id", params.id).maybeSingle(),
    db.from("tender_minat").select("*").eq("tender_id", params.id).order("dicipta", { ascending: false }),
  ]);
  if (!t) return <div className="rounded-lg border p-4 text-sm">Tender tidak dijumpai.</div>;

  const minat = await Promise.all(((minatData as any[]) ?? []).map(async (m) => {
    let url: string | null = null;
    if (m.url_dokumen) {
      const rel = String(m.url_dokumen).replace(/^salinan-kp\//, "");
      const { data } = await db.storage.from("salinan-kp").createSignedUrl(rel, 3600);
      url = data?.signedUrl ?? null;
    }
    return { ...m, signedUrl: url };
  }));

  return (
    <div className="space-y-6">
      <AdminNav aktif="/admin/tender" nama={profil.nama ?? profil.emel ?? undefined} peranan={profil.peranan} master={profil.master} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href="/admin/tender" className="text-sm text-surau hover:underline">← Senarai Tender</Link>
        <TenderKawalan id={(t as any).id} status={(t as any).status} />
      </div>

      <section className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-semibold text-slate-900">Butiran Tender</h2>
        <TenderForm awal={t} />
      </section>

      <section className="rounded-xl bg-white shadow-sm">
        <h2 className="border-b px-5 py-3 font-semibold text-slate-900">Senarai Minat / Sebut Harga ({minat.length})</h2>
        <div className="divide-y">
          {minat.length === 0 && <p className="px-5 py-6 text-center text-slate-400">Belum ada yang menyatakan minat.</p>}
          {minat.map((m: any) => (
            <div key={m.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-900">{m.nama}</span>
                  {m.syarikat && <span className="text-sm text-slate-500">· {m.syarikat}</span>}
                  {m.harga_tawaran != null && <span className="rounded bg-surau/10 px-2 py-0.5 text-xs font-semibold text-surau">RM{Number(m.harga_tawaran).toLocaleString()}</span>}
                </div>
                <div className="mt-0.5 text-xs text-slate-500">
                  {m.telefon ? `Tel: ${m.telefon}` : ""}{m.telefon && m.emel ? " · " : ""}{m.emel ? `E-mel: ${m.emel}` : ""} · {tarikhMs(m.dicipta)}
                </div>
                {m.catatan && <div className="mt-1 text-sm text-slate-600">{m.catatan}</div>}
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {m.signedUrl && <a href={m.signedUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-surau hover:underline">Dokumen →</a>}
                <PadamMinatButton id={m.id} tenderId={(t as any).id} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
