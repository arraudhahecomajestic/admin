"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { getProfil, isPentadbir } from "@/lib/sesi";

const tahunSemasa = () => new Date().getFullYear();
const hariIni = () => new Date().toISOString().slice(0, 10);

// Kutip yuran khairat tahunan: rekod yuran (status) + kutipan (wang + resit)
export async function bayarYuran(
  keahlianId: string,
  ahliId: string | null,
  formData: FormData
) {
  if (!isPentadbir(await getProfil())) return;
  const db = createAdminClient();
  const tahun = Number(formData.get("tahun")) || tahunSemasa();
  const kaedah = String(formData.get("kaedah") ?? "tunai");

  // 1) Rekod/kemas kini yuran tahun ini (trigger akan segar status keahlian)
  await db
    .from("yuran_khairat")
    .upsert(
      { keahlian_id: keahlianId, tahun, jumlah: 60, lunas: true, tarikh_bayar: hariIni() },
      { onConflict: "keahlian_id,tahun" }
    );

  // 2) Rekod wang sebagai kutipan (kategori Yuran Khairat) untuk resit & tabung
  const { data: kat } = await db
    .from("kategori_kutipan")
    .select("id")
    .eq("nama", "Yuran Khairat")
    .single();

  if (kat) {
    await db.from("kutipan").insert({
      kategori_id: kat.id,
      jumlah: 60,
      kaedah,
      ahli_id: ahliId,
      catatan: `Yuran khairat tahun ${tahun}`,
      tarikh: hariIni(),
      direkod_oleh: "admin",
    });
  }

  revalidatePath("/admin/khairat");
  revalidatePath("/admin/kewangan");
}

// Buat tuntutan kematian — dengan semakan kelayakan (yuran mesti lunas)
export async function buatTuntutan(formData: FormData) {
  if (!isPentadbir(await getProfil())) return;
  const db = createAdminClient();

  const keahlianId = String(formData.get("keahlian_id") ?? "");
  if (!keahlianId) redirect("/admin/khairat?ralat=data");

  // Semak kelayakan: keahlian mesti 'aktif' (yuran tahun semasa lunas)
  const { data: keahlian } = await db
    .from("keahlian_khairat")
    .select("status")
    .eq("id", keahlianId)
    .single();

  if (!keahlian || keahlian.status !== "aktif") {
    redirect("/admin/khairat?ralat=tak_layak");
  }

  const tanggunganId = String(formData.get("tanggungan_id") ?? "");
  await db.from("tuntutan_khairat").insert({
    keahlian_id: keahlianId,
    jenis_si_mati: String(formData.get("jenis_si_mati") ?? "ahli"),
    tanggungan_id: tanggunganId || null,
    nama_si_mati: String(formData.get("nama_si_mati") ?? ""),
    tarikh_kematian: String(formData.get("tarikh_kematian") ?? "") || hariIni(),
    nama_waris: String(formData.get("nama_waris") ?? "") || null,
    telefon_waris: String(formData.get("telefon_waris") ?? "") || null,
    catatan: String(formData.get("catatan") ?? "") || null,
    // jumlah_pampasan guna default DB (RM1400)
  });

  revalidatePath("/admin/khairat");
  redirect("/admin/khairat?ok=tuntutan");
}

export async function tukarStatusTuntutan(
  id: string,
  status: "lulus" | "dibayar" | "tolak"
) {
  if (!isPentadbir(await getProfil())) return;
  const db = createAdminClient();
  const patch: any = { status };
  if (status === "dibayar") patch.tarikh_bayar = hariIni();
  await db.from("tuntutan_khairat").update(patch).eq("id", id);
  revalidatePath("/admin/khairat");
  revalidatePath("/admin/kewangan");
}
