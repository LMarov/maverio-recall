import type { ViewModel } from '../useApp';
import { ScheduledPanel } from './ScheduledPanel';

export function AskRail({ view }: { view: ViewModel }) {
  return (
    <>
      {view.scrim && <div onClick={view.toggleRail} style={{ position: 'absolute', inset: '52px 0 0', background: 'rgba(10,17,22,.34)', zIndex: 5 }} />}
      {view.railOpen && (
        <div
          style={{
            flex: 'none',
            position: view.railPos as any,
            top: 52,
            right: 0,
            bottom: 0,
            zIndex: 6,
            boxShadow: view.railShadow,
            width: view.railW,
            maxWidth: '100%',
            display: 'flex',
            flexDirection: 'column',
            borderLeft: '1px solid var(--line)',
            background: 'var(--panel2)',
            minHeight: 0
          }}
        >
          <div style={{ flex: 'none', padding: '12px 12px 0', borderBottom: '1px solid var(--line)' }}>
            <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
              <button
                onClick={view.goAskTab}
                style={{ flex: 1, height: 30, borderRadius: 8, border: 0, background: view.isAskTab ? 'var(--panel)' : 'transparent', color: view.isAskTab ? 'var(--ink)' : 'var(--ink3)', font: '700 11.5px Manrope,sans-serif' }}
              >
                Ask
              </button>
              <button
                onClick={view.goScheduledTab}
                style={{
                  flex: 1,
                  height: 30,
                  borderRadius: 8,
                  border: 0,
                  background: view.isScheduledTab ? 'var(--panel)' : 'transparent',
                  color: view.isScheduledTab ? 'var(--ink)' : 'var(--ink3)',
                  font: '700 11.5px Manrope,sans-serif',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                Scheduled
                {view.scheduledCount > 0 && (
                  <span style={{ font: '700 9.5px Manrope,sans-serif', padding: '2px 6px', borderRadius: 20, background: '#FF6A00', color: '#fff' }}>{view.scheduledCount}</span>
                )}
              </button>
            </div>
            {view.isAskTab ? (
              <div style={{ paddingBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'linear-gradient(90deg,#4192B9,#5AC3A7)', display: 'block' }} />
                  <span style={{ font: '700 12.5px Manrope,sans-serif', color: 'var(--ink)' }}>Ask your meetings</span>
                </div>
                <div style={{ font: '600 10.5px Manrope,sans-serif', color: 'var(--ink3)' }}>{view.askScope}</div>
              </div>
            ) : (
              <div style={{ paddingBottom: 12 }}>
                <div style={{ font: '700 12.5px Manrope,sans-serif', color: 'var(--ink)', marginBottom: 5 }}>Scheduled meetings</div>
                <div style={{ font: '600 10.5px Manrope,sans-serif', color: 'var(--ink3)' }}>Loaded and ready when it's time to record</div>
              </div>
            )}
          </div>

          {view.isAskTab ? (
            <>
              <div style={{ flex: 1, overflow: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 13, minHeight: 0 }}>
                {view.chat.map((c, i) => (
                  <div key={i} style={{ animation: 'rise .22s ease both' }}>
                    <div style={{ font: '700 9px Manrope,sans-serif', letterSpacing: '.2em', color: c.tagColor, marginBottom: 6 }}>{c.tag}</div>
                    <div style={{ font: '500 13px/1.68 Manrope,sans-serif', color: c.fg, background: c.bg, border: `1px solid ${c.border}`, padding: '11px 13px', borderRadius: 10, textWrap: 'pretty' } as React.CSSProperties}>
                      {c.text}
                    </div>
                    {c.hasCites && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                        {c.cites.map((q, j) => (
                          <button
                            key={j}
                            onClick={q.open}
                            className="cite-hover"
                            style={{ display: 'flex', alignItems: 'center', gap: 6, height: 24, padding: '0 9px', borderRadius: 6, border: '1px solid var(--line)', background: 'var(--panel)', color: 'var(--ink2)', font: '600 10.5px Manrope,sans-serif' }}
                          >
                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: q.dot, display: 'block' }} />
                            {q.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {view.thinking && <div style={{ font: '600 11.5px Manrope,sans-serif', color: 'var(--ink3)' }}>Reading 8 meetings…</div>}
              </div>

              <div style={{ flex: 'none', padding: '11px 14px 14px', borderTop: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                  {view.prompts.map((p, i) => (
                    <button
                      key={i}
                      onClick={p.ask}
                      className="prompt-hover"
                      style={{ height: 25, padding: '0 10px', borderRadius: 20, border: '1px solid var(--line)', background: 'var(--panel)', color: 'var(--ink2)', font: '600 10.5px Manrope,sans-serif' }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    view.onSubmitAsk();
                  }}
                  style={{ display: 'flex', gap: 7, alignItems: 'center' }}
                >
                  <input
                    value={view.draft}
                    onChange={(e) => view.onDraft(e.target.value)}
                    placeholder="Ask anything about your meetings"
                    style={{ flex: 1, minWidth: 0, height: 34, padding: '0 12px', borderRadius: 9, border: '1px solid var(--line)', background: 'var(--panel)', font: '500 12.5px Manrope,sans-serif', color: 'var(--ink)' }}
                  />
                  <button type="submit" style={{ width: 34, height: 34, borderRadius: 9, border: 0, background: 'linear-gradient(135deg,#4192B9,#5AC3A7)', color: '#fff', fontSize: 14, display: 'grid', placeItems: 'center', flex: 'none' }}>
                    ↑
                  </button>
                </form>
              </div>
            </>
          ) : (
            <ScheduledPanel view={view} />
          )}
        </div>
      )}
    </>
  );
}
