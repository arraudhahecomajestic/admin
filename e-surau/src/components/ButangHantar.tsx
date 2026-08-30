"use client";

import { useFormStatus } from "react-dom";

// Butang submit universal untuk borang server-action.
// Auto-disable + tukar teks semasa borang sedang dihantar → elak hantar berulang.
export default function ButangHantar({
  children,
  className,
  pendingText = "Sila tunggu…",
  konfirmasi,
}: {
  children: React.ReactNode;
  className?: string;
  pendingText?: string;
  // Jika diisi: papar dialog pengesahan sebelum borang dihantar.
  // Guna untuk tindakan berisiko (padam, buang akaun) supaya tak terpadam tak sengaja.
  konfirmasi?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={className}
      onClick={(e) => {
        if (konfirmasi && !window.confirm(konfirmasi)) e.preventDefault();
      }}
    >
      {pending ? pendingText : children}
    </button>
  );
}
