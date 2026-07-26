import { getProfil, isPentadbir } from "@/lib/sesi";
import { PerluMasuk, TiadaAkses } from "@/components/PerluMasuk";
import { createAdminClient, adminConfigured } from "@/lib/supabaseAdmin";
import AdminNav from "@/components/AdminNav";
import ButangHantar from "@/components/ButangHantar";
import PenajaStrip from "@/components/PenajaStrip";
import { PENAJA_DIPAPAR } from "@/lib/tetapan";
import { tarikhMs } from "@/lib/format";
import { tambahPenaja, togglePenaja, padamPenaja } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminPenajaPage() {
  if (!adminConfigured) return <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Supabase belum dikonfigurasi.</div>;
  const profil = await getProfil();
  if (!profil) return <PerluMasuk />;
  if (!isPentadbir(profil)) return <TiadaAkses />;

  const db = createAdminClient();
  const { data } = await db.from("penaja").select("*").order("susunan").order("dicipta", { ascending: false });
  const penaja = (data as any[]) ?? [];
  const aktifBil = penaja.filter((p) => p.aktif).length;

  return (
    <div className="space-y-6">
      <AdminNav aktif="/admin/penaja" nama={profil.nama ?? profil.emel ?? undefined} peranan={profil.peranan} master={profil.master} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-slate-900">Penaja / Ruang Iklan</h1>
        <span className="rounded-lg bg-surau/10 px-3 py-1 text-sm font-semibold text-surau">{aktifBil} penaja aktif</span>
      </div>

      {/* Pratonton — macam mana ia nampak di laman utama */}
      <div>
        <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
          <span className="font-medium">Pratonton (logo berjalan)</span>
          <span className={`rounded px-2 py-0.5 text-xs font-semibold ${PENAJA_DIPAPAR ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
            {PENAJA_DIPAPAR ? "Dipapar di laman utama" : "Belum dipapar (rahsia)"}
          </span>
        </div>
        <PenajaStrip pratonton />
        {!PENAJA_DIPAPAR && <p className="mt-1 text-xs text-slate-400">Bahagian ini belum kelihatan kepada orang awam. Bagitau saya bila nak buka.</p>}
      </div>

      <section className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-semibold text-slate-900">Tambah Penaja</h2>
        <form action={tambahPenaja} className="grid gap-3 sm:grid-cols-2">
          <input name="nama" required placeholder="Nama penaja / syarikat *" className="inp sm:col-span-2" />
          <input name="pautan" placeholder="Pautan laman web (https://…)" className="inp" />
          <input name="kategori" placeholder="Kategori (cth: Makanan, Kedai)" className="inp" />
          <input name="keterangan" placeholder="Keterangan ringkas" className="inp sm:col-span-2" />
          <label className="text-sm text-slate-600">Tarikh Mula<input name="tarikh_mula" type="date" className="inp" /></label>
          <label className="text-sm text-slate-600">Tarikh Tamat Langganan<input name="tarikh_tamat" type="date" className="inp" /></label>
          <label className="text-sm text-slate-600 sm:col-span-2">Logo penaja (gambar)
            <input name="logo" type="file" accept="image/*" className="inp" />
          </label>
          <input name="susunan" type="number" placeholder="Susunan (kecil = atas)" className="inp" />
          <div className="sm:col-span-2">
            <ButangHantar className="rounded-lg bg-surau px-5 py-2.5 text-sm font-semibold text-white hover:bg-surau-dark disabled:opacity-60" pendingText="Menyimpan…">Simpan Penaja</ButangHantar>
          </div>
        </form>
      </section>

      <section className="rounded-xl bg-white shadow-sm">
        <h2 className="border-b px-5 py-3 font-semibold text-slate-900">Senarai Penaja</h2>
        <div className="divide-y">
          {penaja.length === 0 && <p className="px-5 py-6 text-center text-slate-400">Tiada penaja lagi.</p>}
          {penaja.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {p.logo_url ? <img src={p.logo_url} alt={p.nama} className="h-10 w-auto max-w-[80px] rounded border object-contain" /> : <div className="flex h-10 w-14 items-center justify-center rounded border bg-slate-50 text-xs text-slate-400">Tiada</div>}
                <div>
                  <div className="font-medium text-slate-900">{p.nama} {!p.aktif && <span className="ml-1 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">Tidak aktif</span>}</div>
                  <div className="text-xs text-slate-500">{p.kategori || "—"}{p.tarikh_tamat ? ` · Tamat: ${tarikhMs(p.tarikh_tamat)}` : ""}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <form action={togglePenaja}><input type="hidden" name="id" value={p.id} /><input type="hidden" name="aktif" value={String(p.aktif)} /><ButangHantar className="text-xs font-semibold text-surau hover:underline" pendingText="…">{p.aktif ? "Nyahaktif" : "Aktifkan"}</ButangHantar></form>
                <form action={padamPenaja}><input type="hidden" name="id" value={p.id} /><ButangHantar className="text-xs font-semibold text-red-600 hover:underline" pendingText="…">Padam</ButangHantar></form>
              </div>
            </div>
          ))}
        </div>
      </section>

      <style>{`.inp{width:100%;border-radius:.5rem;border:1px solid #cbd5e1;padding:.5rem .75rem;font-size:.875rem;outline:none;margin-top:.25rem}.inp:focus{border-color:#b8860b;box-shadow:0 0 0 2px rgba(184,134,11,.2)}`}</style>
    </div>
  );
}
