'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { sbBrowser } from '@/lib/sb/client';

export default function BorangMasuk() {
  const router = useRouter();
  const [mode, setMode] = useState<'masuk' | 'daftar'>('masuk');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function google() {
    setMsg('');
    const sb = sbBrowser();
    const { error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/portal` },
    });
    if (error) setMsg(error.message);
  }

  async function hantar(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg('');
    const sb = sbBrowser();

    if (mode === 'masuk') {
      const { error } = await sb.auth.signInWithPassword({ email, password: pw });
      setBusy(false);
      if (error) { setMsg(ralat(error.message)); return; }
      router.push('/portal'); router.refresh();
      return;
    }

    // daftar
    const { data, error } = await sb.auth.signUp({
      email, password: pw,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/portal` },
    });
    if (error) { setBusy(false); setMsg(ralat(error.message)); return; }
    if (data.session) { router.push('/portal'); router.refresh(); return; }
    // cuba login terus (kalau "Confirm email" dimatikan di Supabase)
    const { error: e2 } = await sb.auth.signInWithPassword({ email, password: pw });
    setBusy(false);
    if (!e2) { router.push('/portal'); router.refresh(); }
    else setMsg('Akaun dicipta. Semak emel untuk sahkan — atau matikan "Confirm email" di Supabase untuk terus masuk.');
  }

  async function resetPassword() {
    if (!email.trim()) { setMsg('Isi emel dulu, kami hantar link reset ke situ.'); return; }
    setBusy(true); setMsg('');
    const sb = sbBrowser();
    const { error } = await sb.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset`,
    });
    setBusy(false);
    setMsg(error ? ralat(error.message) : 'Link reset dihantar ke emel anda. Semak inbox (dan folder spam).');
  }

  const input = 'w-full border border-line bg-white rounded-xl px-4 py-3 text-[15px] focus:border-brand outline-none';

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <button onClick={google} type="button"
        className="w-full flex items-center justify-center gap-2.5 border border-line rounded-full py-3 font-semibold text-sm hover:bg-soft">
        <GoogleIcon /> Teruskan dengan Google
      </button>

      <div className="flex items-center gap-3 my-4 text-[12px] text-ink-2">
        <div className="h-px bg-line flex-1" /> atau <div className="h-px bg-line flex-1" />
      </div>

      <form onSubmit={hantar} className="space-y-3">
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Emel" className={input} />
        <input type="password" required minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Kata laluan" className={input} />
        <button type="submit" disabled={busy}
          className="w-full bg-brand hover:bg-brand-dark disabled:bg-line text-white font-semibold py-3 rounded-full">
          {busy ? '…' : mode === 'masuk' ? 'Log masuk' : 'Daftar akaun'}
        </button>
      </form>

      {mode === 'masuk' && (
        <button onClick={resetPassword} type="button" disabled={busy}
          className="text-[12.5px] text-ink-2 mt-3 w-full text-center hover:text-brand">
          Lupa kata laluan? Hantar link reset
        </button>
      )}

      {msg && <p className="text-[13px] text-ink-2 mt-3">{msg}</p>}

      <button onClick={() => { setMode(mode === 'masuk' ? 'daftar' : 'masuk'); setMsg(''); }}
        className="text-[13px] text-ink-2 mt-4 w-full text-center hover:text-brand">
        {mode === 'masuk' ? 'Belum ada akaun? Daftar' : 'Dah ada akaun? Log masuk'}
      </button>
    </div>
  );
}

function ralat(m: string) {
  if (/invalid login/i.test(m)) return 'Emel atau kata laluan salah.';
  if (/already registered/i.test(m)) return 'Emel ni dah didaftar. Cuba log masuk.';
  return m;
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}
