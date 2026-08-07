import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Borang vendor lama sudah digantikan dengan flow Pembekal bergerbang
// (Individu / Syarikat). Alihkan ke pendaftaran pembekal baharu.
export default function VendorPage() {
  redirect("/pembekal/daftar");
}
