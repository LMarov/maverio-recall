import type { ViewModel } from '../useApp';

export function RecordingPill({ view }: { view: ViewModel }) {
  if (!view.recording) return null;
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 22,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9,
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'nowrap',
        width: 'max-content',
        maxWidth: '96%',
        overflow: 'hidden',
        gap: 13,
        padding: '9px 13px',
        borderRadius: 36,
        background: 'rgba(10,17,22,.94)',
        border: '1px solid rgba(255,255,255,.13)',
        boxShadow: '0 16px 44px rgba(0,0,0,.44)',
        backdropFilter: 'blur(14px)',
        animation: 'rise .2s ease both'
      }}
    >
      <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#FF6A00', animation: 'recdot 1.3s ease-in-out infinite,ring 1.8s ease-out infinite', flex: 'none', display: 'block' }} />
      <span style={{ font: '600 12px JetBrains Mono,monospace', color: '#fff', flex: 'none' }}>{view.elapsed}</span>
      <span style={{ width: 1, height: 20, background: 'rgba(255,255,255,.16)', display: 'block' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'nowrap', flex: '0 0 auto' }}>
        {view.liveSpeakers.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, height: 26, padding: '0 10px 0 3px', borderRadius: 20, background: s.chipBg, border: `1px solid ${s.chipBorder}`, animation: 'rise .28s ease both', flex: 'none' }}>
            <span style={{ width: 20, height: 20, borderRadius: '50%', background: s.color, color: '#fff', display: 'grid', placeItems: 'center', font: '700 8px Manrope,sans-serif', opacity: s.op as any, flex: 'none' }}>{s.ini}</span>
            <span style={{ font: '700 10.5px Manrope,sans-serif', color: s.nameFg, whiteSpace: 'nowrap' }}>{s.name}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 14 }}>
              {s.bars.map((b, j) => (
                <span key={j} style={{ width: 2.5, height: 14, borderRadius: 2, background: s.bg, transformOrigin: 'center', animation: `lvl ${b.dur} ease-in-out infinite`, animationDelay: b.delay, display: 'block' }} />
              ))}
            </div>
          </div>
        ))}
        {view.pendingVoices && <span style={{ font: '600 10.5px Manrope,sans-serif', color: 'rgba(255,255,255,.5)', whiteSpace: 'nowrap' }}>{view.pendingLabel}</span>}
      </div>
      {view.micOnly && (
        <>
          <span style={{ width: 1, height: 20, background: 'rgba(255,255,255,.16)', display: 'block' }} />
          <span
            title="System audio wasn't captured for this recording — only your microphone."
            style={{ height: 26, padding: '0 11px', borderRadius: 20, border: '1px solid rgba(255,176,0,.5)', background: 'rgba(255,106,0,.22)', color: '#FFB000', font: '700 10.5px Manrope,sans-serif', display: 'flex', alignItems: 'center' }}
          >
            Mic only
          </span>
        </>
      )}
      <span style={{ width: 1, height: 20, background: 'rgba(255,255,255,.16)', display: 'block' }} />
      <button onClick={view.toggleRecord} style={{ height: 26, padding: '0 12px', borderRadius: 20, border: 0, background: 'rgba(255,255,255,.14)', color: '#fff', font: '700 10.5px Manrope,sans-serif' }}>
        STOP
      </button>
    </div>
  );
}
