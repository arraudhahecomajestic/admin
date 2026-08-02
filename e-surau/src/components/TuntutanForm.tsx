"use client";

import { useMemo, useState } from "react";
import { buatTuntutan } from "@/app/admin/khairat/actions";

export type KeahlianRingkas = {
  keahlian_id: string;
  nama_ahli: string;
  no_khairat: string | null;
  status: string;
  ahli_id: string;
  tanggungan: { id: string; nama: string; dilindungi_khairat: boolean }[];
};

export default function TuntutanForm({ senarai }: { senarai: KeahlianRingkas[] }) {
  const [keahlianId, setKeahlianId] = useState("");
  const [jenis, setJenis] = useState<"ahli" | "tanggungan">("ahli");
  const [tanggunganId, setTanggunganId] = useState("");

  const dipilih = useMemo(
    () => senarai.find((s) => s.keahlian_id === keahlianId),
    [senarai, keahlianId]
  );
  const tggDilindungi = (dipilih?.tanggungan ?? []).filter((t) => t.dilindungi_khairat);

  const namaSiMati =
    jenis === "ahli"
      ? dipilih?.nama_ahli ?? ""
      : tggDilindungi.find((t) => t.id === tanggunganId)?.nama ?? "";

  const takLayak = dipilih && dipilih.status !== "aktif";

  return (
    <form action={buatTuntutan} className="space-y-3">
      <select
        name="keahlian_id"
        required
        value={keahlianId}
        onChange={(e) => {
          setKeahlianId(e.target.value);
          setJenis("ahli");
          setTanggunganId("");
        }}
        className="inp"
      >
        <option value="">— Pilih ahli khairat —</option>
        {senarai.map((s) => (
          <option key={s.keahlian_id} value={s.keahlian_id}>
            {s.no_khairat} · {s.nama_ahli} ({s.status})
          </option>
        ))}
      </select>

      {takLayak && (
        <p className="rounded-lg bg-red-50 p-2 text-xs text-red-700">
          Keahlian ini <b>tertunggak yuran</b>. Tuntutan tidak layak sehingga
          yuran tahun semasa dijelaskan.
        </p>
      )}

      <div className="flex gap-4 text-sm">
        <label className="flex items-center gap-1.5">
          <input type="radio" name="jenis_si_mati" value="ahli" checked={jenis === "ahli"} onChange={() => { setJenis("ahli"); setTanggunganId(""); }} />
          Ahli sendiri
        </label>
        <label className="flex items-center gap-1.5">
          <input type="radio" name="jenis_si_mati" value="tanggungan" checked={jenis === "tanggungan"} onChange={() => setJenis("tanggungan")} />
          Tanggungan
        </label>
      </div>

      {jenis === "tanggungan" && (
        <select
          value={tanggunganId}
          onChange={(e) => setTanggunganId(e.target.value)}
          className="inp"
          required
        >
          <option value="">— Pilih tanggungan dilindungi —</option>
          {tggDilindungi.map((t) => (
            <option key={t.id} value={t.id}>{t.nama}</option>
          ))}
        </select>
      )}
      <input type="hidden" name="tanggungan_id" value={jenis === "tanggungan" ? tanggunganId : ""} />
      <input type="hidden" name="nama_si_mati" value={namaSiMati} />

      <div className="rounded-lg bg-slate-50 p-2 text-xs text-slate-600">
        Si mati: <b>{namaSiMati || "—"}</b> · Pampasan tetap: <b>RM1,400.00</b>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block text-xs text-slate-500">
          Tarikh kematian
          <input name="tarikh_kematian" type="date" required className="inp mt-1" />
        </label>
        <input name="nama_waris" placeholder="Nama waris" className="inp self-end" />
      </div>
      <input name="telefon_waris" placeholder="Telefon waris" className="inp" />
      <input name="catatan" placeholder="Catatan (pilihan)" className="inp" />

      <button
        disabled={!keahlianId || !!takLayak || !namaSiMati}
        className="w-full rounded-lg bg-surau px-4 py-2 font-semibold text-white hover:bg-surau-dark disabled:opacity-50"
      >
        Rekod Tuntutan
      </button>

      <style jsx global>{`
        .inp { width: 100%; border-radius: .5rem; border: 1px solid #cbd5e1; padding: .5rem .75rem; font-size: .875rem; outline: none; }
        .inp:focus { border-color: #0f766e; box-shadow: 0 0 0 2px rgba(15,118,110,.2); }
      `}</style>
    </form>
  );
}
