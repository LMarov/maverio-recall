import type { ViewModel } from '../../useApp';

export function MeetingDetail({ view }: { view: ViewModel }) {
  const cur = view.cur as any;

  return (
    <div>
      <div style={{ padding: '22px 28px 0' }}>
        <button onClick={view.backToLibrary} style={{ border: 0, background: 'transparent', padding: 0, font: '600 11.5px Manrope,sans-serif', color: 'var(--ink2)', marginBottom: 14 }}>
          ← Timeline
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap', marginBottom: 7 }}>
          <span style={{ font: '700 9.5px Manrope,sans-serif', letterSpacing: '.06em', padding: '3px 8px', borderRadius: 5, background: cur.pTint, color: cur.pColor }}>{cur.practice}</span>
          <span style={{ font: '600 11.5px Manrope,sans-serif', color: 'var(--ink3)' }}>{cur.client}</span>
        </div>

        {view.notEditingTitle && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0 0 7px', flexWrap: 'wrap' }}>
            <h1 style={{ font: '600 26px/1.2 Poppins,sans-serif', color: 'var(--ink)', margin: 0, letterSpacing: '-.01em' }}>{cur.title}</h1>
            <button
              onClick={view.startEditTitle}
              title="Rename this meeting"
              style={{ display: 'flex', alignItems: 'center', gap: 6, height: 28, padding: '0 11px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--panel2)', color: 'var(--ink2)', font: '700 11px Manrope,sans-serif' }}
            >
              <span style={{ fontSize: 11, lineHeight: 1 }}>✎</span>Edit
            </button>
            {view.titleEdited && (
              <span style={{ font: '600 10px Manrope,sans-serif', letterSpacing: '.1em', color: 'var(--ink3)', background: 'var(--panel3)', padding: '3px 8px', borderRadius: 5 }}>RENAMED BY YOU</span>
            )}
          </div>
        )}
        {view.editingTitle && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              view.saveTitle();
            }}
            style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '0 0 7px', flexWrap: 'wrap' }}
          >
            <input
              value={view.titleDraft}
              onChange={(e) => view.onTitleDraft(e.target.value)}
              autoFocus
              style={{ flex: 1, minWidth: 240, height: 42, padding: '0 13px', borderRadius: 10, border: '1px solid var(--line2)', background: 'var(--panel)', color: 'var(--ink)', font: '600 20px Poppins,sans-serif' }}
            />
            <button type="submit" style={{ height: 38, padding: '0 15px', borderRadius: 9, border: 0, background: 'linear-gradient(90deg,#4192B9,#5AC3A7)', color: '#fff', font: '700 12px Manrope,sans-serif' }}>
              Save
            </button>
            <button type="button" onClick={view.cancelEditTitle} style={{ height: 38, padding: '0 13px', borderRadius: 9, border: '1px solid var(--line)', background: 'var(--panel2)', color: 'var(--ink2)', font: '700 12px Manrope,sans-serif' }}>
              Cancel
            </button>
          </form>
        )}

        <div style={{ font: '500 12.5px Manrope,sans-serif', color: 'var(--ink2)' }}>{cur.metaLine}</div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginTop: 12, padding: '9px 13px', borderRadius: 9, border: `1px solid ${cur.publishStatusBorder}`, background: cur.publishStatusBg }}>
          <span style={{ font: '600 11.5px Manrope,sans-serif', color: cur.publishStatusFg }}>{cur.publishStatusLine}</span>
          <button
            onClick={cur.togglePublish}
            style={{
              height: 28,
              padding: '0 13px',
              borderRadius: 7,
              border: cur.published ? '1px solid var(--line)' : 0,
              background: cur.published ? 'var(--panel2)' : 'linear-gradient(90deg,#4192B9,#5AC3A7)',
              color: cur.published ? 'var(--ink2)' : '#fff',
              font: '700 11px Manrope,sans-serif'
            }}
          >
            {cur.publishBtnLabel}
          </button>
        </div>

        {view.transcribing && (
          <div style={{ marginTop: 16, padding: '13px 16px', border: '1px solid var(--line2)', borderRadius: 11, background: 'var(--tint)', display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 7, font: '700 10px Manrope,sans-serif', letterSpacing: '.14em', color: '#FF6A00' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#FF6A00', display: 'block' }} />
              TRANSCRIBING
            </span>
            <span style={{ flex: 1, minWidth: 220, font: '500 12.5px/1.6 Manrope,sans-serif', color: 'var(--ink2)' }}>
              Your recording is being transcribed and speakers separated. This can take a little while depending on length — the transcript and analysis will fill in automatically.
            </span>
          </div>
        )}
        {view.analysing && (
          <div style={{ marginTop: 16, padding: '13px 16px', border: '1px solid var(--line2)', borderRadius: 11, background: 'var(--tint)', display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 7, font: '700 10px Manrope,sans-serif', letterSpacing: '.14em', color: '#27AC53' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#27AC53', display: 'block' }} />
              TRANSCRIPT COMPLETE
            </span>
            <span style={{ flex: 1, minWidth: 220, font: '500 12.5px/1.6 Manrope,sans-serif', color: 'var(--ink2)' }}>
              Speakers are separated and the full transcript is readable now. Decisions, actions and extracted fields are still being analysed and will fill in on the Summary tab.
            </span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 3, marginTop: 18, borderBottom: '1px solid var(--line)' }}>
          {view.tabs.map((t) => (
            <button key={t.label} onClick={t.go} style={{ padding: '9px 14px', border: 0, background: 'transparent', borderBottom: `2px solid ${t.line}`, color: t.fg, font: '700 12px Manrope,sans-serif', marginBottom: -1 }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {view.tabSummary && (
        <div style={{ padding: '22px 28px 40px', display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div style={{ padding: '18px 20px', borderRadius: 12, background: 'var(--tint)', border: '1px solid var(--line2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 11 }}>
              <span style={{ font: '700 9px Manrope,sans-serif', letterSpacing: '.26em', color: 'var(--ink3)' }}>KEY OBJECTIVE</span>
              <span style={{ font: '500 10.5px JetBrains Mono,monospace', color: 'var(--ink3)' }}>{view.objectiveCite}</span>
            </div>
            <div style={{ font: '700 18px/1.4 Poppins,sans-serif', color: 'var(--ink)', textWrap: 'pretty' } as React.CSSProperties}>{view.objective}</div>
            <div style={{ height: 1, background: 'var(--line2)', margin: '16px 0 14px' }} />
            <div style={{ font: '700 9px Manrope,sans-serif', letterSpacing: '.26em', color: 'var(--ink3)', marginBottom: 9 }}>AI SUMMARY · FROM THE RECORDING ONLY</div>
            {view.analysing && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9, font: '700 10px Manrope,sans-serif', letterSpacing: '.14em', color: '#FF6A00' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#FF6A00', display: 'block' }} />
                ANALYSING · TRANSCRIPT ALREADY DONE
              </div>
            )}
            <div style={{ font: '500 14px/1.65 Manrope,sans-serif', color: 'var(--ink)', textWrap: 'pretty' } as React.CSSProperties}>{cur.summary}</div>
            <div style={{ marginTop: 12, font: '500 11.5px/1.6 Manrope,sans-serif', color: 'var(--ink3)', textWrap: 'pretty' } as React.CSSProperties}>
              Written only from what was said. Nothing is inferred to fill a gap — anything missing is listed as a question below.
            </div>
          </div>

          <div>
            <div style={{ font: '700 9px Manrope,sans-serif', letterSpacing: '.26em', color: 'var(--ink3)', marginBottom: 10 }}>DECISIONS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {cur.decisions.map((d: any, i: number) => (
                <div key={i} style={{ display: 'flex', gap: 11, padding: '12px 14px', border: '1px solid var(--line)', borderRadius: 9 }}>
                  <span style={{ width: 5, borderRadius: 3, background: 'linear-gradient(180deg,#4192B9,#5AC3A7)', flex: 'none', display: 'block' }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ font: '600 13.5px/1.5 Manrope,sans-serif', color: 'var(--ink)' }}>{d.text}</div>
                    <div style={{ font: '500 11px JetBrains Mono,monospace', color: 'var(--ink3)', marginTop: 5 }}>{d.cite}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
              <span style={{ font: '700 9px Manrope,sans-serif', letterSpacing: '.26em', color: 'var(--ink3)' }}>ACTIONS</span>
              <span style={{ font: '600 10.5px Manrope,sans-serif', color: 'var(--ink3)' }}>{view.actionCount} · each traced to a line in the recording</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {cur.actions.map((a: any, i: number) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: 'auto minmax(0,1fr) auto', gap: 13, alignItems: 'start', padding: '13px 15px', border: '1px solid var(--line)', borderRadius: 10 }}>
                  <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <span style={{ font: '700 10px JetBrains Mono,monospace', color: 'var(--ink3)' }}>{a.n}</span>
                    <span style={{ width: 24, height: 24, borderRadius: '50%', background: a.color, color: '#fff', display: 'grid', placeItems: 'center', font: '700 8.5px Manrope,sans-serif' }}>{a.ini}</span>
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', font: '600 13.5px/1.45 Manrope,sans-serif', color: 'var(--ink)' }}>{a.text}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap', marginTop: 6 }}>
                      <span style={{ font: '600 11px Manrope,sans-serif', color: 'var(--ink2)' }}>{a.who}</span>
                      <span style={{ font: '500 10.5px JetBrains Mono,monospace', color: 'var(--ink3)' }}>{a.srcLabel}</span>
                    </span>
                  </span>
                  <span style={{ font: '700 10.5px Manrope,sans-serif', color: a.dueFg, background: a.dueBg, padding: '5px 9px', borderRadius: 6, whiteSpace: 'nowrap' }}>{a.due}</span>
                </div>
              ))}
            </div>
          </div>

          {view.hasGaps && (
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
                <span style={{ font: '700 9px Manrope,sans-serif', letterSpacing: '.26em', color: '#FF6A00' }}>QUESTIONS FOR YOU</span>
                <span style={{ font: '600 10.5px Manrope,sans-serif', color: 'var(--ink3)' }}>{view.gapCount} · not said on the recording, so not answered here</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {view.gaps.map((g) => (
                  <div key={g.n} style={{ padding: '14px 16px', border: '1px solid rgba(255,106,0,.35)', borderRadius: 10, background: 'rgba(255,106,0,.05)' }}>
                    <div style={{ display: 'flex', gap: 11, alignItems: 'baseline' }}>
                      <span style={{ font: '700 10px JetBrains Mono,monospace', color: '#FF6A00' }}>{g.n}</span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ font: '600 13.5px/1.45 Manrope,sans-serif', color: 'var(--ink)' }}>{g.q}</div>
                        <div style={{ font: '500 11.5px/1.6 Manrope,sans-serif', color: 'var(--ink2)', marginTop: 5 }}>{g.why}</div>
                        <div style={{ font: '500 10.5px JetBrains Mono,monospace', color: 'var(--ink3)', marginTop: 5 }}>{g.citeLabel}</div>
                        {g.unanswered && (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              g.submit();
                            }}
                            style={{ display: 'flex', gap: 7, marginTop: 11 }}
                          >
                            <input
                              value={g.draft}
                              onChange={(e) => g.onDraft(e.target.value)}
                              placeholder="Answer it and Recall records your answer, not a guess"
                              style={{ flex: 1, minWidth: 0, height: 32, padding: '0 11px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--panel)', color: 'var(--ink)', font: '500 12px Manrope,sans-serif' }}
                            />
                            <button type="submit" style={{ height: 32, padding: '0 13px', borderRadius: 8, border: 0, background: 'linear-gradient(90deg,#4192B9,#5AC3A7)', color: '#fff', font: '700 11px Manrope,sans-serif' }}>
                              Save
                            </button>
                          </form>
                        )}
                        {g.answered && (
                          <div style={{ marginTop: 11, padding: '10px 12px', borderRadius: 8, background: 'var(--panel)', border: '1px solid var(--line)' }}>
                            <div style={{ font: '700 9px Manrope,sans-serif', letterSpacing: '.2em', color: '#27AC53', marginBottom: 5 }}>ANSWERED BY YOU · LANA MAROV</div>
                            <div style={{ font: '600 12.5px/1.5 Manrope,sans-serif', color: 'var(--ink)' }}>{g.answer}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <button onClick={view.toggleFields} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, width: '100%', marginBottom: 10, padding: 0, border: 0, background: 'transparent', textAlign: 'left' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ font: '700 9px Manrope,sans-serif', letterSpacing: '.26em', color: 'var(--ink3)' }}>EXTRACTED FIELDS</span>
                <span style={{ font: '600 9.5px Manrope,sans-serif', color: 'var(--ink2)', background: 'var(--panel3)', padding: '2.5px 7px', borderRadius: 5 }}>{view.fieldsCount}</span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ font: '600 10.5px Manrope,sans-serif', color: 'var(--ink3)' }}>{view.fieldsHint}</span>
                <span style={{ fontSize: 10, color: 'var(--ink3)', transform: `rotate(${view.fieldsChevron})`, transition: 'transform .15s ease', display: 'inline-block' }}>▾</span>
              </span>
            </button>
            {view.fieldSyncOn && (
              <button
                onClick={view.goClientFromField}
                style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', marginBottom: 9, padding: '10px 13px', borderRadius: 9, border: '1px solid rgba(39,172,83,.4)', background: 'rgba(39,172,83,.08)', textAlign: 'left' }}
              >
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#27AC53', flex: 'none', display: 'block' }} />
                <span style={{ flex: 1, font: '600 11.5px Manrope,sans-serif', color: 'var(--ink)' }}>{view.fieldSyncLabel}</span>
                <span style={{ font: '700 10.5px Manrope,sans-serif', color: '#27AC53', whiteSpace: 'nowrap' }}>Open profile →</span>
              </button>
            )}
            <div style={{ border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden', display: view.fieldsDisplay as any }}>
              {cur.fields.map((f: any) => (
                <div key={f.key} style={{ display: 'grid', gridTemplateColumns: '168px minmax(0,1fr) auto', gap: 14, alignItems: 'center', padding: '11px 15px', borderBottom: '1px solid var(--line2)', background: f.bg }}>
                  <span style={{ font: '600 11px JetBrains Mono,monospace', color: 'var(--ink3)' }}>{f.key}</span>
                  {f.reading && (
                    <>
                      <span style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
                        <span style={{ font: '600 12.5px/1.5 Manrope,sans-serif', color: 'var(--ink)' }}>{f.val}</span>
                        {f.edited && (
                          <span style={{ font: '700 9px Manrope,sans-serif', letterSpacing: '.14em', color: '#27AC53', background: 'rgba(39,172,83,.12)', padding: '2.5px 7px', borderRadius: 5, whiteSpace: 'nowrap' }}>EDITED BY YOU</span>
                        )}
                      </span>
                      <button onClick={f.start} title="Change this value" style={{ height: 26, padding: '0 10px', borderRadius: 7, border: '1px solid var(--line)', background: 'var(--panel2)', color: 'var(--ink2)', font: '700 10.5px Manrope,sans-serif', whiteSpace: 'nowrap' }}>
                        ✎ Edit
                      </button>
                    </>
                  )}
                  {f.editing && (
                    <>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          f.save();
                        }}
                        style={{ display: 'flex', gap: 7, minWidth: 0 }}
                      >
                        <input
                          value={f.draft}
                          onChange={(e) => f.onDraft(e.target.value)}
                          autoFocus
                          style={{ flex: 1, minWidth: 0, height: 30, padding: '0 10px', borderRadius: 7, border: '1px solid var(--line2)', background: 'var(--panel)', color: 'var(--ink)', font: '600 12.5px Manrope,sans-serif' }}
                        />
                      </form>
                      <span style={{ display: 'flex', gap: 6 }}>
                        <button onClick={f.save} style={{ height: 26, padding: '0 11px', borderRadius: 7, border: 0, background: 'linear-gradient(90deg,#4192B9,#5AC3A7)', color: '#fff', font: '700 10.5px Manrope,sans-serif' }}>
                          Save
                        </button>
                        <button onClick={f.cancel} style={{ height: 26, padding: '0 10px', borderRadius: 7, border: '1px solid var(--line)', background: 'var(--panel2)', color: 'var(--ink2)', font: '700 10.5px Manrope,sans-serif' }}>
                          Cancel
                        </button>
                      </span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {view.tabTranscript && (
        <div style={{ padding: '20px 28px 40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
            <span style={{ font: '600 11.5px Manrope,sans-serif', color: 'var(--ink2)' }}>{cur.diarLine}</span>
            <span style={{ font: '500 11px Manrope,sans-serif', color: 'var(--ink3)' }}>AI transcript · verbatim, no cleanup or paraphrase</span>
            {cur.hasUnknown && (
              <button onClick={view.openNamer} style={{ height: 27, padding: '0 11px', borderRadius: 7, border: '1px solid #FF6A00', background: 'rgba(255,106,0,.10)', color: '#FF6A00', font: '700 11px Manrope,sans-serif' }}>
                Name unrecognised voice
              </button>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 760 }}>
            {cur.lines.map((l: any, i: number) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '56px minmax(0,1fr)', gap: 14, alignItems: 'start', padding: '12px 0 14px', borderTop: `1px solid ${l.divider}` }}>
                <span style={{ font: '500 11px JetBrains Mono,monospace', color: 'var(--ink3)', paddingTop: 3 }}>{l.t}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: l.nameDisplay, alignItems: 'center', gap: 8, marginBottom: 5 } as React.CSSProperties}>
                    <span style={{ width: 22, height: 22, borderRadius: '50%', background: l.color, color: '#fff', display: 'grid', placeItems: 'center', font: '700 8.5px Manrope,sans-serif', flex: 'none' }}>{l.ini}</span>
                    <span style={{ font: '800 12.5px Manrope,sans-serif', color: l.nameColor, letterSpacing: '.005em' }}>{l.who}</span>
                    <span style={{ font: '600 9.5px Manrope,sans-serif', color: '#FF6A00', background: 'rgba(255,106,0,.11)', padding: '2px 6px', borderRadius: 4, display: l.confDisplay }}>{l.conf}</span>
                  </div>
                  <div style={{ font: '500 14px/1.8 Manrope,sans-serif', color: 'var(--ink)', opacity: 0.86, textWrap: 'pretty' } as React.CSSProperties}>{l.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {view.tabExport && (
        <div style={{ padding: '22px 28px 40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
            <div style={{ font: '500 12.5px/1.6 Manrope,sans-serif', color: 'var(--ink2)', maxWidth: 560 }}>
              This is the exact markdown handed to the Maverio LLM pipeline. One file per meeting, front-matter carries the structured fields.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={view.toggleRedact} style={{ height: 30, padding: '0 12px', borderRadius: 8, border: '1px solid var(--line)', background: view.redactBg, color: view.redactFg, font: '700 11px Manrope,sans-serif' }}>
                {view.redactLabel}
              </button>
              <button onClick={view.toggleRedactNames} style={{ height: 30, padding: '0 12px', borderRadius: 8, border: '1px solid var(--line)', background: view.redactNamesBg, color: view.redactNamesFg, font: '700 11px Manrope,sans-serif' }}>
                {view.redactNamesLabel}
              </button>
              <button onClick={view.copyMd} style={{ height: 30, padding: '0 14px', borderRadius: 8, border: 0, background: 'linear-gradient(90deg,#4192B9,#5AC3A7)', color: '#fff', font: '700 11px Manrope,sans-serif' }}>
                {view.copyLabel}
              </button>
            </div>
          </div>
          <pre style={{ margin: 0, padding: 18, borderRadius: 11, background: 'var(--panel2)', border: '1px solid var(--line)', font: '400 11.5px/1.85 JetBrains Mono,monospace', color: 'var(--ink)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {cur.markdown}
          </pre>
        </div>
      )}
    </div>
  );
}
