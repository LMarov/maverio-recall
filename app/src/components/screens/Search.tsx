import type { ViewModel } from '../../useApp';

export function Search({ view }: { view: ViewModel }) {
  return (
    <div style={{ padding: '26px 28px 40px' }}>
      <div style={{ font: '700 9px Manrope,sans-serif', letterSpacing: '.28em', color: 'var(--ink3)', marginBottom: 8 }}>SEARCH</div>
      <h1 style={{ font: '600 25px/1.2 Poppins,sans-serif', color: 'var(--ink)', margin: '0 0 6px' }}>{view.searchHeading}</h1>
      <div style={{ font: '500 12.5px Manrope,sans-serif', color: 'var(--ink2)', marginBottom: 20 }}>{view.searchSub}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {view.searchResults.map((r, i) => (
          <div
            key={i}
            onClick={r.open}
            className="row-hover"
            style={{ padding: '13px 15px', border: '1px solid var(--line)', borderRadius: 10, background: 'var(--panel)', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7, flexWrap: 'wrap' }}>
              <span style={{ width: 18, height: 18, borderRadius: '50%', background: r.color, color: '#fff', display: 'grid', placeItems: 'center', font: '700 8px Manrope,sans-serif' }}>{r.ini}</span>
              <span style={{ font: '700 12px Manrope,sans-serif', color: 'var(--ink)' }}>{r.who}</span>
              <span style={{ font: '500 11px JetBrains Mono,monospace', color: 'var(--ink3)' }}>{r.at}</span>
              <span style={{ font: '600 11px Manrope,sans-serif', color: 'var(--ink3)' }}>· {r.meeting}</span>
            </div>
            <div style={{ font: '500 13px/1.6 Manrope,sans-serif', color: 'var(--ink2)' }}>
              {r.pre}
              {r.hit && (
                <mark style={{ background: 'rgba(90,195,167,.28)', color: 'var(--ink)', borderRadius: 3, padding: '0 2px', fontWeight: 700 }}>{r.hit}</mark>
              )}
              {r.post}
            </div>
          </div>
        ))}
      </div>
      {view.noResults && (
        <div style={{ padding: 34, border: '1px dashed var(--line)', borderRadius: 11, textAlign: 'center', font: '500 13px Manrope,sans-serif', color: 'var(--ink2)' }}>
          Nothing matched. Try a client name, a decision, or a person.
        </div>
      )}
    </div>
  );
}
