"use client";

import { useFormStatus } from "react-dom";

// Butang submit universal untuk borang server-action.
// Auto-disable + tukar teks semasa borang sedang dihantar → elak hantar berulang.
export default function ButangHantar({
  children,
  className,
  pendingText = "Sila tunggu…",
}: {
  children: React.ReactNode;
  className?: string;
  pendingText?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={className}>
      {pending ? pendingText : children}
    </button>
  );
}
