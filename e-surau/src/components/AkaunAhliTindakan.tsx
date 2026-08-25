"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { resetKataLaluan, padamAhli } from "@/app/admin/permohonan/akaun-actions";

export default function AkaunAhliTindakan({
  ahliId,
  nama,
  noAhli,
  emel,
}: {
  ahliId: string;
  nama: string;
  noAhli: string;
  emel: string | null;
}) {
  const router = useRouter();
  const [sedang, setSedang] = useState<null | "reset" | "padam">(null);
  const [msg, setMsg] = useState<null | { ok: boolean; text: string }>(null);

  async function reset() {
    setMsg(null);
    setSedang("reset");
    const res = await resetKataLaluan(ahliId);
    setSedang(null);
    setMsg({ ok: res.ok, text: res.msg });
  }

  async function padam() {
    const token = window.prompt(
      `AMARAN: Tindakan ini PADAM KEKAL ahli "${nama}" (${noAhli}) dan akaun log masuknya. Rekod tanggungan & khairat turut dipadam.\n\nUntuk sahkan, taip: PADAM`,
    );
    if (token == null) return; // batal
    if (token.trim().toUpperCase() !== "PADAM") {
      setMsg({ ok: false, text: "Pengesahan tidak sepadan. Padam dibatalkan." });
      return;
    }
    setMsg(null);
    setSedang("padam");
    const res = await padamAhli(ahliId);
    if (res.ok) {
      setMsg({ ok: true, text: res.msg + " Mengalih ke senarai…" });
      router.push("/admin");
      router.refresh();
      return;
    }
    setSedang(null);
    setMsg({ ok: false, text: res.msg });
  }

  return (
    <section className="rounded-xl border-2 border-red-200 bg-red-50/50 p-5">
      <h2 className="font-semibold text-slate-900">Pengurusan Akaun (Admin)</h2>
      <p className="mt-1 text-sm text-slate-600">
        Reset kata laluan (hantar pautan ke e-mel ahli) atau padam akaun duplikat / silap.
      </p>

      {msg && (
        <div className={`mt-3 rounded-lg border p-3 text-sm ${msg.ok ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"}`}>
          {msg.text}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={reset}
          disabled={sedang !== null}
          className="rounded-lg bg-surau px-4 py-2 text-sm font-semibold text-white hover:bg-surau-dark disabled:opacity-60"
        >
          {sedang === "reset" ? "Menghantar…" : "Reset Kata Laluan (e-mel)"}
        </button>
        <button
          type="button"
          onClick={padam}
          disabled={sedang !== null}
          className="rounded-lg border-2 border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
        >
          {sedang === "padam" ? "Memadam…" : "Padam Ahli / Akaun"}
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        E-mel ahli: <b>{emel || "— (tiada e-mel, reset tidak boleh)"}</b>. Padam adalah kekal dan tidak boleh diundur.
      </p>
    </section>
  );
}
