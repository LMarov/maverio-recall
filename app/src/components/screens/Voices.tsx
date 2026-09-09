import type { ViewModel } from '../../useApp';

export function Voices({ view }: { view: ViewModel }) {
  return (
    <div style={{ padding: '26px 28px 40px' }}>
      <h1 style={{ font: '600 27px/1.15 Poppins,sans-serif', color: 'var(--ink)', margin: '0 0 5px', letterSpacing: '-.01em' }}>Voices</h1>
      <div style={{ font: '500 12.5px Manrope,sans-serif', color: 'var(--ink2)', marginBottom: 24 }}>{view.voiceSub}</div>

      {view.hasPending && (
        <div style={{ marginBottom: 30 }}>
          <div style={{ font: '700 9px Manrope,sans-serif', letterSpacing: '.26em', color: '#FF6A00', marginBottom: 11 }}>NEEDS A NAME</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(258px,1fr))', gap: 11 }}>
            {view.pending.map((v) => (
              <div key={v.k} style={{ padding: 15, border: '1px solid rgba(255,106,0,.35)', borderRadius: 11, background: 'rgba(255,106,0,.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <button
                    onClick={v.play}
                    title={v.playTitle}
                    className="play-hover"
                    style={{ width: 34, height: 34, borderRadius: '50%', border: `1px solid ${v.playBorder}`, background: v.playBg, color: v.playFg, display: 'grid', placeItems: 'center', fontSize: 11, padding: `0 0 0 ${v.playPad}`, flex: 'none' }}
                  >
                    {v.playIcon}
                  </button>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ font: '700 13px Manrope,sans-serif', color: 'var(--ink)' }}>{v.label}</div>
                    <div style={{ font: '600 10.5px Manrope,sans-serif', color: 'var(--ink3)' }}>{v.meta}</div>
                  </div>
                </div>
                <div onClick={v.play} style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 30, marginBottom: 8, cursor: 'pointer' }}>
                  {v.wave.map((w, i) => (
                    <span key={i} style={{ flex: 1, height: w.h, background: 'linear-gradient(180deg,#4192B9,#5AC3A7)', borderRadius: 2, opacity: w.op as any, transformOrigin: 'bottom', animation: w.anim, display: 'block' }} />
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
                  <span style={{ font: '500 10.5px JetBrains Mono,monospace', color: 'var(--ink3)' }}>{v.clip}</span>
                  <span style={{ font: '600 10.5px Manrope,sans-serif', color: '#4192B9' }}>{v.playState}</span>
                </div>
                <div style={{ font: '500 11.5px/1.55 Manrope,sans-serif', color: 'var(--ink2)', marginBottom: 12 }}>{v.hint}</div>
                <div style={{ display: 'flex', gap: 7 }}>
                  <button onClick={v.name} style={{ flex: 1, height: 30, borderRadius: 8, border: 0, background: 'linear-gradient(90deg,#4192B9,#5AC3A7)', color: '#fff', font: '700 11px Manrope,sans-serif' }}>
                    Name voice
                  </button>
                  <button onClick={v.merge} style={{ height: 30, padding: '0 11px', borderRadius: 8, border: '1px solid var(--line)', background: 'transparent', color: 'var(--ink2)', font: '700 11px Manrope,sans-serif' }}>
                    Not a person
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ font: '700 9px Manrope,sans-serif', letterSpacing: '.26em', color: 'var(--ink3)', marginBottom: 11 }}>KNOWN VOICES</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(228px,1fr))', gap: 10 }}>
        {view.known.map((v, i) => (
          <div key={i} style={{ padding: '13px 14px', border: '1px solid var(--line)', borderRadius: 11, display: 'flex', gap: 11, alignItems: 'center' }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: v.color, color: '#fff', display: 'grid', placeItems: 'center', font: '700 11px Manrope,sans-serif', flex: 'none' }}>{v.ini}</div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ font: '700 13px Manrope,sans-serif', color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.name}</div>
              <div style={{ font: '600 10.5px Manrope,sans-serif', color: 'var(--ink3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.meta}</div>
            </div>
            <span style={{ font: '700 9.5px Manrope,sans-serif', color: 'var(--ink3)', border: '1px solid var(--line)', padding: '2px 6px', borderRadius: 4, flex: 'none' }}>{v.match}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
