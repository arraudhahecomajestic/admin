"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SetKataLaluanPage() {
  const [kl, setKl] = useState("");
  const [kl2, setKl2] = useState("");
  const [sedang, setSedang] = useState(false);
  const [sesiOk, setSesiOk] = useState(false);
  const [msg, setMsg] = useState<null | { ok: boolean; text: string }>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      try {
        const url = new URL(window.location.href);
        const qp = url.searchParams;
        const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
        const token_hash = qp.get("token_hash");
        const type = qp.get("type");
        const code = qp.get("code");
        // 1) Aliran token_hash (paling mantap — berfungsi merentas pelayar/in-app browser)
        if (token_hash && type) {
          const { error } = await supabase.auth.verifyOtp({ token_hash, type: type as any });
          if (!error) setSesiOk(true);
        }
        // 2) Aliran PKCE (?code=) — bila dibuka dalam pelayar sama
        else if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error) setSesiOk(true);
        }
        // 3) Aliran implisit (#access_token) — pustaka auto-set; sahkan di bawah
        else if (hash.get("access_token")) {
          // ditangani oleh detectSessionInUrl
        }
      } catch { /* abai */ }
      const { data } = await supabase.auth.getSession();
      if (data.session) setSesiOk(true);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setSesiOk(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (kl.length < 6) { setMsg({ ok: false, text: "Kata laluan mesti sekurang-kurangnya 6 aksara." }); return; }
    if (kl !== kl2) { setMsg({ ok: false, text: "Kata laluan tidak sama." }); return; }
    setSedang(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: kl });
    setSedang(false);
    if (error) { setMsg({ ok: false, text: error.message }); return; }
    setMsg({ ok: true, text: "Kata laluan berjaya ditukar. Sila log masuk dengan kata laluan baru." });
    setKl(""); setKl2("");
  }

  return (
    <div className="mx-auto max-w-sm">
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">Set Kata Laluan Baru</h1>
        {!sesiOk && !msg?.ok && (
          <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-sm text-amber-800">
            Sila buka halaman ini melalui pautan dalam emel set semula. Jika belum, mohon pautan baru di halaman Lupa Kata Laluan.
          </p>
        )}
        <form onSubmit={submit} className="mt-4 space-y-3">
          {msg && (
            <div className={`rounded-lg border p-2 text-sm ${msg.ok ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"}`}>{msg.text}</div>
          )}
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Kata Laluan Baru</span>
            <input type="password" value={kl} onChange={(e) => setKl(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-surau" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Sahkan Kata Laluan Baru</span>
            <input type="password" value={kl2} onChange={(e) => setKl2(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-surau" />
          </label>
          <button disabled={sedang} className="w-full rounded-lg bg-surau px-4 py-2 font-semibold text-white hover:bg-surau-dark disabled:opacity-60">
            {sedang ? "Menyimpan…" : "Simpan Kata Laluan"}
          </button>
        </form>
        {msg?.ok && (
          <Link href="/masuk" className="mt-4 inline-block w-full rounded-lg bg-hitam px-4 py-2 text-center font-semibold text-white">Log Masuk →</Link>
        )}
      </div>
    </div>
  );
}
