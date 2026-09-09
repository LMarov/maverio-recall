import type { ViewModel } from '../../useApp';

export function Timeline({ view }: { view: ViewModel }) {
  return (
    <div style={{ padding: '26px 28px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
        <div>
          <h1 style={{ font: '600 27px/1.15 Poppins,sans-serif', color: 'var(--ink)', margin: '0 0 5px', letterSpacing: '-.01em' }}>Timeline</h1>
          <div style={{ font: '500 12.5px Manrope,sans-serif', color: 'var(--ink2)' }}>{view.resultLine}</div>
        </div>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {view.practices.map((p) => (
            <button
              key={p.label}
              onClick={p.pick}
              style={{ height: 29, padding: '0 12px', borderRadius: 20, border: `1px solid ${p.border}`, background: p.bg, color: p.fg, font: '700 11px Manrope,sans-serif', letterSpacing: '.01em', display: 'flex', alignItems: 'center', gap: 7 }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: p.dot, display: 'block' }} />
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {view.publishFilters.map((f) => (
          <button
            key={f.label}
            onClick={f.pick}
            style={{ height: 27, padding: '0 12px', borderRadius: 20, border: `1px solid ${f.border}`, background: f.bg, color: f.fg, font: '700 11px Manrope,sans-serif' }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {view.filterActive && (
        <button
          onClick={view.clearFilters}
          style={{ marginBottom: 14, height: 26, padding: '0 11px', borderRadius: 7, border: '1px dashed var(--line)', background: 'transparent', color: 'var(--ink2)', font: '600 11px Manrope,sans-serif' }}
        >
          Clear filters ✕
        </button>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {view.shownMeetings.map((m: any) => (
          <div
            key={m.id}
            onClick={m.open}
            className="row-hover"
            style={{ display: 'grid', gridTemplateColumns: '58px minmax(0,1fr) auto', gap: 16, alignItems: 'center', padding: '14px 16px', border: `1px solid ${m.border}`, borderRadius: 11, background: m.bg, boxShadow: m.glow, cursor: 'pointer' }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ font: '700 9.5px Manrope,sans-serif', color: 'var(--ink3)', letterSpacing: '.12em' }}>{m.dow}</div>
              <div style={{ font: '600 19px/1.1 Poppins,sans-serif', color: 'var(--ink)' }}>{m.day}</div>
              <div style={{ font: '600 9.5px Manrope,sans-serif', color: 'var(--ink3)', letterSpacing: '.1em' }}>{m.mon}</div>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap', marginBottom: 5 }}>
                <span style={{ font: '700 14.5px Manrope,sans-serif', color: 'var(--ink)' }}>{m.title}</span>
                <span style={{ font: '700 9.5px Manrope,sans-serif', letterSpacing: '.06em', padding: '2.5px 7px', borderRadius: 5, background: m.pTint, color: m.pColor }}>{m.practice}</span>
                {m.freshDisplay !== 'none' && (
                  <span style={{ font: '700 9.5px Manrope,sans-serif', letterSpacing: '.08em', padding: '2.5px 8px', borderRadius: 5, background: 'linear-gradient(90deg,#4192B9,#5AC3A7)', color: '#fff' }}>{m.freshLabel}</span>
                )}
              </div>
              <div style={{ font: '500 12px Manrope,sans-serif', color: 'var(--ink2)', marginBottom: 8 }}>
                {m.client} · {m.dur} · {m.stats}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                {m.people.map((p: any, i: number) => (
                  <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, height: 21, padding: '0 8px 0 3px', borderRadius: 20, background: 'var(--panel2)', font: '600 10.5px Manrope,sans-serif', color: 'var(--ink2)' }}>
                    <span style={{ width: 16, height: 16, borderRadius: '50%', background: p.color, color: '#fff', display: 'grid', placeItems: 'center', font: '700 7.5px Manrope,sans-serif' }}>{p.ini}</span>
                    {p.name}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
              <span style={{ font: '700 9.5px Manrope,sans-serif', letterSpacing: '.05em', color: m.statusFg, background: m.statusBg, padding: '3px 8px', borderRadius: 5 }}>{m.statusLabel}</span>
              {m.unknown && (
                <span style={{ font: '700 10px Manrope,sans-serif', color: '#FF6A00', background: 'rgba(255,106,0,.11)', padding: '3px 8px', borderRadius: 5 }}>{m.unknownLabel}</span>
              )}
              <span style={{ font: '600 11px Manrope,sans-serif', color: 'var(--ink3)' }}>{m.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
