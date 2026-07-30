// CHIP Collect — helper API. Kunci dibaca dari env (Cloudflare secret).
// CHIP_BRAND_ID (text) + CHIP_SECRET_KEY (secret). CHIP_API_URL pilihan.

const BASE = (process.env.CHIP_API_URL || 'https://gate.chip-in.asia/api/v1').replace(/\/$/, '');

function creds() {
  const secret = process.env.CHIP_SECRET_KEY;
  const brand = process.env.CHIP_BRAND_ID;
  if (!secret || !brand) throw new Error('CHIP_SECRET_KEY / CHIP_BRAND_ID belum diset di Cloudflare.');
  return { secret, brand };
}

export interface ChipCreateOpts {
  email: string;
  amountCents: number;      // RM250 = 25000
  productName: string;
  reference: string;        // case id
  successUrl: string;
  failureUrl: string;
  callbackUrl: string;
}

export async function chipCreatePurchase(o: ChipCreateOpts): Promise<{ id: string; checkoutUrl: string }> {
  const { secret, brand } = creds();
  const res = await fetch(`${BASE}/purchases/`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      brand_id: brand,
      client: { email: o.email },
      purchase: { products: [{ name: o.productName, price: o.amountCents }] },
      success_redirect: o.successUrl,
      failure_redirect: o.failureUrl,
      success_callback: o.callbackUrl,
      reference: o.reference,
      send_receipt: true,
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`CHIP create gagal (${res.status}): ${t.slice(0, 300)}`);
  }
  const data: any = await res.json();
  if (!data?.checkout_url) throw new Error('CHIP tidak pulangkan checkout_url.');
  return { id: data.id, checkoutUrl: data.checkout_url };
}

export async function chipGetPurchase(id: string): Promise<any | null> {
  try {
    const { secret } = creds();
    const res = await fetch(`${BASE}/purchases/${id}/`, {
      headers: { Authorization: `Bearer ${secret}` },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
