// Integrasi CHIP Collect (chip-in.asia) — gerbang pembayaran.
// Kunci disimpan sebagai Cloudflare Secret: CHIP_BRAND_ID & CHIP_SECRET_KEY.

const BASE = "https://gate.chip-in.asia/api/v1";

function cfg() {
  const brand = process.env.CHIP_BRAND_ID;
  const key = process.env.CHIP_SECRET_KEY;
  return { brand, key };
}

export function chipConfigured(): boolean {
  const { brand, key } = cfg();
  return Boolean(brand && key);
}

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://arraudhahecomajestic.com").replace(/\/$/, "");
}

export type PurchaseOpts = {
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

// Cipta Purchase → pulangkan { id, checkout_url, status, ... }
export async function ciptaPurchase(opts: PurchaseOpts): Promise<any> {
  const { brand, key } = cfg();
  if (!brand || !key) throw new Error("CHIP belum dikonfigurasi (CHIP_BRAND_ID / CHIP_SECRET_KEY).");

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
        products: [{ name: opts.productName.slice(0, 256), price: opts.amountCents }],
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

// Semak status sebenar sesuatu Purchase terus dari CHIP (untuk sahkan bayaran).
export async function statusPurchase(id: string): Promise<any> {
  const { key } = cfg();
  if (!key) throw new Error("CHIP belum dikonfigurasi.");
  const res = await fetch(`${BASE}/purchases/${id}/`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!res.ok) throw new Error(`CHIP ${res.status}`);
  return res.json();
}
