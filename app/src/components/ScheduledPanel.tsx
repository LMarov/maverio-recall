import type { ViewModel } from '../useApp';

export function ScheduledPanel({ view }: { view: ViewModel }) {
  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
      {view.scheduledList.length === 0 && (
        <div style={{ font: '500 12px/1.6 Manrope,sans-serif', color: 'var(--ink3)' }}>
          Nothing scheduled yet. Set a date and time on Prep a meeting.
        </div>
      )}
      {view.scheduledList.map((sm) => (
        <div key={sm.id} style={{ padding: '13px 14px', border: '1px solid var(--line)', borderRadius: 11, background: 'var(--panel)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7, flexWrap: 'wrap' }}>
            <span style={{ font: '700 9.5px Manrope,sans-serif', letterSpacing: '.06em', padding: '2.5px 7px', borderRadius: 5, background: sm.pTint, color: sm.pColor }}>{sm.practice}</span>
            <span style={{ font: '700 10.5px JetBrains Mono,monospace', color: '#5AC3A7' }}>{sm.when}</span>
          </div>
          <div style={{ font: '700 13px Manrope,sans-serif', color: 'var(--ink)', marginBottom: 2 }}>{sm.title}</div>
          <div style={{ font: '600 11px Manrope,sans-serif', color: 'var(--ink3)', marginBottom: 8 }}>{sm.client}</div>
          <div style={{ font: '500 11px Manrope,sans-serif', color: 'var(--ink2)', marginBottom: 6 }}>
            {sm.durationLabel} · {sm.type} · {sm.place}
          </div>
          <div style={{ font: '500 10.5px Manrope,sans-serif', color: 'var(--ink3)', marginBottom: 11 }}>
            {sm.agendaCount} · {sm.outcomeCount}
          </div>
          <div style={{ display: 'flex', gap: 7 }}>
            <button
              onClick={sm.startNow}
              style={{ flex: 1, height: 32, borderRadius: 8, border: 0, background: 'linear-gradient(90deg,#4192B9,#5AC3A7)', color: '#fff', font: '700 11px Manrope,sans-serif' }}
            >
              Start now
            </button>
            <button
              onClick={sm.openPrep}
              style={{ height: 32, padding: '0 11px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--panel2)', color: 'var(--ink)', font: '700 11px Manrope,sans-serif', whiteSpace: 'nowrap' }}
            >
              Open prep
            </button>
            <button onClick={sm.remove} title="Remove" className="x-hover" style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--line)', background: 'transparent', color: 'var(--ink3)', fontSize: 12 }}>
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
