import Link from "next/link";

export function PerluMasuk() {
  return (
    <div className="mx-auto max-w-sm rounded-xl bg-white p-6 text-center shadow-sm">
      <h1 className="text-lg font-bold text-slate-900">Perlu Log Masuk</h1>
      <p className="mt-1 text-sm text-slate-600">
        Halaman ini untuk AJK, bendahari & admin surau sahaja.
      </p>
      <Link
        href="/masuk"
        className="mt-4 inline-block rounded-lg bg-surau px-5 py-2.5 font-semibold text-white hover:bg-surau-dark"
      >
        Log Masuk
      </Link>
    </div>
  );
}

export function TiadaAkses() {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      Anda tiada kebenaran untuk halaman ini. Sila hubungi admin surau.
    </div>
  );
}
