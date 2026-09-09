import type { ViewModel } from '../useApp';

export function NamerModal({ view }: { view: ViewModel }) {
  if (!view.namerOpen) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 14, background: 'rgba(10,17,22,.5)', backdropFilter: 'blur(3px)', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420, background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 14, padding: 22, boxShadow: '0 30px 80px rgba(0,0,0,.4)', animation: 'rise .2s ease both' }}>
        <div style={{ font: '700 9px Manrope,sans-serif', letterSpacing: '.26em', color: 'var(--ink3)', marginBottom: 9 }}>NAME THIS VOICE</div>
        <div style={{ font: '600 17px/1.35 Poppins,sans-serif', color: 'var(--ink)', marginBottom: 6 }}>{view.namerTitle}</div>
        <div style={{ font: '500 12px/1.6 Manrope,sans-serif', color: 'var(--ink2)', marginBottom: 16 }}>{view.namerHint}</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 38, marginBottom: 16 }}>
          {view.namerWave.map((w, i) => (
            <span key={i} style={{ flex: 1, height: w.h, background: 'linear-gradient(180deg,#4192B9,#5AC3A7)', borderRadius: 2, opacity: 0.65, display: 'block' }} />
          ))}
        </div>
        <div style={{ font: '700 9.5px Manrope,sans-serif', letterSpacing: '.1em', color: 'var(--ink3)', marginBottom: 8 }}>SUGGESTED FROM THE INVITE</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 14 }}>
          {view.namerSuggestions.map((s) => (
            <button key={s.label} onClick={s.pick} style={{ height: 29, padding: '0 12px', borderRadius: 8, border: `1px solid ${s.border}`, background: s.bg, color: s.fg, font: '700 11.5px Manrope,sans-serif' }}>
              {s.label}
            </button>
          ))}
        </div>
        <input
          value={view.namerDraft}
          onChange={(e) => view.onNamerDraft(e.target.value)}
          placeholder="Or type a name"
          style={{ width: '100%', height: 38, padding: '0 13px', borderRadius: 9, border: '1px solid var(--line)', background: 'var(--panel2)', font: '500 13px Manrope,sans-serif', color: 'var(--ink)', marginBottom: 8 }}
        />
        {view.namerApplyAllVisible && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, font: '500 11.5px Manrope,sans-serif', color: 'var(--ink2)', marginBottom: 18 }}>
            <input type="checkbox" checked={view.namerApplyAll} onChange={(e) => view.onNamerApplyAll(e.target.checked)} style={{ accentColor: '#4192B9', width: 15, height: 15 } as React.CSSProperties} />
            {view.namerApplyAllLabel}
          </label>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={view.closeNamer} style={{ flex: 'none', height: 36, padding: '0 15px', borderRadius: 9, border: '1px solid var(--line)', background: 'transparent', color: 'var(--ink2)', font: '700 12px Manrope,sans-serif' }}>
            Cancel
          </button>
          <button onClick={view.saveNamer} style={{ flex: 1, height: 36, borderRadius: 9, border: 0, background: 'linear-gradient(90deg,#4192B9,#5AC3A7)', color: '#fff', font: '700 12px Manrope,sans-serif' }}>
            Save voiceprint
          </button>
        </div>
      </div>
    </div>
  );
}
