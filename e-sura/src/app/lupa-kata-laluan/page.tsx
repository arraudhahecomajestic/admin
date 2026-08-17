"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LupaKataLaluanPage() {
  const [emel, setEmel] = useState("");
  const [sedang, setSedang] = useState(false);
  const [msg, setMsg] = useState<null | { ok: boolean; text: string }>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setSedang(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(emel, {
      redirectTo: typeof window !== "undefined" ? `${window.location.origin}/set-kata-laluan` : undefined,
    });
    setSedang(false);
    if (error) { setMsg({ ok: false, text: error.message }); return; }
    setMsg({ ok: true, text: "Pautan set semula kata laluan telah dihantar ke emel anda. Sila semak emel (termasuk folder Spam)." });
  }

  return (
    <div className="mx-auto max-w-sm">
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">Lupa Kata Laluan</h1>
        <p className="mt-1 text-sm text-slate-600">Masukkan emel akaun anda. Kami akan hantar pautan untuk set semula kata laluan.</p>

        <form onSubmit={submit} className="mt-4 space-y-3">
          {msg && (
            <div className={`rounded-lg border p-2 text-sm ${msg.ok ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"}`}>{msg.text}</div>
          )}
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Emel</span>
            <input type="email" required value={emel} onChange={(e) => setEmel(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-surau" />
          </label>
          <button disabled={sedang} className="w-full rounded-lg bg-surau px-4 py-2 font-semibold text-white hover:bg-surau-dark disabled:opacity-60">
            {sedang ? "Menghantar…" : "Hantar Pautan Set Semula"}
          </button>
        </form>
      </div>
      <p className="mt-4 text-center text-sm text-slate-500">
        <Link href="/masuk" className="hover:underline">← Kembali ke Log Masuk</Link>
      </p>
    </div>
  );
}
