"use client";

import { useRouter } from "next/navigation";
import { tarikhMs } from "@/lib/format";

export default function PilihMinggu({ minggu, senarai, semasa }: { minggu: string; senarai: string[]; semasa: string }) {
  const router = useRouter();
  return (
    <label className="flex items-center gap-2 text-sm text-slate-600">
      <span className="font-medium">Papar senarai minggu:</span>
      <select
        value={minggu}
        onChange={(e) => router.push(`/tahlil?minggu=${e.target.value}`)}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-surau"
      >
        {senarai.map((m) => (
          <option key={m} value={m}>
            {tarikhMs(m)}{m === semasa ? " (semasa)" : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
