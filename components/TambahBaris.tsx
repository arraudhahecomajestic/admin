'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { tambahMajlis, tambahJenisBangunan } from '@/app/actions/library';

// Borang tambah ringkas — dipakai untuk majlis & jenis bangunan.
export default function TambahBaris({ mode }: { mode: 'majlis' | 'jenis' }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('kediaman');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function add() {
    setBusy(true); setMsg('');
    const res = mode === 'majlis'
      ? await tambahMajlis(code, name)
      : await tambahJenisBangunan(code, name, category);
    setBusy(false);
    if (res.ok) { setCode(''); setName(''); setOpen(false); router.refresh(); }
    else setMsg(res.error || 'Ralat');
  }

  const inp = 'border border-line bg-soft rounded-lg px-3 py-2 text-[14px] focus:border-brand focus:bg-white outline-none';

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-[13px] font-semibold text-brand hover:text-brand-dark">
        + Tambah {mode === 'majlis' ? 'majlis' : 'jenis bangunan'}
      </button>
    );
  }

  return (
    <div className="bg-soft rounded-xl p-3 flex flex-wrap items-center gap-2">
      <input className={inp} value={code} onChange={(e) => setCode(e.target.value)} placeholder={mode === 'majlis' ? 'kod (cth: mbsa)' : 'kod (cth: townhouse)'} />
      <input className={inp} value={name} onChange={(e) => setName(e.target.value)} placeholder={mode === 'majlis' ? 'Nama penuh majlis' : 'Label (cth: Townhouse)'} />
      {mode === 'jenis' && (
        <select className={inp} value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="kediaman">Kediaman</option>
          <option value="komersial">Komersial</option>
        </select>
      )}
      <button onClick={add} disabled={busy} className="bg-brand hover:bg-brand-dark disabled:bg-line text-white text-[13px] font-semibold px-4 py-2 rounded-full">
        {busy ? '…' : 'Tambah'}
      </button>
      <button onClick={() => setOpen(false)} className="text-ink-2 text-[13px] px-2">Batal</button>
      {msg && <span className="text-[12px] text-brand-dark w-full">{msg}</span>}
    </div>
  );
}
