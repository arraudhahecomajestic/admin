"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { pautDenganKp } from "@/app/ahli/actions";

export default function PautRekodForm() {
  const router = useRouter();
  const [noKp, setNoKp] = useState("");
  const [tel4, setTel4] = useState("");
  const [hantar, setHantar] = useState(false);
  const [msg, setMsg] = useState<null | { ok: boolean; text: string }>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setHantar(true);
    setMsg(null);
    const res = await pautDenganKp(noKp, tel4);
    setHantar(false);
    if (res.ok) {
      setMsg({ ok: true, text: `Berjaya! Rekod ${res.nama ?? "anda"} dijumpai & dipautkan.` });
      router.refresh();
    } else {
      setMsg({ ok: false, text: res.msg ?? "Ralat." });
    }
  }

  return (
    <form onSubmit={submit} className="mt-5 space-y-3 text-left">
      <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
        Ahli lama? Cari rekod anda dengan No. Kad Pengenalan dan 4 digit akhir
        nombor telefon yang anda beri kepada surau dahulu.
      </div>

      {msg && (
        <div
          className={`rounded-lg border p-3 text-sm ${
            msg.ok
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {msg.text}
        </div>
      )}

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">No. Kad Pengenalan</span>
        <input
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-surau"
          inputMode="numeric"
          placeholder="cth: 850505015123"
          value={noKp}
          onChange={(e) => setNoKp(e.target.value)}
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">4 Digit Akhir No. Telefon</span>
        <input
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm tracking-widest outline-none focus:border-surau"
          inputMode="numeric"
          maxLength={4}
          placeholder="cth: 5495"
          value={tel4}
          onChange={(e) => setTel4(e.target.value.replace(/[^0-9]/g, ""))}
        />
      </label>

      <button
        type="submit"
        disabled={hantar}
        className="w-full rounded-lg bg-surau px-5 py-2.5 text-sm font-semibold text-white hover:bg-surau-dark disabled:opacity-60"
      >
        {hantar ? "Mencari…" : "Cari & Paut Rekod Saya"}
      </button>
    </form>
  );
}
