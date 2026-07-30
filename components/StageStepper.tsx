'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { STAGES, stageIndex } from '@/lib/talian';
import { setStage } from '@/app/actions/talian';

export default function StageStepper({ projectId, current }: { projectId: string; current: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState('');
  const curIdx = stageIndex(current);
  const isLost = current === 'lost';

  async function move(stage: string) {
    if (stage === current) return;
    setBusy(stage);
    await setStage(projectId, stage);
    setBusy('');
    router.refresh();
  }

  return (
    <div className="mb-6">
      <div className="text-[11px] uppercase tracking-wide text-ink-2 font-bold mb-2">Peringkat projek</div>
      <div className="flex flex-wrap gap-1.5">
        {STAGES.map((s, i) => {
          const done = curIdx >= 0 && i < curIdx;
          const active = s.key === current;
          return (
            <button key={s.key} onClick={() => move(s.key)} disabled={busy !== ''}
              className={`text-[12px] font-semibold px-3 py-2 rounded-lg border transition-colors ${
                active ? 'text-white border-transparent'
                : done ? 'bg-white text-ink border-line'
                : 'bg-soft text-ink-2 border-line hover:bg-white'}`}
              style={active ? { backgroundColor: s.color } : undefined}>
              {busy === s.key ? '…' : s.label}
            </button>
          );
        })}
      </div>
      <div className="mt-2.5">
        {isLost ? (
          <div className="flex items-center gap-3">
            <span className="text-[12px] font-bold text-white bg-[#9a938d] px-3 py-1.5 rounded-lg">✕ Projek ditanda tak dapat</span>
            <button onClick={() => move('new')} disabled={busy !== ''} className="text-[12px] text-brand font-semibold hover:underline">↩ Kembalikan ke pipeline</button>
          </div>
        ) : (
          <button onClick={() => move('lost')} disabled={busy !== ''}
            className="text-[12px] font-semibold text-ink-2 border border-line rounded-lg px-3 py-2 hover:text-brand-dark hover:border-[#f3c9c7]">
            {busy === 'lost' ? '…' : '✕ Tandai tak dapat (Hilang)'}
          </button>
        )}
      </div>
    </div>
  );
}
