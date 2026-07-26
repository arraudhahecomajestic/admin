import Link from "next/link";

const pautanPenuh = [
  { href: "/admin", label: "Permohonan" },
  { href: "/admin/ahli", label: "Jejak Ahli" },
  { href: "/admin/kewangan", label: "Kewangan" },
  { href: "/admin/program", label: "Program" },
  { href: "/admin/sewaan", label: "Sewaan" },
  { href: "/admin/aset", label: "Aset" },
  { href: "/admin/khairat", label: "Khairat" },
  { href: "/admin/cetak", label: "Cetak Borang" },
];
const pautanBendahari = [{ href: "/admin/kewangan", label: "Kewangan" }];

export default function AdminNav({ aktif, nama, peranan }: { aktif: string; nama?: string; peranan?: string }) {
  const pautan = peranan === "bendahari" ? pautanBendahari : pautanPenuh;
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
        {nama && <span>👤 {nama}</span>}
        <form action="/masuk/logout" method="post">
          <button className="hover:underline">Log keluar</button>
        </form>
      </div>
    </div>
  );
}
