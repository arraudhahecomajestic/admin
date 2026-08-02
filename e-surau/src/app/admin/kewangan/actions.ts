"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { getProfil, bolehKewangan } from "@/lib/sesi";

export async function tambahKutipan(formData: FormData) {
  if (!bolehKewangan(await getProfil())) return;
  const db = createAdminClient();
  const ahli = String(formData.get("ahli_id") ?? "");
  await db.from("kutipan").insert({
    kategori_id: Number(formData.get("kategori_id")),
    jumlah: Number(formData.get("jumlah")),
    kaedah: String(formData.get("kaedah") ?? "tunai"),
    ahli_id: ahli || null,
    catatan: String(formData.get("catatan") ?? "") || null,
    tarikh: String(formData.get("tarikh") ?? "") || new Date().toISOString().slice(0, 10),
    direkod_oleh: "admin",
  });
  revalidatePath("/admin/kewangan");
}

export async function tambahBelanja(formData: FormData) {
  if (!bolehKewangan(await getProfil())) return;
  const db = createAdminClient();
  await db.from("perbelanjaan").insert({
    kategori_id: Number(formData.get("kategori_id")),
    jumlah: Number(formData.get("jumlah")),
    keterangan: String(formData.get("keterangan") ?? ""),
    bayar_kepada: String(formData.get("bayar_kepada") ?? "") || null,
    cara_bayar: String(formData.get("cara_bayar") ?? "") || null,
    no_rujukan_bayar: String(formData.get("no_rujukan_bayar") ?? "") || null,
    dari_khairat: String(formData.get("dari_khairat") ?? "") === "on",
    tarikh: String(formData.get("tarikh") ?? "") || new Date().toISOString().slice(0, 10),
    direkod_oleh: "admin",
  });
  revalidatePath("/admin/kewangan");
}

// ---- Import CSV bulanan: kutipan (Masuk) & perbelanjaan (Keluar) sekali gus ----
function normalTarikh(s: string): string | null {
  const t = (s || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const m = t.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/); // DD/MM/YYYY
  if (m) {
    const d = m[1].padStart(2, "0"), mo = m[2].padStart(2, "0");
    return `${m[3]}-${mo}-${d}`;
  }
  return null;
}

export type BarisCsv = { jenis: string; tarikh: string; kategori: string; jumlah: string | number; keterangan?: string; kaedah?: string };

export async function importKewanganCsv(rows: BarisCsv[]): Promise<{ ok: boolean; masuk: number; keluar: number; jumMasuk: number; jumKeluar: number; gagal: number; ralat: string[]; msg?: string }> {
  const p = await getProfil();
  const kosong = { ok: false, masuk: 0, keluar: 0, jumMasuk: 0, jumKeluar: 0, gagal: 0, ralat: [] as string[] };
  if (!bolehKewangan(p)) return { ...kosong, msg: "Tiada akses." };
  if (!Array.isArray(rows) || rows.length === 0) return { ...kosong, msg: "Fail kosong atau tiada baris data." };

  const db = createAdminClient();
  const oleh = (p?.nama ?? p?.emel ?? "bendahari") + " (CSV)";
  const cacheK = new Map<string, number>();
  const cacheB = new Map<string, number>();

  async function katKutipan(nama: string): Promise<number> {
    const key = nama.toLowerCase();
    if (cacheK.has(key)) return cacheK.get(key)!;
    const { data } = await db.from("kategori_kutipan").select("id").ilike("nama", nama).maybeSingle();
    let id = (data as any)?.id;
    if (!id) { const { data: b } = await db.from("kategori_kutipan").insert({ nama, jenis_khairat: false, papar_awam: false }).select("id").single(); id = (b as any)?.id; }
    cacheK.set(key, id); return id;
  }
  async function katBelanja(nama: string): Promise<number> {
    const key = nama.toLowerCase();
    if (cacheB.has(key)) return cacheB.get(key)!;
    const { data } = await db.from("kategori_belanja").select("id").ilike("nama", nama).maybeSingle();
    let id = (data as any)?.id;
    if (!id) { const { data: b } = await db.from("kategori_belanja").insert({ nama }).select("id").single(); id = (b as any)?.id; }
    cacheB.set(key, id); return id;
  }

  const MASUK = ["masuk", "income", "in", "kutipan", "+", "pendapatan"];
  const KELUAR = ["keluar", "expense", "out", "belanja", "perbelanjaan", "-"];
  const KAEDAH_SAH = ["tunai", "online", "cek"];
  let masuk = 0, keluar = 0, jumMasuk = 0, jumKeluar = 0, gagal = 0;
  const ralat: string[] = [];
  const barisKutipan: any[] = [];
  const barisBelanja: any[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]; const baris = i + 2;
    const jenis = String(r.jenis ?? "").trim().toLowerCase();
    const jumlah = Number(String(r.jumlah ?? "").replace(/[^0-9.\-]/g, ""));
    const tarikh = normalTarikh(String(r.tarikh ?? ""));
    const kategori = String(r.kategori ?? "").trim();
    const keterangan = String(r.keterangan ?? "").trim();
    if (!jumlah || jumlah <= 0) { gagal++; if (ralat.length < 25) ralat.push(`Baris ${baris}: jumlah tidak sah.`); continue; }
    if (!kategori) { gagal++; if (ralat.length < 25) ralat.push(`Baris ${baris}: kategori kosong.`); continue; }
    if (!tarikh) { gagal++; if (ralat.length < 25) ralat.push(`Baris ${baris}: tarikh tidak sah.`); continue; }
    const isMasuk = MASUK.includes(jenis), isKeluar = KELUAR.includes(jenis);
    if (!isMasuk && !isKeluar) { gagal++; if (ralat.length < 25) ralat.push(`Baris ${baris}: Jenis mesti 'Masuk' atau 'Keluar'.`); continue; }
    try {
      if (isMasuk) {
        const kid = await katKutipan(kategori);
        let kaedah = String(r.kaedah ?? "tunai").trim().toLowerCase();
        if (!KAEDAH_SAH.includes(kaedah)) kaedah = "tunai";
        barisKutipan.push({ kategori_id: kid, jumlah, kaedah, catatan: keterangan || null, tarikh, direkod_oleh: oleh });
        masuk++; jumMasuk += jumlah;
      } else {
        const kid = await katBelanja(kategori);
        barisBelanja.push({ kategori_id: kid, jumlah, keterangan: keterangan || kategori, tarikh, dari_khairat: false, direkod_oleh: oleh });
        keluar++; jumKeluar += jumlah;
      }
    } catch (e: any) { gagal++; if (ralat.length < 25) ralat.push(`Baris ${baris}: ${e?.message ?? "ralat simpan"}`); }
  }

  // Batch insert (chunk 200) — laju & elak had permintaan
  const chunk = <T,>(arr: T[], n: number) => { const o: T[][] = []; for (let i = 0; i < arr.length; i += n) o.push(arr.slice(i, i + n)); return o; };
  for (const c of chunk(barisKutipan, 200)) { const { error } = await db.from("kutipan").insert(c); if (error) { masuk -= c.length; gagal += c.length; if (ralat.length < 25) ralat.push(`Kutipan: ${error.message}`); } }
  for (const c of chunk(barisBelanja, 200)) { const { error } = await db.from("perbelanjaan").insert(c); if (error) { keluar -= c.length; gagal += c.length; if (ralat.length < 25) ralat.push(`Belanja: ${error.message}`); } }

  revalidatePath("/admin/kewangan");
  revalidatePath("/");
  return { ok: true, masuk, keluar, jumMasuk, jumKeluar, gagal, ralat: ralat.slice(0, 25) };
}

export async function padamKutipan(formData: FormData) {
  if (!bolehKewangan(await getProfil())) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const db = createAdminClient();
  await db.from("kutipan").delete().eq("id", id);
  revalidatePath("/admin/kewangan");
}

export async function padamBelanja(formData: FormData) {
  if (!bolehKewangan(await getProfil())) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const db = createAdminClient();
  await db.from("perbelanjaan").delete().eq("id", id);
  revalidatePath("/admin/kewangan");
}
