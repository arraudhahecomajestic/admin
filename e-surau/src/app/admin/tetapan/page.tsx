import { getProfil, isMaster } from "@/lib/sesi";
import { PerluMasuk, TiadaAkses } from "@/components/PerluMasuk";
import { adminConfigured } from "@/lib/supabaseAdmin";
import AdminNav from "@/components/AdminNav";
import ButangHantar from "@/components/ButangHantar";
import { bacaTetapan } from "@/lib/tetapanSistem";
import { setTetapan } from "./actions";

export const dynamic = "force-dynamic";

export default async function TetapanPage() {
  if (!adminConfigured) return <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Supabase belum dikonfigurasi.</div>;
  const profil = await getProfil();
  if (!profil) return <PerluMasuk />;
  if (!isMaster(profil)) return <TiadaAkses />;

  const t = await bacaTetapan();
  const khairatOn = t.khairat_dibuka === "true";
  const pampasan = t.pampasan_khairat || "1200";

  return (
    <div className="space-y-6">
      <AdminNav aktif="/admin/tetapan" nama={profil.nama ?? profil.emel ?? undefined} peranan={profil.peranan} master={profil.master} />
      <h1 className="text-2xl font-bold text-slate-900">Tetapan Sistem</h1>

      {/* Suis Khairat */}
      <section className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-900">Kempen Khairat Kematian</h2>
        <p className="mt-1 text-sm text-slate-600">
          Bila <b>DIBUKA</b>, banner kempen di laman utama, bahagian khairat di Portal Ahli, dan pembelian pakej khairat akan aktif untuk umum.
        </p>
        <div className="mt-3 flex items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${khairatOn ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"}`}>
            Status sekarang: {khairatOn ? "DIBUKA (Live)" : "DITUTUP (rahsia)"}
          </span>
        </div>
        <form action={setTetapan} className="mt-3">
          <input type="hidden" name="kunci" value="khairat_dibuka" />
          <input type="hidden" name="nilai" value={khairatOn ? "false" : "true"} />
          <ButangHantar
            className={`rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60 ${khairatOn ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}
            pendingText="Menukar…"
          >
            {khairatOn ? "Tutup Kempen Khairat" : "Buka / Lancarkan Kempen Khairat"}
          </ButangHantar>
        </form>
      </section>

      {/* Pampasan */}
      <section className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-900">Jumlah Pampasan Khairat</h2>
        <p className="mt-1 text-sm text-slate-600">Pampasan tetap setiap kematian dilindungi (dipapar dalam kempen & maklumat).</p>
        <form action={setTetapan} className="mt-3 flex items-end gap-2">
          <input type="hidden" name="kunci" value="pampasan_khairat" />
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Jumlah (RM)</span>
            <input name="nilai" type="number" min="0" defaultValue={pampasan} className="w-40 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <ButangHantar className="rounded-lg bg-surau px-5 py-2.5 text-sm font-semibold text-white hover:bg-surau-dark disabled:opacity-60" pendingText="Menyimpan…">Simpan</ButangHantar>
        </form>
      </section>
    </div>
  );
}
