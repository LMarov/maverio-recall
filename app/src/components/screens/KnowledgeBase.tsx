import type { ViewModel } from '../../useApp';

export function KnowledgeBase({ view }: { view: ViewModel }) {
  return (
    <div style={{ padding: '26px 28px 40px' }}>
      <h1 style={{ font: '600 27px/1.15 Poppins,sans-serif', color: 'var(--ink)', margin: '0 0 5px', letterSpacing: '-.01em' }}>Company knowledge base</h1>
      <div style={{ font: '500 12.5px/1.6 Manrope,sans-serif', color: 'var(--ink2)', maxWidth: 620, marginBottom: 22 }}>
        Everything Recall captures becomes one markdown file per meeting, with structured front-matter. This is the corpus your in-house model trains on.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(148px,1fr))', gap: 10, marginBottom: 26 }}>
        {view.stats.map((s, i) => (
          <div key={i} style={{ padding: 15, border: '1px solid var(--line)', borderRadius: 11, background: 'var(--panel2)' }}>
            <div style={{ font: '600 25px/1 Poppins,sans-serif', color: 'var(--ink)', marginBottom: 6 }}>{s.n}</div>
            <div style={{ font: '600 10.5px Manrope,sans-serif', color: 'var(--ink3)', letterSpacing: '.04em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ font: '700 9px Manrope,sans-serif', letterSpacing: '.26em', color: 'var(--ink3)', marginBottom: 11 }}>CORPUS</div>
      <div style={{ border: '1px solid var(--line)', borderRadius: 11, overflow: 'hidden' }}>
        {view.corpus.map((c, i) => (
          <div
            key={i}
            onClick={c.open}
            className="row-hover"
            style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto auto', gap: 14, alignItems: 'center', padding: '12px 15px', borderBottom: '1px solid var(--line2)', cursor: 'pointer', background: 'var(--panel)' }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ font: '600 12px JetBrains Mono,monospace', color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.file}</div>
              <div style={{ font: '600 10.5px Manrope,sans-serif', color: 'var(--ink3)', marginTop: 4 }}>{c.meta}</div>
              <div style={{ font: '600 10px Manrope,sans-serif', color: '#27AC53', marginTop: 3 }}>{c.publishStamp}</div>
            </div>
            <span style={{ font: '700 9.5px Manrope,sans-serif', letterSpacing: '.05em', padding: '3px 7px', borderRadius: 5, background: c.pTint, color: c.pColor }}>{c.practice}</span>
            <span style={{ font: '600 11px Manrope,sans-serif', color: 'var(--ink3)', whiteSpace: 'nowrap' }}>{c.size}</span>
          </div>
        ))}
      </div>

      {view.draftsList.length > 0 && (
        <>
          <div style={{ font: '700 9px Manrope,sans-serif', letterSpacing: '.26em', color: 'var(--ink3)', margin: '22px 0 11px' }}>
            DRAFTS · NOT IN THE CORPUS
          </div>
          <div style={{ border: '1px dashed var(--line)', borderRadius: 11, overflow: 'hidden' }}>
            {view.draftsList.map((d, i) => (
              <div
                key={i}
                style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto auto auto', gap: 12, alignItems: 'center', padding: '12px 15px', borderBottom: '1px solid var(--line2)', background: 'var(--panel)' }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ font: '600 12.5px Manrope,sans-serif', color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.title}</div>
                  <div style={{ font: '600 10.5px Manrope,sans-serif', color: 'var(--ink3)', marginTop: 4 }}>{d.meta}</div>
                </div>
                <span style={{ font: '700 9.5px Manrope,sans-serif', letterSpacing: '.05em', padding: '3px 7px', borderRadius: 5, background: d.pTint, color: d.pColor }}>{d.practice}</span>
                <button onClick={d.review} style={{ height: 28, padding: '0 12px', borderRadius: 7, border: '1px solid var(--line)', background: 'var(--panel2)', color: 'var(--ink2)', font: '700 11px Manrope,sans-serif' }}>
                  Review
                </button>
                <button onClick={d.publish} style={{ height: 28, padding: '0 12px', borderRadius: 7, border: 0, background: 'linear-gradient(90deg,#4192B9,#5AC3A7)', color: '#fff', font: '700 11px Manrope,sans-serif' }}>
                  Publish
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ marginTop: 18, padding: '15px 17px', border: '1px dashed var(--line)', borderRadius: 11, display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 220, font: '500 12px/1.6 Manrope,sans-serif', color: 'var(--ink2)' }}>
          Retention: keep audio 30 days, transcripts and fields forever. Only the five Maverio accounts can read this library; every access is written to the audit log.
        </div>
        <button onClick={view.goSettings} style={{ height: 30, padding: '0 14px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--panel2)', color: 'var(--ink)', font: '700 11px Manrope,sans-serif' }}>
          Review policy
        </button>
      </div>
    </div>
  );
}
