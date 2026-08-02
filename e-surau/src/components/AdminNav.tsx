"use client";

import Link from "next/link";
import { useState } from "react";

type Item = { href: string; label: string };
type Kump = { label: string; items: Item[] };

// Kumpulan untuk admin/AJK/master
const KEAHLIAN: Item[] = [
  { href: "/admin/kariah-kawasan", label: "Kawasan / Fasa" },
  { href: "/admin/cetak", label: "Cetak Borang" },
];
const KEWANGAN: Item[] = [
  { href: "/admin/kewangan", label: "Kewangan" },
  { href: "/admin/khairat", label: "Khairat" },
  { href: "/admin/tuntutan", label: "Tuntutan" },
];
const AKTIVITI: Item[] = [
  { href: "/admin/program", label: "Program" },
  { href: "/admin/tahlil", label: "Tahlil" },
  { href: "/admin/sewaan", label: "Sewaan" },
  { href: "/admin/aset", label: "Aset" },
  { href: "/admin/vendor", label: "Vendor" },
];
const SETIAUSAHA: Item[] = [
  { href: "/admin/su", label: "Panel Setiausaha" },
  { href: "/admin/su/mesyuarat", label: "Minit Mesyuarat" },
  { href: "/admin/su/surat", label: "Surat Rasmi" },
  { href: "/admin/pengumuman", label: "Pengumuman" },
  { href: "/admin/maklum-balas", label: "Maklum Balas" },
  { href: "/admin/kandungan", label: "Kandungan Surau" },
];
const SISTEM: Item[] = [
  { href: "/admin/penaja", label: "Penaja" },
  { href: "/admin/peranan", label: "Peranan" },
  { href: "/admin/tetapan", label: "Tetapan" },
];

export default function AdminNav({ aktif, nama, peranan, master }: { aktif: string; nama?: string; peranan?: string; master?: boolean }) {
  // Peranan terhad — kekal ringkas (flat)
  if (peranan === "bendahari" || peranan === "imam") {
    const pautan = peranan === "bendahari"
      ? [{ href: "/admin/kewangan", label: "Kewangan" }, { href: "/admin/tuntutan", label: "Tuntutan" }]
      : [{ href: "/admin/tahlil", label: "Tahlil" }];
    return (
      <Bar nama={nama}>
        <nav className="flex flex-wrap gap-1">
          {pautan.map((p) => <TabLink key={p.href} item={p} aktif={aktif} />)}
        </nav>
      </Bar>
    );
  }

  // Admin / AJK / Master — berkumpul
  const kumpulan: Kump[] = [
    { label: "Keahlian", items: KEAHLIAN },
    { label: "Kewangan", items: KEWANGAN },
    { label: "Aktiviti", items: AKTIVITI },
    { label: "Setiausaha", items: SETIAUSAHA },
  ];
  if (master) kumpulan.push({ label: "Sistem", items: SISTEM });

  return (
    <Bar nama={nama}>
      <nav className="flex flex-wrap items-center gap-1">
        <TabLink item={{ href: "/admin", label: "Permohonan" }} aktif={aktif} />
        <TabLink item={{ href: "/admin/staf", label: "Staf" }} aktif={aktif} />
        {kumpulan.map((k) => <TabDropdown key={k.label} kump={k} aktif={aktif} />)}
      </nav>
    </Bar>
  );
}

function Bar({ nama, children }: { nama?: string; children: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b pb-3">
      {children}
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <Link href="/ahli" className="rounded-lg border border-surau/40 px-3 py-1 font-medium text-surau hover:bg-surau/10">Portal Saya</Link>
        {nama && <span className="hidden sm:inline">{nama}</span>}
        <form action="/masuk/logout" method="post"><button className="hover:underline">Log keluar</button></form>
      </div>
    </div>
  );
}

function TabLink({ item, aktif }: { item: Item; aktif: string }) {
  return (
    <Link href={item.href} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${aktif === item.href ? "bg-surau text-white" : "text-slate-600 hover:bg-slate-100"}`}>
      {item.label}
    </Link>
  );
}

function TabDropdown({ kump, aktif }: { kump: Kump; aktif: string }) {
  const [buka, setBuka] = useState(false);
  const aktifDlm = kump.items.some((i) => aktif === i.href || aktif.startsWith(i.href + "/"));
  return (
    <div className="relative">
      <button
        onClick={() => setBuka((v) => !v)}
        onBlur={() => setTimeout(() => setBuka(false), 150)}
        className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium ${aktifDlm ? "bg-surau text-white" : "text-slate-600 hover:bg-slate-100"}`}
      >
        {kump.label} <span className={`text-[10px] transition-transform ${buka ? "rotate-180" : ""}`}>▾</span>
      </button>
      {buka && (
        <div className="absolute left-0 top-full z-40 mt-1 min-w-[190px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {kump.items.map((i) => (
            <Link key={i.href} href={i.href} className={`block px-4 py-2 text-sm ${aktif === i.href ? "bg-surau/10 font-semibold text-surau" : "text-slate-700 hover:bg-surau/10 hover:text-surau"}`}>
              {i.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
