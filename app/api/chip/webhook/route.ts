import { sbAdmin } from '@/lib/sb/admin';
import { chipGetPurchase } from '@/lib/chip';

export const dynamic = 'force-dynamic';

// Webhook CHIP — dipanggil server-ke-server bila bayaran selesai.
// Kita SAHKAN semula dengan CHIP (guna secret) sebelum tandakan paid — jangan
// percaya payload mentah.
export async function POST(req: Request) {
  try {
    const body: any = await req.json().catch(() => ({}));
    const purchaseId: string | undefined = body?.id;
    if (!purchaseId) return new Response('no id', { status: 400 });

    const p = await chipGetPurchase(purchaseId);
    if (p?.status === 'paid') {
      const admin = sbAdmin();
      await admin.from('approval_cases')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('chip_purchase_id', purchaseId)
        .neq('status', 'paid');
    }
    return new Response('ok', { status: 200 });
  } catch {
    // Pulang 200 supaya CHIP tak retry bertubi; isu sebenar disahkan semula
    // bila owner kembali ke page 'selesai'.
    return new Response('ok', { status: 200 });
  }
}
