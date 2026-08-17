import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient, adminConfigured } from "@/lib/supabaseAdmin";
import { NAMA_SURAU } from "@/lib/tetapan";
import { tarikhMs } from "@/lib/format";
import ShareButton from "@/components/ShareButton";

export const dynamic = "force-dynamic";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://arraudhahecomajestic.com").replace(/\/$/, "");

type Buletin = {
  id: string;
  tajuk: string;
  keterangan: string | null;
  url_fail: string | null;
  jenis_fail: string | null;
  tarikh: string;
  diterbitkan: boolean;
  gambar: string[] | null;
};

async function ambilBuletin(id: string): Promise<Buletin | null> {
  if (!adminConfigured) return null;
  const db = createAdminClient();
  const { data } = await db
    .from("buletin")
    .select("id, tajuk, keterangan, url_fail, jenis_fail, tarikh, diterbitkan, gambar")
    .eq("id", id)
    .maybeSingle();
  const b = data as Buletin | null;
  if (!b || !b.diterbitkan) return null;
  return b;
}

// Senarai gambar untuk galeri (gabung url_fail imej lama + array gambar baharu).
function senaraiGambar(b: Buletin): string[] {
  const gs = new Set<string>();
  if (b.url_fail && b.jenis_fail === "imej") gs.add(b.url_fail);
  for (const g of b.gambar ?? []) if (g) gs.add(g);
  return Array.from(gs);
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const b = await ambilBuletin(params.id);
  if (!b) return { title: `Buletin · ${NAMA_SURAU}` };

  const tajuk = `${b.tajuk} · ${NAMA_SURAU}`;
  const perihal = (b.keterangan || "").replace(/\s+/g, " ").trim().slice(0, 200) || `Buletin ${NAMA_SURAU}`;
  const gambar = senaraiGambar(b);
  const url = `${SITE_URL}/buletin/${b.id}`;

  return {
    title: tajuk,
    description: perihal,
    openGraph: {
      title: b.tajuk,
      description: perihal,
      url,
      siteName: NAMA_SURAU,
      type: "article",
      locale: "ms_MY",
      images: gambar.length ? gambar.map((u) => ({ url: u })) : undefined,
    },
    twitter: {
      card: gambar.length ? "summary_large_image" : "summary",
      title: b.tajuk,
      description: perihal,
      images: gambar.length ? gambar : undefined,
    },
  };
}

export default async function BuletinArtikelPage({ params }: { params: { id: string } }) {
  const b = await ambilBuletin(params.id);
  if (!b) notFound();

  const gambar = senaraiGambar(b);
  const adaPdf = b.url_fail && b.jenis_fail === "pdf";

  return (
    <article className="mx-auto max-w-2xl space-y-5">
      <div>
        <Link href="/tentang#buletin" className="text-sm font-medium text-surau hover:underline">← Semua buletin</Link>
      </div>

      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-slate-900">{b.tajuk}</h1>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-slate-500">{tarikhMs(b.tarikh)} · {NAMA_SURAU}</div>
          <ShareButton tajuk={b.tajuk} path={`/buletin/${b.id}`} />
        </div>
      </header>

      {/* Gambar utama */}
      {gambar.length > 0 && (
        <div className="space-y-3">
          {gambar.map((u, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={u} alt={`${b.tajuk} — gambar ${i + 1}`} className="w-full rounded-xl object-contain" />
          ))}
        </div>
      )}

      {/* Konten */}
      {b.keterangan && (
        <div className="whitespace-pre-line text-[15px] leading-relaxed text-slate-700">{b.keterangan}</div>
      )}

      {/* PDF */}
      {adaPdf && (
        <a href={b.url_fail!} target="_blank" rel="noreferrer" className="inline-block rounded-lg bg-surau px-4 py-2 text-sm font-semibold text-white hover:bg-surau-dark">
          Buka PDF
        </a>
      )}

      <div className="border-t border-slate-100 pt-4">
        <ShareButton tajuk={b.tajuk} path={`/buletin/${b.id}`} />
      </div>
    </article>
  );
}
