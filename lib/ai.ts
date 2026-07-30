// Anthropic — kemas nota kasar site visit jadi ayat report profesional.
// Kunci: ANTHROPIC_API_KEY (Cloudflare secret). Model: ANTHROPIC_MODEL (pilihan).

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-20241022';

export interface KemasInput {
  areaTitle: string;
  noteRaw: string;
  konteks?: string;   // cth: "Teres 2 tingkat, MPKj, extension belakang"
}

export interface KemasOutput { finding: string; action: string; }

export async function kemasNota(input: KemasInput): Promise<KemasOutput> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY belum diset di Cloudflare.');

  const prompt =
`Kau pembantu penilai tapak untuk RENORUMAH (syarikat renovasi & submission permit di Malaysia).
Diberi nota kasar dari lawatan tapak untuk SATU area, tulis semula jadi ayat report profesional dalam Bahasa Melayu yang kemas dan ringkas.

PENTING: Jangan reka fakta yang tiada dalam nota. Guna hanya maklumat yang diberi. Nada profesional, bukan bombastik.

Area: ${input.areaTitle || '(tiada tajuk)'}
Konteks projek: ${input.konteks || '-'}
Nota kasar: ${input.noteRaw}

Pulangkan HANYA JSON tulen (tiada teks lain) dalam format:
{"finding":"1-2 ayat keadaan/penemuan area ini","action":"1 ayat tindakan yang diperlukan"}`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`AI gagal (${res.status}): ${t.slice(0, 200)}`);
  }
  const data: any = await res.json();
  const text: string = data?.content?.[0]?.text || '';
  const m = text.match(/\{[\s\S]*\}/);
  try {
    const obj = JSON.parse(m ? m[0] : text);
    return { finding: String(obj.finding || '').trim(), action: String(obj.action || '').trim() };
  } catch {
    return { finding: text.trim(), action: '' };
  }
}
