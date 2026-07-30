'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { simpanSkop } from '@/app/actions/skop';
import { KERJA, JENIS_RUMAH } from '@/lib/bq/config';

export default function BorangSkop() {
  const router = useRouter();
  const [jenis, setJenis] = useState('');
  const [builtUp, setBuiltUp] = useState('');
  const [bilikAir, setBilikAir] = useState('');
  const [kerja, setKerja] = useState<string[]>([]);
  const [nama, setNama] = useState('');
  const [telefon, setTelefon] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const toggle = (code: string) =>
    setKerja((p) => p.includes(code) ? p.filter((x) => x !== code) : [...p, code]);

  async function hantar() {
    if (!jenis) { setMsg('Pilih jenis rumah.'); return; }
    if (!kerja.length) { setMsg('Pilih sekurang-kurangnya satu kerja.'); return; }
    setBusy(true); setMsg('');
    const res = await simpanSkop({
      property_type: jenis,
      built_up: Number(builtUp) || 0,
      bilik_air: Number(bilikAir) || 0,
      kerja, nama, telefon,
    });
    setBusy(false);
    if (res.ok) { router.push('/portal'); router.refresh(); }
    else setMsg('Ralat: ' + res.error);
  }

  const input = 'w-full border border-line bg-white rounded-xl px-3.5 py-3 text-[15px] focus:border-brand outline-none';
  const label = 'block text-sm font-semibold mb-1.5';

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
        <div>
          <label className={label}>Jenis rumah</label>
          <select className={input} value={jenis} onChange={(e) => setJenis(e.target.value)}>
            <option value="">Pilih…</option>
            {JENIS_RUMAH.map((j) => <option key={j} value={j}>{j}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={label}>Keluasan (sqft)</label><input type="number" className={input} value={builtUp} onChange={(e) => setBuiltUp(e.target.value)} placeholder="cth: 1200" /></div>
          <div><label className={label}>Bilangan bilik air</label><input type="number" className={input} value={bilikAir} onChange={(e) => setBilikAir(e.target.value)} placeholder="cth: 2" /></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <label className={label}>Kerja yang nak dibuat</label>
        <div className="space-y-2 mt-1">
          {KERJA.map((k) => {
            const on = kerja.includes(k.scope_code);
            return (
              <button key={k.scope_code} type="button" onClick={() => toggle(k.scope_code)}
                className={`w-full flex items-center gap-3 text-left border rounded-xl px-3.5 py-3 transition-colors ${
                  on ? 'border-brand bg-brand/5' : 'border-line hover:bg-soft'}`}>
                <span className={`w-5 h-5 rounded-md border flex items-center justify-center text-[12px] ${
                  on ? 'bg-brand border-brand text-white' : 'border-line'}`}>{on ? '✓' : ''}</span>
                <span className="flex-1">
                  <span className="font-medium text-[15px]">{k.label}</span>
                  <span className="text-ink-2 text-[12px] block">{k.kategori}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm grid grid-cols-2 gap-3">
        <div><label className={label}>Nama <span className="text-ink-2 font-normal text-xs">(pilihan)</span></label><input className={input} value={nama} onChange={(e) => setNama(e.target.value)} /></div>
        <div><label className={label}>Telefon <span className="text-ink-2 font-normal text-xs">(pilihan)</span></label><input className={input} value={telefon} onChange={(e) => setTelefon(e.target.value)} placeholder="012-3456789" /></div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={hantar} disabled={busy}
          className="bg-brand hover:bg-brand-dark disabled:bg-line text-white font-semibold px-6 py-3.5 rounded-full">
          {busy ? 'Menjana sebut harga…' : 'Dapatkan sebut harga'}
        </button>
        {msg && <span className="text-sm text-brand-dark">{msg}</span>}
      </div>
    </div>
  );
}
