import { tarikhMs } from "@/lib/format";

export type LangkahProgres = { label: string; tarikh?: string | null; done: boolean };

// Tracker progres tuntutan (paparan penuntut) — tunjuk sudah sampai peringkat mana & bila.
export default function ProgresTuntutan({ langkah, ditolak, sebab }: { langkah: LangkahProgres[]; ditolak?: boolean; sebab?: string | null }) {
  if (ditolak) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
        Tuntutan ini <b>ditolak</b>.{sebab ? ` Sebab: ${sebab}` : ""}
      </div>
    );
  }
  return (
    <ol className="relative ml-1 border-l-2 border-slate-200 pl-0">
      {langkah.map((s, i) => (
        <li key={i} className="mb-4 ml-5 last:mb-0">
          <span className={`absolute -left-[9px] mt-0.5 h-4 w-4 rounded-full border-2 border-white ${s.done ? "bg-green-600" : "bg-slate-300"}`} />
          <div className={`text-sm font-medium ${s.done ? "text-slate-800" : "text-slate-400"}`}>{s.label}</div>
          <div className="text-xs text-slate-400">{s.tarikh ? tarikhMs(s.tarikh) : s.done ? "Selesai" : "Menunggu"}</div>
        </li>
      ))}
    </ol>
  );
}
