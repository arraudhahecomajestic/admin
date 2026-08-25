import Link from "next/link";
import AkadPenaja from "@/components/AkadPenaja";

export const metadata = {
  title: "Akad Penajaan — Rakan Surau",
  description: "Terma & syarat akad penajaan Rakan Surau Ar Raudhah Eco Majestic.",
};

export default function AkadPage() {
  return (
    <div className="space-y-4">
      <AkadPenaja />
      <div className="text-center">
        <Link href="/rakan/sertai" className="text-sm text-surau hover:underline">&larr; Kembali ke borang tajaan</Link>
      </div>
    </div>
  );
}
