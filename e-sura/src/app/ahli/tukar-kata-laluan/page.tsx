"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function TukarKataLaluanPage() {
  const router = useRouter();
  const [kl, setKl] = useState("");
  const [kl2, setKl2] = useState("");
  const [sedang, setSedang] = useState(false);
  const [msg, setMsg] = useState<null | { ok: boolean; text: string }>(null);

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (kl.length < 6) {
      setMsg({ ok: false, text: "Kata laluan mesti sekurang-kurangnya 6 aksara." });
      return;
    }
    if (kl !== kl2) {
      setMsg({ ok: false, text: "Kata laluan tidak sama. Sila semak semula." });
      return;
    }
    setSedang(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: kl });
    setSedang(false);
    if (error) {
      setMsg({ ok: false, text: error.message });
      return;
    }
    setMsg({ ok: true, text: "Kata laluan berjaya ditukar." });
    setKl("");
    setKl2("");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-sm">
      <Link href="/ahli" className="text-sm text-slate-500 hover:underline">← Kembali ke Portal</Link>
      <div className="mt-2 rounded-xl bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">Tukar Kata Laluan</h1>
        <p className="mt-1 text-sm text-slate-600">
          Disarankan tukar dari kata laluan default (No. IC) kepada kata laluan
          peribadi anda.
        </p>

        <form onSubmit={simpan} className="mt-4 space-y-3">
          {msg && (
            <div
              className={`rounded-lg border p-2 text-sm ${
                msg.ok
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {msg.text}
            </div>
          )}
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Kata Laluan Baru</span>
            <input
              type="password"
              value={kl}
              onChange={(e) => setKl(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-surau"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Sahkan Kata Laluan Baru</span>
            <input
              type="password"
              value={kl2}
              onChange={(e) => setKl2(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-surau"
            />
          </label>
          <button
            disabled={sedang}
            className="w-full rounded-lg bg-surau px-4 py-2 font-semibold text-white hover:bg-surau-dark disabled:opacity-60"
          >
            {sedang ? "Menyimpan…" : "Tukar Kata Laluan"}
          </button>
        </form>
      </div>
    </div>
  );
}
