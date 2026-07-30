'use client';

export default function CetakBtn() {
  return (
    <button onClick={() => window.print()}
      className="no-print bg-ink text-white text-[13px] font-semibold px-4 py-2 rounded-full">
      Simpan PDF / Cetak
    </button>
  );
}
