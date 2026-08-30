"use client";

import { useFormStatus } from "react-dom";
import { padamProgram } from "@/app/admin/program/actions";

function Btn({ tajuk }: { tajuk: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        // Pengesahan BERGANDA — padam program buang program + SEMUA RSVP.
        if (!window.confirm(`Padam program "${tajuk}"?\n\nSEMUA RSVP / pendaftaran program ini akan turut dipadam.`)) {
          e.preventDefault();
          return;
        }
        if (!window.confirm(`Amaran terakhir: tindakan ini KEKAL dan tak boleh diundur.\n\nTekan OK untuk sahkan padam "${tajuk}".`)) {
          e.preventDefault();
        }
      }}
      className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
    >
      {pending ? "Memadam…" : "Padam"}
    </button>
  );
}

export default function PadamProgramButton({ id, tajuk }: { id: string; tajuk: string }) {
  return (
    <form action={padamProgram}>
      <input type="hidden" name="id" value={id} />
      <Btn tajuk={tajuk} />
    </form>
  );
}
