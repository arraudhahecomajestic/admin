'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { sbBrowser } from '@/lib/sb/client';

export default function BorangReset() {
  const router = useRouter();
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [done, setDone] = useState(false);

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 6) { setMsg('Kata laluan sekurang-kurangnya 6 aksara.'); return; }
    if (pw !== pw2) { setMsg('Kata laluan tak sama.'); return; }
    setBusy(true); setMsg('');
    const sb = sbBrowser();
    const { error } = await sb.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) {
      setMsg(/session/i.test(error.message)
        ? 'Sesi reset tak sah atau dah tamat. Minta link reset baru dari page log masuk.'
        : error.message);
      return;
    }
    setDone(true);
    setMsg('Kata laluan dikemas ✓ Mengalih ke portal…');
    setTimeout(() => { router.push('/portal'); router.refresh(); }, 900);
  }

  const input = 'w-full border border-line bg-white rounded-xl px-4 py-3 text-[15px] focus:border-brand outline-none';

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <form onSubmit={simpan} className="space-y-3">
        <input type="password" required minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Kata laluan baru" className={input} />
        <input type="password" required minLength={6} value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="Ulang kata laluan baru" className={input} />
        <button type="submit" disabled={busy || done}
          className="w-full bg-brand hover:bg-brand-dark disabled:bg-line text-white font-semibold py-3 rounded-full">
          {busy ? '…' : 'Simpan kata laluan baru'}
        </button>
      </form>
      {msg && <p className="text-[13px] text-ink-2 mt-3">{msg}</p>}
    </div>
  );
}
