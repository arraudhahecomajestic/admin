import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Digabung ke /admin (Pengurusan Ahli Kariah).
export default function JejakAhliPage() {
  redirect("/admin");
}
