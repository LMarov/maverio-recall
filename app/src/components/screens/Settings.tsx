import type { ViewModel } from '../../useApp';

export function SettingsScreen({ view }: { view: ViewModel }) {
  return (
    <div style={{ padding: '26px 28px 40px', maxWidth: 760 }}>
      <h1 style={{ font: '600 27px/1.15 Poppins,sans-serif', color: 'var(--ink)', margin: '0 0 5px', letterSpacing: '-.01em' }}>Capture &amp; policy</h1>
      <div style={{ font: '500 12.5px Manrope,sans-serif', color: 'var(--ink2)', marginBottom: 16 }}>{view.policyIntro}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 10, background: view.ownerBannerBg, border: `1px solid ${view.ownerBannerBorder}`, marginBottom: 22 }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: view.ownerBannerDot, flex: 'none', display: 'block' }} />
        <span style={{ font: '600 11.5px/1.5 Manrope,sans-serif', color: 'var(--ink2)' }}>{view.policyBanner}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {view.settings.map((s) => (
          <div key={s.k} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 16, alignItems: 'center', padding: '15px 17px', border: '1px solid var(--line)', borderRadius: 11 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ font: '700 13px Manrope,sans-serif', color: 'var(--ink)' }}>{s.label}</span>
                {s.lockDisplay !== 'none' && (
                  <span style={{ font: '700 9px Manrope,sans-serif', letterSpacing: '.05em', padding: '2.5px 7px', borderRadius: 5, background: 'var(--panel3)', color: 'var(--ink3)' }}>OWNER ONLY</span>
                )}
              </div>
              <div style={{ font: '500 11.5px/1.55 Manrope,sans-serif', color: 'var(--ink2)' }}>{s.help}</div>
            </div>
            <button
              onClick={s.toggle}
              title={s.title}
              style={{ width: 44, height: 25, borderRadius: 20, border: 0, background: s.track, position: 'relative', flex: 'none', opacity: s.opacity as any, cursor: s.cursor as any }}
            >
              <span style={{ position: 'absolute', top: 3, left: s.knob, width: 19, height: 19, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.3)', transition: 'left .16s ease', display: 'block' }} />
            </button>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 22, padding: '15px 17px', borderRadius: 11, background: 'var(--tint)', font: '500 12px/1.65 Manrope,sans-serif', color: 'var(--ink2)' }}>
        Recall never joins the call as a participant and adds no plugin — it captures the Mac's own audio output plus your microphone. Recording law varies by state and country; keep{' '}
        <strong style={{ color: 'var(--ink)' }}>Disclosure prompt</strong> on unless your legal counsel has cleared one-party consent for the jurisdictions you work in.
      </div>
    </div>
  );
}
