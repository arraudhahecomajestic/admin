import Link from "next/link";

const pautanPenuh = [
  { href: "/admin", label: "Permohonan" },
  { href: "/admin/ahli", label: "Jejak Ahli" },
  { href: "/admin/kariah-kawasan", label: "Kawasan" },
  { href: "/admin/kewangan", label: "Kewangan" },
  { href: "/admin/program", label: "Program" },
  { href: "/admin/tahlil", label: "Tahlil" },
  { href: "/admin/sewaan", label: "Sewaan" },
  { href: "/admin/vendor", label: "Vendor" },
  { href: "/admin/aset", label: "Aset" },
  { href: "/admin/khairat", label: "Khairat" },
  { href: "/admin/tuntutan", label: "Tuntutan" },
  { href: "/admin/staf", label: "Staf" },
  { href: "/admin/cetak", label: "Cetak Borang" },
];
const pautanBendahari = [
  { href: "/admin/kewangan", label: "Kewangan" },
  { href: "/admin/tuntutan", label: "Tuntutan" },
];
const pautanImam = [{ href: "/admin/tahlil", label: "Tahlil" }];

export default function AdminNav({ aktif, nama, peranan, master }: { aktif: string; nama?: string; peranan?: string; master?: boolean }) {
  let pautan = pautanPenuh;
  if (peranan === "bendahari") pautan = pautanBendahari;
  else if (peranan === "imam") pautan = pautanImam;
  else pautan = [...pautanPenuh, { href: "/admin/kandungan", label: "Kandungan" }];
  if (master) pautan = [...pautanPenuh, { href: "/admin/kandungan", label: "Kandungan" }, { href: "/admin/penaja", label: "Penaja" }, { href: "/admin/peranan", label: "Peranan" }, { href: "/admin/tetapan", label: "Tetapan" }];
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b pb-3">
      <nav className="flex flex-wrap gap-1">
        {pautan.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              aktif === p.href
                ? "bg-surau text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {p.label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <Link href="/ahli" className="rounded-lg border border-surau/40 px-3 py-1 font-medium text-surau hover:bg-surau/10">
          Portal Saya
        </Link>
        {nama && <span>👤 {nama}</span>}
        <form action="/masuk/logout" method="post">
          <button className="hover:underline">Log keluar</button>
        </form>
      </div>
    </div>
  );
}
