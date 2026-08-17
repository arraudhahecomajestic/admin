"use client";

import { useRouter } from "next/navigation";
import { tukarStatusTender, padamTender, padamMinat } from "@/app/admin/tender/actions";
import { STATUS_TENDER } from "@/lib/tender";

export function TenderKawalan({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select defaultValue={status} onChange={async (e) => { await tukarStatusTender(id, e.target.value); router.refresh(); }}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm">
        {STATUS_TENDER.map((s) => <option key={s.kod} value={s.kod}>Status: {s.label}</option>)}
      </select>
      <a href={`/tender/${id}`} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Lihat halaman awam ↗</a>
      <button onClick={async () => { if (confirm("Padam tender ini & semua minat berkaitan?")) { await padamTender(id); router.push("/admin/tender"); } }}
        className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50">Padam Tender</button>
    </div>
  );
}

export function PadamMinatButton({ id, tenderId }: { id: string; tenderId: string }) {
  const router = useRouter();
  return (
    <button onClick={async () => { if (confirm("Padam rekod minat ini?")) { await padamMinat(id, tenderId); router.refresh(); } }}
      className="text-xs font-semibold text-red-500 hover:underline">Padam</button>
  );
}
