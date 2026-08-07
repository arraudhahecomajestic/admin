"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { chipConfigured, ciptaPurchase, siteUrl } from "@/lib/chip";

// Pendaftaran program BERBAYAR (kem/kelas) — consent + kesihatan + bayaran CHIP.
export async function daftarProgramBerbayar(data: {
  program_id?: string;
  nama_peserta?: string;
  umur?: string | number;
  sekolah?: string;
  jantina?: string;
  nama_penjaga?: string;
  telefon_penjaga?: string;
  emel?: string;
  kontak_kecemasan?: string;
  no_kecemasan?: string;
  maklumat_kesihatan?: string;
  kebenaran_ibubapa?: boolean;
  kebenaran_foto?: boolean;
}): Promise<{ ok: boolean; msg?: string; checkout_url?: string }> {
  const program_id = String(data.program_id ?? "");
  const nama = (data.nama_peserta ?? "").trim();
  const penjaga = (data.nama_penjaga ?? "").trim();
  const telefon = (data.telefon_penjaga ?? "").trim();
  const emel = (data.emel ?? "").trim().toLowerCase();

  if (!program_id || !nama) return { ok: false, msg: "Sila isi nama peserta." };
  if (!penjaga || !telefon) return { ok: false, msg: "Sila isi nama & telefon ibu bapa/penjaga." };
  if (!emel || !emel.includes("@")) return { ok: false, msg: "Sila isi e-mel yang sah untuk resit & pengesahan." };
  if (!data.kebenaran_ibubapa) return { ok: false, msg: "Kebenaran ibu bapa/penjaga diperlukan untuk menyertai." };

  const db = createAdminClient();
  const { data: pr } = await db.from("program").select("*").eq("id", program_id).single();
  const p: any = pr;
  if (!p) return { ok: false, msg: "Program tidak dijumpai." };
  if (!p.berbayar) return { ok: false, msg: "Program ini bukan pendaftaran berbayar." };
  if (!p.rsvp_dibuka) return { ok: false, msg: "Pendaftaran ditutup." };

  // Semak had peserta (kira yang sudah dibayar)
  if (p.had_peserta) {
    const { data: sedia } = await db.from("program_pendaftaran").select("id").eq("program_id", program_id).eq("status_bayar", "dibayar");
    if (((sedia as any[]) ?? []).length >= Number(p.had_peserta)) return { ok: false, msg: "Maaf, pendaftaran telah penuh." };
  }

  const yuran = Number(p.yuran || 0);
  if (yuran <= 0) return { ok: false, msg: "Yuran program belum ditetapkan. Sila hubungi surau." };
  if (!chipConfigured()) return { ok: false, msg: "Gerbang pembayaran belum disediakan. Sila hubungi admin surau." };

  // 1) Simpan pendaftaran (status menunggu bayaran)
  const { data: pend, error: ePend } = await db.from("program_pendaftaran").insert({
    program_id,
    nama_peserta: nama,
    umur: data.umur ? Number(data.umur) : null,
    sekolah: (data.sekolah ?? "").trim() || null,
    jantina: (data.jantina ?? "").trim() || null,
    nama_penjaga: penjaga,
    telefon_penjaga: telefon,
    emel,
    kontak_kecemasan: (data.kontak_kecemasan ?? "").trim() || null,
    no_kecemasan: (data.no_kecemasan ?? "").trim() || null,
    maklumat_kesihatan: (data.maklumat_kesihatan ?? "").trim() || null,
    kebenaran_ibubapa: !!data.kebenaran_ibubapa,
    kebenaran_foto: !!data.kebenaran_foto,
    status_bayar: "menunggu",
    jumlah: yuran,
  }).select("id").single();
  if (ePend || !pend) return { ok: false, msg: "Ralat menyimpan pendaftaran: " + (ePend?.message ?? "") };

  const pendId = (pend as any).id as string;
  const ref = `PRG-${pendId.slice(0, 8).toUpperCase()}`;
  const site = siteUrl();

  // 2) Cipta bayaran CHIP
  let purchase: any;
  try {
    purchase = await ciptaPurchase({
      email: emel,
      nama: penjaga,
      telefon,
      amountCents: Math.round(yuran * 100),
      productName: `Yuran: ${p.tajuk} — ${nama}`.slice(0, 250),
      reference: ref,
      success_redirect: `${site}/program/${program_id}?bayar=ok`,
      failure_redirect: `${site}/program/${program_id}?bayar=gagal`,
      success_callback: `${site}/api/chip/webhook`,
    });
  } catch (err: any) {
    return { ok: false, msg: "Ralat gerbang pembayaran: " + (err?.message ?? String(err)) };
  }

  // 3) Rekod bayaran (webhook akan tandakan dibayar)
  await db.from("program_pendaftaran").update({ chip_id: purchase.id }).eq("id", pendId);
  await db.from("bayaran").insert({
    chip_id: purchase.id,
    jenis: "program",
    rujukan_id: pendId,
    no_rujukan: ref,
    nama: `${nama} (penjaga: ${penjaga})`,
    emel,
    jumlah: yuran,
    status: "menunggu",
    checkout_url: purchase.checkout_url,
  });

  if (!purchase.checkout_url) return { ok: false, msg: "CHIP tidak mengembalikan pautan pembayaran." };
  revalidatePath(`/program/${program_id}`);
  return { ok: true, checkout_url: purchase.checkout_url };
}

// Pendaftaran program BERBAYAR secara MANUAL (CHIP belum go live).
// Parent bayar sendiri (pindahan bank) → isi borang ringkas + upload resit →
// status 'menunggu_sah' untuk disahkan urus setia.
export async function daftarProgramManual(data: {
  program_id?: string;
  nama_penjaga?: string;
  telefon_penjaga?: string;
  emel?: string;
  bilangan?: string | number;
  senarai_anak?: string;
  maklumat_kesihatan?: string;
  url_resit?: string;
  kebenaran_ibubapa?: boolean;
  kebenaran_foto?: boolean;
}): Promise<{ ok: boolean; msg?: string }> {
  const program_id = String(data.program_id ?? "");
  const penjaga = (data.nama_penjaga ?? "").trim();
  const telefon = (data.telefon_penjaga ?? "").trim();
  const emel = (data.emel ?? "").trim().toLowerCase();
  const bilangan = Math.max(1, Math.floor(Number(data.bilangan) || 1));
  const senarai = (data.senarai_anak ?? "").trim();

  if (!program_id) return { ok: false, msg: "Program tidak sah." };
  if (!penjaga || !telefon) return { ok: false, msg: "Sila isi nama & no. telefon ibu bapa/penjaga." };
  if (!emel || !emel.includes("@")) return { ok: false, msg: "Sila isi e-mel yang sah untuk pengesahan." };
  if (!senarai) return { ok: false, msg: "Sila isi nama anak yang didaftarkan." };
  if (!data.url_resit) return { ok: false, msg: "Sila muat naik resit/bukti bayaran." };
  if (!data.kebenaran_ibubapa) return { ok: false, msg: "Kebenaran ibu bapa/penjaga diperlukan untuk menyertai." };

  const db = createAdminClient();
  const { data: pr } = await db.from("program").select("*").eq("id", program_id).single();
  const p: any = pr;
  if (!p) return { ok: false, msg: "Program tidak dijumpai." };
  if (!p.berbayar) return { ok: false, msg: "Program ini bukan pendaftaran berbayar." };
  if (!p.rsvp_dibuka) return { ok: false, msg: "Pendaftaran ditutup." };

  // Had peserta — kira bilangan yang sudah dibayar + menunggu pengesahan.
  if (p.had_peserta) {
    const { data: sedia } = await db
      .from("program_pendaftaran")
      .select("bilangan, status_bayar")
      .eq("program_id", program_id)
      .in("status_bayar", ["dibayar", "menunggu_sah"]);
    const terisi = ((sedia as any[]) ?? []).reduce((s, r) => s + Number(r.bilangan || 1), 0);
    if (terisi + bilangan > Number(p.had_peserta)) {
      const baki = Math.max(0, Number(p.had_peserta) - terisi);
      return { ok: false, msg: baki > 0 ? `Maaf, tinggal ${baki} tempat sahaja.` : "Maaf, pendaftaran telah penuh." };
    }
  }

  const yuran = Number(p.yuran || 0);
  const jumlah = yuran * bilangan;
  const namaPertama = senarai.split("\n").map((x) => x.trim()).filter(Boolean)[0] || penjaga;

  const { error } = await db.from("program_pendaftaran").insert({
    program_id,
    nama_peserta: namaPertama,
    senarai_anak: senarai,
    bilangan,
    nama_penjaga: penjaga,
    telefon_penjaga: telefon,
    emel,
    maklumat_kesihatan: (data.maklumat_kesihatan ?? "").trim() || null,
    kebenaran_ibubapa: !!data.kebenaran_ibubapa,
    kebenaran_foto: !!data.kebenaran_foto,
    url_resit: data.url_resit,
    status_bayar: "menunggu_sah",
    jumlah,
  });
  if (error) return { ok: false, msg: "Ralat menyimpan pendaftaran: " + error.message };

  revalidatePath(`/program/${program_id}`);
  revalidatePath("/admin/program");
  return { ok: true };
}

export async function rsvpProgram(formData: FormData) {
  const program_id = String(formData.get("program_id") ?? "");
  const nama = String(formData.get("nama") ?? "").trim();
  const telefonRaw = String(formData.get("telefon") ?? "").trim();
  const telDigit = telefonRaw.replace(/\D/g, "");
  const bil = Number(formData.get("bil_orang")) || 1;
  if (!program_id || !nama) return;

  const db = createAdminClient();

  const { data: p } = await db.from("program").select("had_peserta, rsvp_dibuka").eq("id", program_id).single();
  if (!p || !(p as any).rsvp_dibuka) return;

  // Elak pendua — cari rekod sedia ada ikut telefon (atau nama jika tiada telefon)
  const { data: senaraiSedia } = await db.from("rsvp").select("id, nama, telefon, bil_orang").eq("program_id", program_id);
  const semua = (senaraiSedia as any[]) ?? [];
  const sediaAda = semua.find((r) => {
    if (telDigit) return (r.telefon || "").replace(/\D/g, "") === telDigit;
    return (r.nama || "").trim().toLowerCase() === nama.toLowerCase() && !r.telefon;
  });

  // Hormati had peserta (tolak bil sedia ada jika sedang kemas kini)
  if ((p as any).had_peserta) {
    const jum = semua.reduce((s, r) => s + Number(r.bil_orang || 0), 0);
    const bilSedia = sediaAda ? Number(sediaAda.bil_orang || 0) : 0;
    if (jum - bilSedia + bil > (p as any).had_peserta) {
      redirect(`/program/${program_id}?rsvp=penuh`);
    }
  }

  if (sediaAda) {
    await db.from("rsvp").update({ nama, telefon: telefonRaw || null, bil_orang: bil }).eq("id", sediaAda.id);
  } else {
    await db.from("rsvp").insert({ program_id, nama, telefon: telefonRaw || null, bil_orang: bil });
  }

  revalidatePath("/program");
  revalidatePath(`/program/${program_id}`);
  revalidatePath("/admin/program");
  revalidatePath("/");
  redirect(`/program/${program_id}?rsvp=ok`);
}
