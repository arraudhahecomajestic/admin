// Helper ringkas untuk panggil Claude (Anthropic) dari server actions.
// Auto-pulih jika model bertarikh bersara (404) — cari model sah.

const ENDPOINT = "https://api.anthropic.com/v1/messages";
const MODEL_ENDPOINT = "https://api.anthropic.com/v1/models?limit=100";

function tajukAnthropic(apiKey: string) {
  return { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" };
}

export async function panggilAI(
  sistem: string,
  teks: string,
  maxTokens = 1500,
): Promise<{ ok: boolean; teks?: string; msg?: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { ok: false, msg: "AI belum dikonfigurasi (ANTHROPIC_API_KEY tiada)." };
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514";

  const panggil = (m: string) =>
    fetch(ENDPOINT, {
      method: "POST",
      headers: tajukAnthropic(apiKey),
      body: JSON.stringify({ model: m, max_tokens: maxTokens, system: sistem, messages: [{ role: "user", content: teks }] }),
    });

  try {
    let res = await panggil(model);
    if (res.status === 404) {
      try {
        const mr = await fetch(MODEL_ENDPOINT, { headers: tajukAnthropic(apiKey) });
        if (mr.ok) {
          const md = await mr.json();
          const ids: string[] = ((md?.data as any[]) ?? []).map((x) => x?.id).filter(Boolean);
          const sah = ids.find((id) => id.includes("sonnet")) || ids[0];
          if (sah && sah !== model) res = await panggil(sah);
        }
      } catch { /* abai */ }
    }
    if (!res.ok) return { ok: false, msg: `AI gagal menjawab (${res.status}). Cuba lagi sebentar.` };
    const data = await res.json();
    const out = Array.isArray(data?.content)
      ? data.content.filter((b: any) => b?.type === "text").map((b: any) => b.text).join("\n").trim()
      : "";
    if (!out) return { ok: false, msg: "AI tidak memberi jawapan. Cuba lagi." };
    return { ok: true, teks: out };
  } catch {
    return { ok: false, msg: "Sambungan ke AI gagal. Cuba lagi sebentar." };
  }
}

// Panggil Claude dengan LAMPIRAN PDF (Claude baca PDF secara natif).
export async function panggilAIDokumenPDF(
  sistem: string,
  pdfBase64: string,
  teks: string,
  maxTokens = 2500,
): Promise<{ ok: boolean; teks?: string; msg?: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { ok: false, msg: "AI belum dikonfigurasi (ANTHROPIC_API_KEY tiada)." };
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514";

  const badan = (m: string) => JSON.stringify({
    model: m, max_tokens: maxTokens, system: sistem,
    messages: [{
      role: "user",
      content: [
        { type: "document", source: { type: "base64", media_type: "application/pdf", data: pdfBase64 } },
        { type: "text", text: teks },
      ],
    }],
  });
  const panggil = (m: string) => fetch(ENDPOINT, { method: "POST", headers: tajukAnthropic(apiKey), body: badan(m) });

  try {
    let res = await panggil(model);
    if (res.status === 404) {
      try {
        const mr = await fetch(MODEL_ENDPOINT, { headers: tajukAnthropic(apiKey) });
        if (mr.ok) {
          const md = await mr.json();
          const ids: string[] = ((md?.data as any[]) ?? []).map((x) => x?.id).filter(Boolean);
          const sah = ids.find((id) => id.includes("sonnet")) || ids[0];
          if (sah && sah !== model) res = await panggil(sah);
        }
      } catch { /* abai */ }
    }
    if (!res.ok) return { ok: false, msg: `AI gagal membaca dokumen (${res.status}). Cuba lagi sebentar.` };
    const data = await res.json();
    const out = Array.isArray(data?.content)
      ? data.content.filter((b: any) => b?.type === "text").map((b: any) => b.text).join("\n").trim()
      : "";
    if (!out) return { ok: false, msg: "AI tidak memberi jawapan. Cuba lagi." };
    return { ok: true, teks: out };
  } catch {
    return { ok: false, msg: "Sambungan ke AI gagal. Cuba lagi sebentar." };
  }
}
