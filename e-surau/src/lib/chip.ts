// Integrasi CHIP Collect (chip-in.asia) — gerbang pembayaran.
// Kunci disimpan sebagai Cloudflare Secret.
//   Umum   : CHIP_BRAND_ID, CHIP_SECRET_KEY
//   Khairat: CHIP_KHAIRAT_BRAND_ID, CHIP_KHAIRAT_SECRET_KEY (akaun bank berasingan)
//            — jika tidak diset, fallback ke kunci umum (memudahkan testing).

import { FI_CHIP } from "@/lib/tetapan";

const BASE = "https://gate.chip-in.asia/api/v1";

export type Akaun = "umum" | "khairat";

function cfg(akaun: Akaun = "umum") {
  if (akaun === "khairat") {
    const brand = process.env.CHIP_KHAIRAT_BRAND_ID || process.env.CHIP_BRAND_ID;
    const key = process.env.CHIP_KHAIRAT_SECRET_KEY || process.env.CHIP_SECRET_KEY;
    return { brand, key };
  }
  return { brand: process.env.CHIP_BRAND_ID, key: process.env.CHIP_SECRET_KEY };
}

export function chipConfigured(akaun: Akaun = "umum"): boolean {
  const { brand, key } = cfg(akaun);
  return Boolean(brand && key);
}

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://arraudhahecomajestic.com").replace(/\/$/, "");
}

export type PurchaseOpts = {
  akaun?: Akaun;
  email: string;
  nama?: string;
  telefon?: string;
  amountCents: number; // dalam sen (RM1 = 100)
  productName: string;
  reference: string;
  success_redirect: string;
  failure_redirect: string;
  success_callback: string;
};

export async function ciptaPurchase(opts: PurchaseOpts): Promise<any> {
  const { brand, key } = cfg(opts.akaun ?? "umum");
  if (!brand || !key) throw new Error("CHIP belum dikonfigurasi (Brand ID / Secret Key).");

  const res = await fetch(`${BASE}/purchases/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      brand_id: brand,
      client: {
        email: opts.email,
        full_name: opts.nama || undefined,
        phone: opts.telefon || undefined,
      },
      purchase: {
        currency: "MYR",
        // Fi pemprosesan gerbang ditanggung pembayar (baris berasingan) — surau terima jumlah penuh.
        products:
          Math.round((FI_CHIP || 0) * 100) > 0
            ? [
                { name: opts.productName.slice(0, 256), price: opts.amountCents },
                { name: "Fi pemprosesan (gerbang bayaran)", price: Math.round(FI_CHIP * 100) },
              ]
            : [{ name: opts.productName.slice(0, 256), price: opts.amountCents }],
      },
      reference: opts.reference,
      success_redirect: opts.success_redirect,
      failure_redirect: opts.failure_redirect,
      success_callback: opts.success_callback,
    }),
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`CHIP ${res.status}: ${t.slice(0, 300)}`);
  }
  return res.json();
}

export async function statusPurchase(id: string, akaun: Akaun = "umum"): Promise<any> {
  const { key } = cfg(akaun);
  if (!key) throw new Error("CHIP belum dikonfigurasi.");
  const res = await fetch(`${BASE}/purchases/${id}/`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!res.ok) throw new Error(`CHIP ${res.status}`);
  return res.json();
}
