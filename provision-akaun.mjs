// Cipta akaun log masuk untuk ahli kariah sedia ada.
// Emel = emel dalam rekod; Kata laluan = No. KP (digit sahaja).
// Trigger handle_new_user akan auto-cipta profil & paut ahli_id ikut emel.
//
// Guna:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node provision-akaun.mjs        (dry-run: papar sahaja)
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... DO=1 node provision-akaun.mjs   (jalankan betul)

import { createClient } from "@supabase/supabase-js";

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RUN = process.env.DO === "1";

if (!URL || !KEY) {
  console.error("Perlu SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const db = createClient(URL, KEY, { auth: { persistSession: false } });
const emailOk = (e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);

const { data: ahli, error } = await db
  .from("ahli_kariah")
  .select("id, nama, emel, no_kp")
  .limit(2000);

if (error) {
  console.error("Gagal baca ahli_kariah:", error.message);
  process.exit(1);
}

console.log(`Jumlah rekod ahli: ${ahli.length}`);

const nampak = new Set();
const buat = [];
const langkau = { tiada_emel: 0, emel_tak_sah: 0, emel_berganda: 0, kp_tak_sah: 0 };

for (const a of ahli) {
  const emel = (a.emel || "").trim().toLowerCase();
  const kp = (a.no_kp || "").replace(/\D/g, "");
  if (!emel) { langkau.tiada_emel++; continue; }
  if (!emailOk(emel)) { langkau.emel_tak_sah++; continue; }
  if (kp.length < 6) { langkau.kp_tak_sah++; continue; }
  if (nampak.has(emel)) { langkau.emel_berganda++; continue; }
  nampak.add(emel);
  buat.push({ emel, kp, nama: a.nama });
}

console.log("Akan cipta akaun:", buat.length);
console.log("Dilangkau:", langkau);

if (!RUN) {
  console.log("\n[DRY-RUN] Tiada akaun dicipta. Set DO=1 untuk jalankan betul.");
  process.exit(0);
}

let ok = 0, wujud = 0, gagal = 0;
const gagalSenarai = [];
for (const m of buat) {
  const { error: e } = await db.auth.admin.createUser({
    email: m.emel,
    password: m.kp,
    email_confirm: true,
    user_metadata: { nama: m.nama },
  });
  if (!e) { ok++; }
  else if (/already been registered|already exists|duplicate/i.test(e.message)) { wujud++; }
  else { gagal++; gagalSenarai.push(`${m.emel}: ${e.message}`); }
  if ((ok + wujud + gagal) % 50 === 0) console.log(`  … ${ok + wujud + gagal}/${buat.length}`);
}

console.log(`\nSelesai. Dicipta: ${ok} · Sudah wujud: ${wujud} · Gagal: ${gagal}`);
if (gagalSenarai.length) {
  console.log("Gagal:");
  gagalSenarai.slice(0, 30).forEach((x) => console.log("  -", x));
}
