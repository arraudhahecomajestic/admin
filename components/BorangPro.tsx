'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { daftarPro } from '@/app/actions/pro';

const TRADES = ['Demolition & Hacking', 'Konkrit & Extension', 'Bumbung / Roofing', 'Wiring & Elektrik', 'Paip & Plumbing', 'Jubin / Tiling', 'Waterproofing', 'Plaster Ceiling', 'Kerja Kayu / Carpentry', 'Kitchen Cabinet', 'Cat / Painting', 'Grille & Besi', 'Kaca & Aluminium', 'Aircond', 'Pembekal Material'];
const AREAS = ['Kuala Lumpur', 'Putrajaya', 'Petaling', 'Klang', 'Shah Alam', 'Kajang / Bangi', 'Subang / Puchong', 'Rawang / Selayang', 'Cyberjaya / Sepang', 'Ampang', 'Luar Klang Valley'];

export default function BorangPro({ initial, email }: { initial: any; email: string }) {
  const router = useRouter();
  const [kind, setKind] = useState<string>(initial.kind ?? 'pro');
  const [company, setCompany] = useState(initial.company_name ?? '');
  const [fullName, setFullName] = useState(initial.full_name ?? '');
  const [ssm, setSsm] = useState(initial.ssm_no ?? '');
  const [ic, setIc] = useState(initial.ic_no ?? '');
  const [entity, setEntity] = useState(initial.entity_type ?? '');
  const [cidb, setCidb] = useState(initial.cidb_grade ?? '');
  const [picName, setPicName] = useState(initial.pic_name ?? '');
  const [picPhone, setPicPhone] = useState(initial.pic_phone ?? '');
  const [picEmail, setPicEmail] = useState(initial.pic_email ?? email ?? '');
  const [trades, setTrades] = useState<string[]>(initial.trades ?? []);
  const [areas, setAreas] = useState<string[]>(initial.service_areas ?? []);
  const [bio, setBio] = useState(initial.bio ?? '');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const toggle = (list: string[], set: (v: string[]) => void, v: string) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  async function onSave() {
    if (kind === 'pro' && !company.trim()) { setMsg('Isi nama syarikat.'); return; }
    if (kind === 'hero' && !fullName.trim()) { setMsg('Isi nama penuh.'); return; }
    if (!picPhone.trim()) { setMsg('Isi nombor telefon.'); return; }
    if (!trades.length) { setMsg('Pilih sekurang-kurangnya satu bidang kerja.'); return; }
    setBusy(true); setMsg('');
    const res = await daftarPro({
      kind, company_name: company, full_name: fullName, ssm_no: ssm, ic_no: ic,
      entity_type: entity, cidb_grade: cidb, pic_name: picName, pic_phone: picPhone,
      pic_email: picEmail, trades, service_areas: areas, bio,
    });
    setBusy(false);
    setMsg(res.ok ? 'Profil dihantar ✓ — menunggu kelulusan RENORUMAH.' : 'Ralat: ' + res.error);
    if (res.ok) router.refresh();
  }

  const input = 'w-full border border-line bg-soft rounded-xl px-3.5 py-3 text-[15px] focus:border-brand focus:bg-white outline-none';
  const label = 'block text-sm font-semibold mb-1.5';
  const Chip = ({ list, set, v }: { list: string[]; set: (x: string[]) => void; v: string }) => {
    const on = list.includes(v);
    return (
      <button type="button" onClick={() => toggle(list, set, v)}
        className={`text-[13px] font-medium px-3 py-2 rounded-full border transition-colors ${on ? 'bg-ink text-white border-transparent' : 'bg-soft text-ink-2 border-line hover:bg-white'}`}>
        {on ? '✓ ' : ''}{v}
      </button>
    );
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
      <div className="text-[12px] text-ink-2">Login sebagai <b>{email}</b></div>

      <div>
        <label className={label}>Daftar sebagai</label>
        <div className="flex gap-2">
          {[['pro', 'Pro (Syarikat)'], ['hero', 'Hero (Individu)']].map(([k, l]) => (
            <button key={k} type="button" onClick={() => setKind(k)}
              className={`flex-1 text-sm font-semibold px-3 py-2.5 rounded-xl border ${kind === k ? 'bg-brand text-white border-transparent' : 'bg-soft text-ink-2 border-line'}`}>{l}</button>
          ))}
        </div>
      </div>

      {kind === 'pro' ? (
        <>
          <div><label className={label}>Nama syarikat</label><input className={input} value={company} onChange={(e) => setCompany(e.target.value)} placeholder="cth: Bina Jaya Enterprise" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={label}>No. SSM</label><input className={input} value={ssm} onChange={(e) => setSsm(e.target.value)} /></div>
            <div><label className={label}>Jenis entiti</label>
              <select className={input} value={entity} onChange={(e) => setEntity(e.target.value)}>
                <option value="">Pilih…</option><option value="enterprise">Enterprise</option><option value="sdnbhd">Sdn Bhd</option>
              </select>
            </div>
          </div>
          <div><label className={label}>Gred CIDB <span className="text-ink-2 font-normal text-xs">(pilihan)</span></label><input className={input} value={cidb} onChange={(e) => setCidb(e.target.value)} placeholder="cth: G3" /></div>
        </>
      ) : (
        <>
          <div><label className={label}>Nama penuh</label><input className={input} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="cth: Ahmad bin Ali" /></div>
          <div><label className={label}>No. IC <span className="text-ink-2 font-normal text-xs">(pilihan)</span></label><input className={input} value={ic} onChange={(e) => setIc(e.target.value)} /></div>
        </>
      )}

      <div><label className={label}>Nama PIC</label><input className={input} value={picName} onChange={(e) => setPicName(e.target.value)} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={label}>Telefon</label><input className={input} value={picPhone} onChange={(e) => setPicPhone(e.target.value)} placeholder="011XXXXXXXX" /></div>
        <div><label className={label}>Emel</label><input className={input} value={picEmail} onChange={(e) => setPicEmail(e.target.value)} /></div>
      </div>

      <div>
        <label className={label}>Bidang kerja</label>
        <div className="flex flex-wrap gap-2">{TRADES.map((t) => <Chip key={t} list={trades} set={setTrades} v={t} />)}</div>
      </div>
      <div>
        <label className={label}>Kawasan servis <span className="text-ink-2 font-normal text-xs">(pilihan)</span></label>
        <div className="flex flex-wrap gap-2">{AREAS.map((a) => <Chip key={a} list={areas} set={setAreas} v={a} />)}</div>
      </div>
      <div><label className={label}>Ceritakan sikit <span className="text-ink-2 font-normal text-xs">(pilihan)</span></label><textarea rows={2} className={input} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Kepakaran, pengalaman…" /></div>

      <div className="flex items-center gap-3 pt-1">
        <button disabled={busy} onClick={onSave} className="bg-brand hover:bg-brand-dark disabled:bg-line text-white text-sm font-semibold px-6 py-3 rounded-full">
          {busy ? 'Menghantar…' : 'Hantar profil'}
        </button>
        {msg && <span className="text-sm text-ink-2">{msg}</span>}
      </div>
    </div>
  );
}
