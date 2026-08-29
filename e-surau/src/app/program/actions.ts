"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { chipConfigured, ciptaPurchase, siteUrl } from "@/lib/chip";
import { kenalKawasan } from "@/lib/kawasan";
import { namaKemas, telefonLokal } from "@/lib/format";

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

// Maklum balas awam bagi sesuatu program/aktiviti (selepas program).
// Hanya diterima bila suis maklumbalas_dibuka = true.
export async function hantarMaklumBalasProgram(data: {
  program_id?: string;
  rating?: number | string;
  apa_baik?: string;
  cadangan?: string;
  nama?: string;
}): Promise<{ ok: boolean; msg?: string }> {
  const program_id = String(data.program_id ?? "");
  const rating = Math.round(Number(data.rating) || 0);
  if (!program_id) return { ok: false, msg: "Program tidak sah." };
  if (rating < 1 || rating > 5) return { ok: false, msg: "Sila pilih penilaian bintang (1–5)." };

  const db = createAdminClient();
  const { data: pr } = await db.from("program").select("maklumbalas_dibuka").eq("id", program_id).maybeSingle();
  if (!pr) return { ok: false, msg: "Program tidak dijumpai." };
  if (!(pr as any).maklumbalas_dibuka) return { ok: false, msg: "Borang maklum balas program ini telah ditutup." };

  const { error } = await db.from("program_maklumbalas").insert({
    program_id,
    rating,
    apa_baik: (data.apa_baik ?? "").trim() || null,
    cadangan: (data.cadangan ?? "").trim() || null,
    nama: (data.nama ?? "").trim() || null,
  });
  if (error) return { ok: false, msg: "Ralat menghantar: " + error.message };

  revalidatePath(`/admin/program/${program_id}`);
  return { ok: true };
}

// Check-in kehadiran (peserta self-scan QR di pintu → masuk no. phone).
// Padan dengan RSVP ikut telefon + kesan sama ada ahli kariah berdaftar &
// asal (kariah tempatan / luar). Jika bukan ahli & tiada RSVP → minta nama+asal.
// Hanya diterima bila suis checkin_dibuka = true.
export async function checkInKehadiran(data: {
  program_id?: string;
  telefon?: string;
  nama?: string;
  bil_orang?: number | string;
  asal?: string; // 'tempatan' | 'luar' — hanya untuk walk-in bukan ahli
}): Promise<{
  ok: boolean;
  status?: "hadir" | "sudah" | "walkin" | "perlu_nama";
  nama?: string;
  bil?: number;
  adalah_ahli?: boolean;
  asal?: string;
  msg?: string;
}> {
  const program_id = String(data.program_id ?? "");
  const telDigit = String(data.telefon ?? "").replace(/\D/g, "");
  if (!program_id) return { ok: false, msg: "Program tidak sah." };
  if (telDigit.length < 6) return { ok: false, msg: "Sila masukkan no. telefon yang sah." };

  const db = createAdminClient();
  const { data: pr } = await db.from("program").select("checkin_dibuka").eq("id", program_id).maybeSingle();
  if (!pr) return { ok: false, msg: "Program tidak dijumpai." };
  if (!(pr as any).checkin_dibuka) return { ok: false, msg: "Check-in untuk program ini belum dibuka. Sila hubungi AJK." };

  // Kesan ahli kariah berdaftar ikut telefon (padan digit).
  const { data: ahliRows } = await db.from("ahli_kariah").select("id, nama, alamat, kawasan, telefon");
  const ahli = ((ahliRows as any[]) ?? []).find((a) => (a.telefon || "").replace(/\D/g, "") === telDigit && telDigit.length >= 9);
  const adalahAhli = !!ahli;
  const asalAhli = ahli ? (kenalKawasan(ahli.alamat, ahli.kawasan).kod === "lain" ? "luar" : "tempatan") : null;

  // Cari RSVP ikut telefon (padan digit).
  const { data: senarai } = await db.from("rsvp").select("id, nama, telefon, bil_orang, hadir").eq("program_id", program_id);
  const sedia = ((senarai as any[]) ?? []).find((r) => (r.telefon || "").replace(/\D/g, "") === telDigit);

  if (sedia) {
    const patch: any = { adalah_ahli: adalahAhli, ahli_id: ahli?.id ?? null };
    if (asalAhli) patch.asal = asalAhli;
    if (sedia.hadir) {
      await db.from("rsvp").update(patch).eq("id", sedia.id);
      return { ok: true, status: "sudah", nama: sedia.nama, bil: Number(sedia.bil_orang || 1), adalah_ahli: adalahAhli, asal: asalAhli ?? undefined };
    }
    await db.from("rsvp").update({ ...patch, hadir: true, hadir_pada: new Date().toISOString() }).eq("id", sedia.id);
    revalidatePath(`/admin/program/${program_id}`);
    return { ok: true, status: "hadir", nama: sedia.nama, bil: Number(sedia.bil_orang || 1), adalah_ahli: adalahAhli, asal: asalAhli ?? undefined };
  }

  // Tiada RSVP.
  const bil = Math.max(1, Math.floor(Number(data.bil_orang) || 1));

  if (ahli) {
    // Ahli berdaftar tapi tak RSVP → check-in terus (nama & asal diketahui).
    await db.from("rsvp").insert({
      program_id, nama: namaKemas(ahli.nama), telefon: telefonLokal(String(data.telefon ?? "")) || null,
      bil_orang: bil, hadir: true, hadir_pada: new Date().toISOString(), walk_in: true,
      adalah_ahli: true, ahli_id: ahli.id, asal: asalAhli,
    });
    revalidatePath(`/admin/program/${program_id}`);
    return { ok: true, status: "walkin", nama: ahli.nama, bil, adalah_ahli: true, asal: asalAhli ?? undefined };
  }

  // Bukan ahli & tiada RSVP → perlu nama + asal.
  const nama = namaKemas(String(data.nama ?? ""));
  const asal = String(data.asal ?? "").trim();
  if (!nama || (asal !== "tempatan" && asal !== "luar")) return { ok: true, status: "perlu_nama", adalah_ahli: false };

  const { error } = await db.from("rsvp").insert({
    program_id, nama, telefon: telefonLokal(String(data.telefon ?? "")) || null,
    bil_orang: bil, hadir: true, hadir_pada: new Date().toISOString(), walk_in: true,
    adalah_ahli: false, asal,
  });
  if (error) return { ok: false, msg: "Ralat menyimpan kehadiran: " + error.message };

  revalidatePath(`/admin/program/${program_id}`);
  return { ok: true, status: "walkin", nama, bil, adalah_ahli: false, asal };
}

export async function rsvpProgram(formData: FormData) {
  const program_id = String(formData.get("program_id") ?? "");
  const nama = namaKemas(String(formData.get("nama") ?? ""));
  const telefonRaw = telefonLokal(String(formData.get("telefon") ?? ""));
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
