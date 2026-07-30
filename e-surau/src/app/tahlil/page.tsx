import Link from "next/link";
import { supabase, supabaseConfigured } from "@/lib/supabaseClient";
import { khamisPapar } from "@/lib/arwah";
import { tarikhMs } from "@/lib/format";
import TahlilForm from "@/components/TahlilForm";
import PilihMinggu from "@/components/PilihMinggu";
import { bayaranOnlineDibuka } from "@/lib/tetapanSistem";

export const dynamic = "force-dynamic";

export default async function TahlilPage({ searchParams }: { searchParams: { minggu?: string } }) {
  const semasa = khamisPapar();
  const minggu = searchParams.minggu || semasa;
  const bayaranDibuka = await bayaranOnlineDibuka();
  let arwah: any[] = [];
  let mingguList: string[] = [];
  if (supabaseConfigured) {
    const { data } = await supabase.from("v_arwah_akan").select("*").eq("minggu", minggu);
    arwah = (data as any[]) ?? [];
    const { data: mgu } = await supabase.from("v_arwah_akan").select("minggu").order("minggu", { ascending: false });
    mingguList = [...new Set(((mgu as any[]) ?? []).map((m) => m.minggu))];
    if (!mingguList.includes(semasa)) mingguList.unshift(semasa);
  }
  const lelaki = arwah.filter((a) => a.jantina === "lelaki");
  const perempuan = arwah.filter((a) => a.jantina === "perempuan");
  const lain = arwah.filter((a) => a.jantina === "tidak_pasti");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Yaasin & Tahlil — Malam Jumaat</h1>
        <p className="mt-1 text-sm text-slate-600">
          Bacaan Yaasin & Tahlil setiap malam Jumaat selepas Maghrib. Hantar nama arwah ahli keluarga
          untuk disebut dalam sesi <b>{tarikhMs(minggu)}</b>.
        </p>
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          ⏰ <b>Waktu tutup:</b> Nama yang dihantar <b>sebelum 7:00 malam hari Khamis</b> akan dibawa
          ke majlis malam Jumaat tersebut. Nama selepas itu akan dikumpulkan untuk majlis Khamis berikutnya.
        </div>
      </div>

      <TahlilForm bayaranDibuka={bayaranDibuka} />

      {mingguList.length > 1 && (
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <PilihMinggu minggu={minggu} senarai={mingguList} semasa={semasa} />
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2">
        <SenaraiArwah tajuk="Al-Marhum (Lelaki)" senarai={lelaki} />
        <SenaraiArwah tajuk="Al-Marhumah (Perempuan)" senarai={perempuan} />
      </section>
      {lain.length > 0 && <SenaraiArwah tajuk="Belum dipastikan" senarai={lain} />}

      <p className="text-center">
        <Link href="/" className="text-sm text-slate-500 hover:underline">← Kembali ke laman utama</Link>
      </p>
    </div>
  );
}

function SenaraiArwah({ tajuk, senarai }: { tajuk: string; senarai: any[] }) {
  return (
    <div className="rounded-xl bg-white shadow-sm">
      <h2 className="border-b px-4 py-2 font-semibold text-slate-900">{tajuk} <span className="text-sm font-normal text-slate-400">({senarai.length})</span></h2>
      <ol className="list-decimal space-y-1 px-8 py-3 text-sm text-slate-700">
        {senarai.length === 0 && <p className="list-none text-slate-400">Tiada nama lagi.</p>}
        {senarai.map((a) => <li key={a.id}>{(a.nama || "").toUpperCase()}</li>)}
      </ol>
    </div>
  );
}
