"use client";

import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

export default function ChatbotWidget({ lang = "ms", nama = "" }: { lang?: string; nama?: string }) {
  const en = lang === "en";
  const t = (ms: string, e: string) => (en ? e : ms);

  const sapaan = t(
    `Assalamualaikum${nama ? " " + nama.split(" ")[0] : ""}! Saya Ayaan Ilhan, Pembantu Surau Ar Raudhah. Tanya saya apa sahaja — cara daftar ahli, khairat kematian, waktu solat, program, sewaan ruang & lain-lain.`,
    `Assalamualaikum${nama ? " " + nama.split(" ")[0] : ""}! I'm Ayaan Ilhan, the Surau Ar Raudhah assistant. Ask me anything — how to register, death benefit scheme, prayer times, programmes, hall rental & more.`,
  );

  const [buka, setBuka] = useState(false);
  const [mesej, setMesej] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const hujungRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    hujungRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mesej, loading, buka]);

  const cadangan = en
    ? ["How do I register as a member?", "What is the death benefit scheme?", "Today's prayer times?"]
    : ["Macam mana nak daftar ahli?", "Apa itu khairat kematian?", "Waktu solat hari ini?"];

  async function hantar(teks?: string) {
    const soalan = (teks ?? input).trim();
    if (!soalan || loading) return;
    const baru: Msg[] = [...mesej, { role: "user", content: soalan }];
    setMesej(baru);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: baru }),
      });
      const data = await res.json().catch(() => ({}));
      const balas = data?.ok
        ? data.reply
        : data?.ralat || t("Maaf, ada masalah. Cuba lagi.", "Sorry, something went wrong. Please try again.");
      setMesej((m) => [...m, { role: "assistant", content: balas }]);
    } catch {
      setMesej((m) => [...m, { role: "assistant", content: t("Maaf, sambungan gagal. Cuba lagi.", "Sorry, connection failed. Try again.") }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="print-hide">
      {/* Butang terapung */}
      {!buka && (
        <button
          onClick={() => setBuka(true)}
          aria-label={t("Buka Ayaan Ilhan", "Open Ayaan Ilhan")}
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-surau px-4 py-3 text-white shadow-lg transition-transform hover:scale-105 hover:bg-surau-dark"
        >
          <span className="text-sm font-semibold">{t("Tanya Ayaan", "Ask Ayaan")}</span>
        </button>
      )}

      {/* Panel sembang */}
      {buka && (
        <div className="fixed bottom-5 right-5 z-50 flex h-[70vh] max-h-[560px] w-[92vw] max-w-[380px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          {/* Kepala */}
          <div className="flex items-center justify-between gap-2 bg-surau px-4 py-3 text-white">
            <div>
              <div className="text-sm font-bold leading-tight">Ayaan Ilhan</div>
              <div className="text-[11px] text-white/80 leading-tight">{t("Pembantu Surau Ar Raudhah", "Surau Ar Raudhah Assistant")}</div>
            </div>
            <button onClick={() => setBuka(false)} aria-label={t("Tutup", "Close")} className="rounded p-1 text-white/90 hover:bg-white/20">
              ✕
            </button>
          </div>

          {/* Mesej */}
          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-3">
            {/* Sapaan */}
            <Gelembung role="assistant" teks={sapaan} />

            {mesej.length === 0 && (
              <div className="space-y-1.5">
                <div className="px-1 text-[11px] font-medium text-slate-400">{t("Soalan lazim:", "Quick questions:")}</div>
                {cadangan.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => hantar(c)}
                    className="block w-full rounded-lg border border-surau/30 bg-white px-3 py-2 text-left text-sm text-surau hover:bg-surau/5"
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}

            {mesej.map((m, i) => (
              <Gelembung key={i} role={m.role} teks={m.content} />
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm bg-white px-3 py-2 text-sm text-slate-400 shadow-sm">
                  <span className="inline-flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                  </span>
                </div>
              </div>
            )}
            <div ref={hujungRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              hantar();
            }}
            className="flex items-center gap-2 border-t border-slate-200 bg-white p-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("Taip soalan anda…", "Type your question…")}
              className="min-w-0 flex-1 rounded-full border border-slate-300 px-4 py-2 text-sm focus:border-surau focus:outline-none focus:ring-1 focus:ring-surau"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="shrink-0 rounded-full bg-surau px-4 py-2 text-sm font-semibold text-white hover:bg-surau-dark disabled:opacity-40"
            >
              {t("Hantar", "Send")}
            </button>
          </form>
          <div className="bg-white pb-2 text-center text-[10px] text-slate-400">
            {t("AI boleh silap. Sahkan info penting dengan AJK.", "AI can make mistakes. Confirm important info with the committee.")}
          </div>
        </div>
      )}
    </div>
  );
}

function Gelembung({ role, teks }: { role: "user" | "assistant"; teks: string }) {
  const ku = role === "user";
  return (
    <div className={`flex ${ku ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm shadow-sm ${
          ku ? "rounded-br-sm bg-surau text-white" : "rounded-bl-sm bg-white text-slate-700"
        }`}
      >
        {teks}
      </div>
    </div>
  );
}
