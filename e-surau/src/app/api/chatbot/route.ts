import { NextResponse } from "next/server";
import { getProfil } from "@/lib/sesi";
import { createAdminClient, adminConfigured } from "@/lib/supabaseAdmin";
import { khairatDibuka, pampasanKhairat } from "@/lib/tetapanSistem";
import {
  NAMA_SURAU,
  ALAMAT_SURAU,
  EMEL_SURAU,
  BANK_SURAU,
  ZON_SOLAT,
  YURAN_KHAIRAT_TAHUNAN,
} from "@/lib/tetapan";

export const dynamic = "force-dynamic";

const ENDPOINT = "https://api.anthropic.com/v1/messages";
const MODEL = process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest";
const MAX_SEJARAH = 12; // had mesej dihantar (jimat kos)

type Msg = { role: "user" | "assistant"; content: string };

// ---- Kumpul data langsung dari sistem untuk konteks chatbot ----
async function ambilKonteksLangsung(): Promise<string> {
  const bahagian: string[] = [];

  // Program akan datang
  if (adminConfigured) {
    try {
      const db = createAdminClient();
      const { data } = await db.from("v_program_awam").select("*").limit(6);
      const prog = (data as any[]) ?? [];
      if (prog.length) {
        const senarai = prog
          .map((p) => `- ${p.tajuk}${p.tarikh ? ` (${p.tarikh})` : ""}${p.masa ? `, ${p.masa}` : ""}${p.lokasi ? ` @ ${p.lokasi}` : ""}`)
          .join("\n");
        bahagian.push(`PROGRAM AKAN DATANG:\n${senarai}`);
      } else {
        bahagian.push("PROGRAM AKAN DATANG: Tiada program dijadualkan buat masa ini.");
      }
    } catch {
      /* abai */
    }
  }

  // Waktu solat hari ini
  try {
    const res = await fetch(`https://api.waktusolat.app/v2/solat/${ZON_SOLAT}`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      const hariIni = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" });
      const hb = Number(hariIni.split("-")[2]);
      const list: any[] = data?.prayers ?? [];
      const t = list.find((p) => Number(p.day) === hb) ?? list[0];
      if (t) {
        const jam = (e: number) =>
          new Date(e * 1000).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kuala_Lumpur" });
        bahagian.push(
          `WAKTU SOLAT HARI INI (${hariIni}, zon ${ZON_SOLAT}): Subuh ${jam(t.fajr)}, Syuruk ${jam(t.syuruk)}, Zohor ${jam(t.dhuhr)}, Asar ${jam(t.asr)}, Maghrib ${jam(t.maghrib)}, Isyak ${jam(t.isha)}.`,
        );
      }
    }
  } catch {
    /* abai */
  }

  // Status khairat
  try {
    const [dibuka, pampasan] = await Promise.all([khairatDibuka(), pampasanKhairat()]);
    bahagian.push(
      `KHAIRAT KEMATIAN: Yuran RM${YURAN_KHAIRAT_TAHUNAN}/tahun. Pampasan RM${pampasan} setiap kematian dilindungi. Sertai skim: ${dibuka ? "DIBUKA sekarang" : "belum dibuka buat masa ini (pendaftaran tanggungan tetap boleh)"}.`,
    );
  } catch {
    /* abai */
  }

  return bahagian.join("\n\n");
}

function binaSistemPrompt(konteks: string, namaAhli: string): string {
  return `Anda ialah "Ayaan Ihlan", Pembantu Surau Ar Raudhah — chatbot rasmi untuk ${NAMA_SURAU}. Perkenalkan diri sebagai Ayaan Ihlan bila sesuai. Anda membantu ahli kariah menjawab soalan berkaitan surau dengan mesra, ringkas dan tepat.

PERATURAN:
- Jawab dalam bahasa yang digunakan oleh pengguna (Bahasa Melayu atau English). Nada mesra, sopan, ringkas.
- Guna HANYA maklumat di bawah. Jika anda tidak pasti atau maklumat tiada, jujur katakan anda tidak pasti dan cadangkan hubungi AJK/Setiausaha atau hantar Maklum Balas di laman web. JANGAN reka jawapan.
- Untuk soal agama/hukum yang rumit, cadangkan rujuk imam/pihak berwajib surau. Jangan keluarkan fatwa sendiri.
- Bila relevan, beri pautan halaman dalam sistem (cth /daftar, /khairat, /sewaan, /tahlil, /program, /infaq, /maklum-balas).
- Nama ahli yang bertanya: ${namaAhli || "ahli kariah"}.

MAKLUMAT SURAU:
- Nama: ${NAMA_SURAU}
- Alamat: ${ALAMAT_SURAU}
- Emel: ${EMEL_SURAU}
- Akaun bank sumbangan: ${BANK_SURAU.bank} ${BANK_SURAU.no_akaun} (${BANK_SURAU.nama_akaun})
- Zon waktu solat: ${ZON_SOLAT}

PANDUAN PERKHIDMATAN:
- Daftar ahli kariah: pergi ke /daftar, masukkan No. Kad Pengenalan. Sistem semak sama ada sudah berdaftar. Jika belum, isi borang pendaftaran. Percuma.
- Kemas kini maklumat & akses portal ahli: log masuk di /masuk, kemudian ke portal /ahli.
- Khairat Kematian: maklumat penuh di /khairat. Sertai/daftar tanggungan melalui borang pendaftaran /daftar.
- Sewaan ruang surau: mohon di /sewaan (isi Seksyen A dahulu, kemudian bahagian seterusnya).
- Yaasin & Tahlil malam Jumaat: hantar nama arwah di /tahlil sebelum 7:00 malam setiap Khamis.
- Program & aktiviti surau: lihat /program.
- Infaq / sumbangan: /infaq.
- Aduan, cadangan atau penambahbaikan: hantar di /maklum-balas.

DATA TERKINI (dijana automatik):
${konteks || "(tiada data langsung tersedia)"}`;
}

export async function POST(request: Request) {
  // Akses: ahli berdaftar (log masuk) sahaja
  const profil = await getProfil();
  if (!profil) {
    return NextResponse.json({ ok: false, ralat: "Sila log masuk untuk guna Pembantu Maya." }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, ralat: "Pembantu Maya belum dikonfigurasi (ANTHROPIC_API_KEY tiada)." },
      { status: 200 },
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, ralat: "Permintaan tidak sah." }, { status: 400 });
  }

  const mesejMasuk: Msg[] = Array.isArray(body?.messages) ? body.messages : [];
  const bersih = mesejMasuk
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-MAX_SEJARAH)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));

  if (!bersih.length || bersih[bersih.length - 1].role !== "user") {
    return NextResponse.json({ ok: false, ralat: "Tiada soalan diterima." }, { status: 400 });
  }

  const konteks = await ambilKonteksLangsung();
  const sistem = binaSistemPrompt(konteks, profil.nama ?? "");

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        system: sistem,
        messages: bersih,
      }),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      return NextResponse.json(
        { ok: false, ralat: "Maaf, Pembantu Maya sibuk sekejap. Cuba lagi sebentar.", nyahpepijat: `${res.status} ${txt.slice(0, 200)}` },
        { status: 200 },
      );
    }

    const data = await res.json();
    const reply = Array.isArray(data?.content)
      ? data.content.filter((b: any) => b?.type === "text").map((b: any) => b.text).join("\n").trim()
      : "";

    return NextResponse.json({ ok: true, reply: reply || "Maaf, saya tak dapat jawapan buat masa ini." });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, ralat: "Maaf, sambungan ke Pembantu Maya gagal. Cuba lagi.", nyahpepijat: e?.message ?? "ralat" },
      { status: 200 },
    );
  }
}
