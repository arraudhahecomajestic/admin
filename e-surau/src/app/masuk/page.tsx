"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

async function destIkutPeranan(supabase: any): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return "";
  const { data: prof } = await supabase.from("profil").select("peranan").eq("id", user.id).single();
  if (prof?.peranan === "bendahari") return "/admin/kewangan";
  if (prof?.peranan === "imam") return "/admin/tahlil";
  if (prof && ["admin", "ajk"].includes(prof.peranan)) return "/admin";
  return "/ahli";
}

export default function MasukPage() {
  const router = useRouter();
  const [emel, setEmel] = useState("");
  const [kataLaluan, setKataLaluan] = useState("");
  const [ralat, setRalat] = useState("");
  const [sedang, setSedang] = useState(false);
  const [semakSesi, setSemakSesi] = useState(true);

  // Jika sudah log masuk, terus hantar ke ruang mengikut peranan.
  useEffect(() => {
    let batal = false;
    (async () => {
      try {
        const supabase = createClient();
        const dest = await destIkutPeranan(supabase);
        if (batal) return;
        if (dest) { router.replace(dest); router.refresh(); return; }
      } catch { /* abaikan — tunjuk borang login */ }
      if (!batal) setSemakSesi(false);
    })();
    // Fallback: jangan sekali-kali tersangkut lebih 4 saat
    const t = setTimeout(() => { if (!batal) setSemakSesi(false); }, 4000);
    return () => { batal = true; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function masuk(e: React.FormEvent) {
    e.preventDefault();
    setRalat("");
    setSedang(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: emel,
      password: kataLaluan,
    });
    if (error) {
      setSedang(false);
      setRalat("Emel atau kata laluan salah.");
      return;
    }
    // Redirect ikut peranan: staf → /admin, ahli → /ahli
    const dest = (await destIkutPeranan(supabase)) || "/ahli";
    setSedang(false);
    router.push(dest);
    router.refresh();
  }

  if (semakSesi) {
    return <div className="mx-auto max-w-sm py-16 text-center text-sm text-slate-400">Menyemak sesi…</div>;
  }

  return (
    <div className="mx-auto max-w-sm">
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">Log Masuk</h1>
        <p className="mt-1 text-sm text-slate-600">
          Untuk ahli kariah, AJK, bendahari & admin surau.
        </p>
        <div className="mt-3 rounded-lg border border-surau/30 bg-surau/5 p-3 text-xs text-slate-600">
          <b>Ahli sedia ada:</b> guna emel anda, kata laluan = <b>No. Kad Pengenalan</b> anda
          (tanpa sengkang). Sila tukar kata laluan selepas log masuk.
        </div>

        <form onSubmit={masuk} className="mt-4 space-y-3">
          {ralat && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-700">
              {ralat}
            </div>
          )}
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Emel</span>
            <input
              type="email"
              required
              value={emel}
              onChange={(e) => setEmel(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-surau"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Kata Laluan</span>
            <input
              type="password"
              required
              value={kataLaluan}
              onChange={(e) => setKataLaluan(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-surau"
            />
          </label>
          <button
            disabled={sedang}
            className="w-full rounded-lg bg-surau px-4 py-2 font-semibold text-white hover:bg-surau-dark disabled:opacity-60"
          >
            {sedang ? "Sedang masuk…" : "Log Masuk"}
          </button>
        </form>
      </div>
      <p className="mt-4 text-center text-sm text-slate-500">
        <Link href="/lupa-kata-laluan" className="font-medium text-surau hover:underline">Lupa kata laluan?</Link>
      </p>
      <p className="mt-2 text-center text-sm text-slate-500">
        Belum ada akaun / ahli baharu?{" "}
        <Link href="/daftar" className="font-medium text-surau hover:underline">Daftar di sini</Link>
      </p>
      <p className="mt-2 text-center text-sm text-slate-500">
        <Link href="/" className="hover:underline">← Kembali ke laman utama</Link>
      </p>
    </div>
  );
}
