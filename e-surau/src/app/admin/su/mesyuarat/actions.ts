"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { getProfil, isAdmin, type Profil } from "@/lib/sesi";
import { NAMA_SURAU } from "@/lib/tetapan";
import { panggilAI, panggilAIDokumenPDF } from "@/lib/ai";
import { unzipSync, strFromU8 } from "fflate";

function boleh(p: Profil | null): boolean {
  return isAdmin(p);
}

// Kemas nota kasar mesyuarat → minit yang tersusun & profesional (guna AI).
export async function kemasMinitAI(input: {
  tajuk?: string; jenis?: string; agenda?: string; kehadiran?: string; nota: string;
}): Promise<{ ok: boolean; teks?: string; msg?: string }> {
  if (!boleh(await getProfil())) return { ok: false, msg: "Tiada akses." };
  const nota = (input.nota || "").trim();
  if (nota.length < 10) return { ok: false, msg: "Sila taip nota/perbincangan kasar dahulu (sekurang-kurangnya beberapa ayat)." };

  const sistem = `Anda pembantu Setiausaha untuk ${NAMA_SURAU}. Tugas anda menyusun nota kasar/berselerak menjadi BADAN MINIT MESYUARAT yang kemas, formal & profesional dalam Bahasa Melayu, mengikut GAYA RASMI Surau Ar-Raudhah (format Pengerusi).

FORMAT & GAYA (WAJIB ikut dengan tepat):
- Guna PENOMBORAN PERPULUHAN 3 aras:
  • Perkara utama = "1.", "2.", "3." diikuti tajuk pendek pada baris tersendiri, cth "1. Ucapan Pengerusi", "2. Program Kem Memanah Recurve & Robotik 2026".
  • Sub-perkara = "1.1", "1.2", "2.1", "2.2" — satu perenggan setiap satu.
  • Sub-sub perkara (untuk senarai butiran spt tarikh/masa/tempat/pakej) = "2.2.1", "2.2.2" — satu butiran satu baris.
- MULAKAN minit dengan perkara "1. Ucapan Pengerusi" dan TUTUP dengan perkara terakhir "N. Ucapan Penangguhan" yang mengandungi ucapan terima kasih Pengerusi dan satu baris "Mesyuarat ditangguhkan pada pukul ___" (biar tempat kosong jika masa tiada dalam nota).
- Tulis dalam ayat pasif formal minit: "Pengerusi memaklumkan…", "Mesyuarat bersetuju…", "Dimaklumkan bahawa…", "Beliau membentangkan…", "Keputusan sebulat suara meluluskan…".
- Untuk pecahan kos/kewangan yang berbentuk jadual, keluarkan sebagai JADUAL dengan baris bermula & berakhir dengan "|", cth:
  | Kategori | Jumlah (RM) |
  | Makanan | 1,200.00 |
  | Jumlah | 3,000.00 |
- Bagi perkara yang ada susulan, tambah SATU baris berasingan bermula dengan "Tindakan:" — cth "Tindakan: Bendahari", "Tindakan: Untuk makluman semua ahli jawatankuasa", "Tindakan: Semua ahli jawatankuasa".
- Kekalkan SEMUA nama, angka, tarikh & keputusan SEPERTI dalam nota. JANGAN reka fakta, nama, angka, atau keputusan baharu. Jika sesuatu tidak jelas, biarkan tanpa menambah andaian.
- Keluarkan HANYA badan minit (perkara berpenomboran + jadual + baris Tindakan). JANGAN tambah tajuk "MINIT MESYUARAT", senarai kehadiran, tarikh/masa/tempat, atau ruang tandatangan — semua itu diuruskan berasingan oleh sistem.
- Guna Bahasa Melayu baku sepenuhnya.`;

  const konteks = [
    input.tajuk ? `Tajuk: ${input.tajuk}` : "",
    input.jenis ? `Jenis: ${input.jenis}` : "",
    input.agenda ? `Agenda:\n${input.agenda}` : "",
    input.kehadiran ? `Kehadiran: ${input.kehadiran.replace(/\n/g, ", ")}` : "",
    `\nNota kasar / perbincangan untuk dikemas:\n${nota}`,
  ].filter(Boolean).join("\n");

  return panggilAI(sistem, konteks, 2000);
}

// Ambil senarai AJK (dari carta organisasi) untuk auto-isi kehadiran.
export async function senaraiAjkKehadiran(): Promise<{ ok: boolean; teks?: string }> {
  if (!boleh(await getProfil())) return { ok: false };
  const db = createAdminClient();
  const { data } = await db
    .from("carta_organisasi")
    .select("jawatan, nama, susunan")
    .eq("aktif", true)
    .order("susunan", { ascending: true });
  const baris = ((data as any[]) ?? [])
    .filter((c) => c.nama)
    .map((c) => `${c.nama}${c.jawatan ? ` (${c.jawatan})` : ""}`);
  return { ok: true, teks: baris.join("\n") };
}

export async function ciptaMesyuarat(input: {
  tajuk: string; jenis: string; bil?: string; tarikh?: string; masa?: string; tempat?: string;
}): Promise<{ ok: boolean; msg?: string; id?: string }> {
  const p = await getProfil();
  if (!boleh(p)) return { ok: false, msg: "Tiada akses." };
  const tajuk = (input.tajuk || "").trim();
  if (tajuk.length < 3) return { ok: false, msg: "Sila isi tajuk mesyuarat." };
  const db = createAdminClient();
  const { data, error } = await db.from("mesyuarat").insert({
    tajuk, jenis: input.jenis || "AJK", bil: (input.bil || "").trim() || null,
    tarikh: input.tarikh || null, masa: (input.masa || "").trim() || null,
    tempat: (input.tempat || "").trim() || null,
    pencatat: p!.nama ?? p!.emel,
  }).select("id").maybeSingle();
  if (error) return { ok: false, msg: error.message };
  revalidatePath("/admin/su/mesyuarat");
  return { ok: true, id: (data as any)?.id };
}

export async function simpanMesyuarat(id: string, patch: {
  tajuk?: string; jenis?: string; bil?: string; tarikh?: string; masa?: string; tempat?: string;
  pengerusi?: string; pencatat?: string; kehadiran?: string; kehadiran_online?: string; tidak_hadir?: string; agenda?: string; minit?: string; status?: string;
}): Promise<{ ok: boolean; msg?: string }> {
  const p = await getProfil();
  if (!boleh(p)) return { ok: false, msg: "Tiada akses." };
  const db = createAdminClient();
  const bersih: any = {};
  for (const k of ["tajuk","jenis","bil","masa","tempat","pengerusi","pencatat","kehadiran","kehadiran_online","tidak_hadir","agenda","minit","status"] as const) {
    if (patch[k] !== undefined) bersih[k] = (patch[k] as string)?.trim?.() ?? patch[k] ?? null;
  }
  if (patch.tarikh !== undefined) bersih.tarikh = patch.tarikh || null;
  const { error } = await db.from("mesyuarat").update(bersih).eq("id", id);
  if (error) return { ok: false, msg: error.message };
  revalidatePath("/admin/su/mesyuarat");
  revalidatePath(`/admin/su/mesyuarat/${id}`);
  return { ok: true };
}

export async function padamMesyuarat(id: string): Promise<{ ok: boolean }> {
  const p = await getProfil();
  if (!boleh(p)) return { ok: false };
  const db = createAdminClient();
  await db.from("mesyuarat").delete().eq("id", id);
  revalidatePath("/admin/su/mesyuarat");
  return { ok: true };
}

// ---- Tindakan (action items) ----
export async function tambahTindakan(input: { mesyuaratId: string; perkara: string; tanggungjawab?: string; tarikhSasar?: string }): Promise<{ ok: boolean; msg?: string }> {
  const p = await getProfil();
  if (!boleh(p)) return { ok: false, msg: "Tiada akses." };
  const perkara = (input.perkara || "").trim();
  if (perkara.length < 3) return { ok: false, msg: "Sila isi perkara tindakan." };
  const db = createAdminClient();
  const { error } = await db.from("mesyuarat_tindakan").insert({
    mesyuarat_id: input.mesyuaratId, perkara,
    tanggungjawab: (input.tanggungjawab || "").trim() || null,
    tarikh_sasar: input.tarikhSasar || null,
  });
  if (error) return { ok: false, msg: error.message };
  revalidatePath(`/admin/su/mesyuarat/${input.mesyuaratId}`);
  return { ok: true };
}

export async function ubahStatusTindakan(id: string, mesyuaratId: string, status: string): Promise<{ ok: boolean }> {
  const p = await getProfil();
  if (!boleh(p)) return { ok: false };
  const db = createAdminClient();
  await db.from("mesyuarat_tindakan").update({ status }).eq("id", id);
  revalidatePath(`/admin/su/mesyuarat/${mesyuaratId}`);
  return { ok: true };
}

export async function padamTindakan(id: string, mesyuaratId: string): Promise<{ ok: boolean }> {
  const p = await getProfil();
  if (!boleh(p)) return { ok: false };
  const db = createAdminClient();
  await db.from("mesyuarat_tindakan").delete().eq("id", id);
  revalidatePath(`/admin/su/mesyuarat/${mesyuaratId}`);
  return { ok: true };
}

// ---- Lampiran (slide, dokumen, gambar) ----
export async function tambahLampiran(input: { mesyuaratId: string; tajuk: string; url_fail: string; nama_fail?: string }): Promise<{ ok: boolean; msg?: string }> {
  const p = await getProfil();
  if (!boleh(p)) return { ok: false, msg: "Tiada akses." };
  const tajuk = (input.tajuk || "").trim();
  if (!tajuk) return { ok: false, msg: "Sila isi tajuk lampiran." };
  if (!input.url_fail) return { ok: false, msg: "Sila muat naik fail lampiran." };
  const db = createAdminClient();
  const { error } = await db.from("mesyuarat_lampiran").insert({
    mesyuarat_id: input.mesyuaratId, tajuk, url_fail: input.url_fail,
    nama_fail: (input.nama_fail || "").trim() || null,
    dicipta_oleh: p?.nama ?? p?.emel ?? null,
  });
  if (error) return { ok: false, msg: error.message };
  revalidatePath(`/admin/su/mesyuarat/${input.mesyuaratId}`);
  return { ok: true };
}

export async function padamLampiran(id: string, mesyuaratId: string): Promise<{ ok: boolean }> {
  const p = await getProfil();
  if (!boleh(p)) return { ok: false };
  const db = createAdminClient();
  const { data: rec } = await db.from("mesyuarat_lampiran").select("url_fail").eq("id", id).maybeSingle();
  const url = (rec as any)?.url_fail as string | undefined;
  if (url) {
    const rel = url.replace(/^salinan-kp\//, "");
    await db.storage.from("salinan-kp").remove([rel]);
  }
  await db.from("mesyuarat_lampiran").delete().eq("id", id);
  revalidatePath(`/admin/su/mesyuarat/${mesyuaratId}`);
  return { ok: true };
}

// AI baca lampiran (PDF natif / PPTX ekstrak teks) → ekstrak poin penting jadi badan minit.
export async function bacaLampiranAI(lampiranId: string): Promise<{ ok: boolean; teks?: string; msg?: string }> {
  const p = await getProfil();
  if (!boleh(p)) return { ok: false, msg: "Tiada akses." };
  const db = createAdminClient();
  const { data: lam } = await db.from("mesyuarat_lampiran").select("tajuk, url_fail, nama_fail").eq("id", lampiranId).maybeSingle();
  const l: any = lam;
  if (!l?.url_fail) return { ok: false, msg: "Lampiran tidak dijumpai." };

  const rel = String(l.url_fail).replace(/^salinan-kp\//, "");
  const { data: blob, error } = await db.storage.from("salinan-kp").download(rel);
  if (error || !blob) return { ok: false, msg: "Gagal muat turun fail lampiran." };
  const bytes = new Uint8Array(await blob.arrayBuffer());
  if (bytes.byteLength > 12 * 1024 * 1024) return { ok: false, msg: "Fail terlalu besar (>12MB). Sila ringkaskan atau muat naik versi PDF." };
  const nama = String(l.nama_fail || l.tajuk || "").toLowerCase();

  const sistem = `Anda pembantu Setiausaha untuk ${NAMA_SURAU}. Anda diberi kandungan sebuah slide/dokumen pembentangan mesyuarat. Ekstrak HANYA maklumat penting dan tuliskan sebagai BADAN MINIT MESYUARAT ringkas dalam Bahasa Melayu formal, mengikut gaya rasmi:
- Susun guna penomboran perpuluhan: perkara utama ".0" (cth "1.0 Pembentangan Bajet 2026") dan sub-perkara "1.1", "1.2".
- Padatkan poin penting: keputusan, angka, cadangan, tarikh & tindakan.
- Bagi perkara yang ada susulan, tambah baris berasingan "Tindakan: <pihak>".
- JANGAN reka fakta, nama atau angka yang tiada dalam dokumen. Jika tidak jelas, biarkan.
- Tandakan sumber sebagai "(rujuk Lampiran)". Keluarkan HANYA badan minit.`;
  const arahan = `Tajuk lampiran: ${l.tajuk}. Sila ekstrak maklumat penting daripada dokumen ini dan susun sebagai badan minit mesyuarat.`;

  if (nama.endsWith(".pdf")) {
    const b64 = Buffer.from(bytes).toString("base64");
    return panggilAIDokumenPDF(sistem, b64, arahan, 2500);
  }

  if (nama.endsWith(".pptx")) {
    let teksSlaid = "";
    try {
      const files = unzipSync(bytes);
      const slaid = Object.keys(files)
        .filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f))
        .sort((a, b) => Number(a.match(/(\d+)/)![1]) - Number(b.match(/(\d+)/)![1]));
      const bahagian: string[] = [];
      slaid.forEach((f, i) => {
        const xml = strFromU8(files[f]);
        const teks = (xml.match(/<a:t>([\s\S]*?)<\/a:t>/g) || [])
          .map((t) => t.replace(/<[^>]+>/g, "")).join(" ").replace(/\s+/g, " ").trim();
        if (teks) bahagian.push(`Slaid ${i + 1}: ${teks}`);
      });
      teksSlaid = bahagian.join("\n");
    } catch { return { ok: false, msg: "Gagal membaca fail PPTX. Cuba muat naik versi PDF." }; }
    if (teksSlaid.trim().length < 15) return { ok: false, msg: "Tiada teks dikesan dalam slide (mungkin slide gambar sahaja). Sila muat naik versi PDF." };
    return panggilAI(sistem, `${arahan}\n\nKandungan slide:\n${teksSlaid}`, 2500);
  }

  return { ok: false, msg: "Format tidak disokong untuk bacaan AI. Sila muat naik PDF atau PPTX." };
}

// Tambah teks (cth hasil AI dari lampiran) ke dalam badan minit sedia ada.
export async function tambahKeMinit(mesyuaratId: string, teks: string): Promise<{ ok: boolean; msg?: string }> {
  const p = await getProfil();
  if (!boleh(p)) return { ok: false, msg: "Tiada akses." };
  const t = (teks || "").trim();
  if (!t) return { ok: false, msg: "Tiada teks untuk ditambah." };
  const db = createAdminClient();
  const { data: m } = await db.from("mesyuarat").select("minit").eq("id", mesyuaratId).maybeSingle();
  const sedia = String((m as any)?.minit || "").trim();
  const gabung = sedia ? `${sedia}\n\n${t}` : t;
  const { error } = await db.from("mesyuarat").update({ minit: gabung }).eq("id", mesyuaratId);
  if (error) return { ok: false, msg: error.message };
  revalidatePath(`/admin/su/mesyuarat/${mesyuaratId}`);
  return { ok: true };
}
