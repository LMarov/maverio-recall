import type { ViewModel } from '../../useApp';

export function Clients({ view }: { view: ViewModel }) {
  return (
    <div style={{ padding: '26px 28px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <div>
          <h1 style={{ font: '600 27px/1.15 Poppins,sans-serif', color: 'var(--ink)', margin: '0 0 5px', letterSpacing: '-.01em' }}>{view.clientHeading}</h1>
          <div style={{ font: '500 12.5px Manrope,sans-serif', color: 'var(--ink2)' }}>{view.clientSub}</div>
        </div>
        <div style={{ display: 'flex', gap: 7 }}>
          <button
            onClick={view.backToClients}
            style={{ height: 32, padding: '0 13px 0 11px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--panel2)', color: 'var(--ink)', font: '700 11.5px Manrope,sans-serif', display: view.clientBackDisplay as any, alignItems: 'center', gap: 6 }}
          >
            ← All clients
          </button>
          <button
            onClick={view.toggleArchiveSel}
            style={{ height: 32, padding: '0 13px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--panel2)', color: 'var(--ink2)', font: '700 11.5px Manrope,sans-serif', display: view.clientEditDisplay as any }}
          >
            {view.clientArchiveLabel}
          </button>
          <button
            onClick={view.startEditClient}
            style={{ height: 32, padding: '0 13px', borderRadius: 8, border: '1px solid var(--aqua1)', background: 'var(--tint)', color: 'var(--ink)', font: '700 11.5px Manrope,sans-serif', display: view.clientEditDisplay as any }}
          >
            Edit details
          </button>
          <button
            onClick={view.startNewClient}
            style={{ height: 32, padding: '0 14px', borderRadius: 8, border: 0, background: 'linear-gradient(90deg,#4192B9,#5AC3A7)', color: '#fff', font: '700 11.5px Manrope,sans-serif', display: view.clientAddDisplay as any }}
          >
            + Add client
          </button>
        </div>
      </div>

      {view.clientModeList && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(272px,1fr))', gap: 11 }}>
            {view.clientCards.map((c) => (
              <div key={c.name} onClick={c.open} className="row-hover" style={{ padding: '16px 17px', border: '1px solid var(--line)', borderRadius: 11, cursor: 'pointer', background: 'var(--panel)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 9 }}>
                  <span style={{ font: '700 14.5px Manrope,sans-serif', color: 'var(--ink)' }}>{c.name}</span>
                  <span style={{ font: '700 9.5px Manrope,sans-serif', letterSpacing: '.05em', padding: '2.5px 7px', borderRadius: 5, background: c.pTint, color: c.pColor }}>{c.practice}</span>
                </div>
                <div style={{ font: '600 11.5px Manrope,sans-serif', color: 'var(--ink2)', marginBottom: 12 }}>{c.stage}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
                  <div>
                    <div style={{ font: '600 17px/1 Poppins,sans-serif', color: 'var(--ink)' }}>{c.meetings}</div>
                    <div style={{ font: '600 9.5px Manrope,sans-serif', color: 'var(--ink3)', letterSpacing: '.05em', marginTop: 4 }}>MEETINGS</div>
                  </div>
                  <div>
                    <div style={{ font: '600 17px/1 Poppins,sans-serif', color: 'var(--ink)' }}>{c.contactCount}</div>
                    <div style={{ font: '600 9.5px Manrope,sans-serif', color: 'var(--ink3)', letterSpacing: '.05em', marginTop: 4 }}>CONTACTS</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {view.hasArchivedCards && (
            <div style={{ marginTop: 26 }}>
              <div style={{ font: '700 9px Manrope,sans-serif', letterSpacing: '.26em', color: 'var(--ink3)', marginBottom: 11 }}>ARCHIVED</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(272px,1fr))', gap: 11 }}>
                {view.archivedCards.map((c) => (
                  <div key={c.name} style={{ padding: '14px 16px', border: '1px dashed var(--line)', borderRadius: 11, background: 'var(--panel2)', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div onClick={c.open} style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
                      <div style={{ font: '700 13.5px Manrope,sans-serif', color: 'var(--ink2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                      <div style={{ font: '500 11px Manrope,sans-serif', color: 'var(--ink3)', marginTop: 4 }}>{c.practice} · {c.meetings} meetings on file</div>
                    </div>
                    <button onClick={c.restore} style={{ height: 28, padding: '0 11px', borderRadius: 7, border: '1px solid var(--line)', background: 'var(--panel)', color: 'var(--ink2)', font: '700 10.5px Manrope,sans-serif', whiteSpace: 'nowrap' }}>
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {view.clientModeForm && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 18, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ padding: '16px 17px', border: '1px solid var(--line)', borderRadius: 11 }}>
              <div style={{ font: '700 9px Manrope,sans-serif', letterSpacing: '.26em', color: 'var(--ink3)', marginBottom: 12 }}>THE COMPANY</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {view.clientFields.map((f) => (
                  <label key={f.key} style={{ display: 'block' }}>
                    <span style={{ display: 'block', font: '700 10px Manrope,sans-serif', letterSpacing: '.08em', color: 'var(--ink3)', marginBottom: 5 }}>{f.label}</span>
                    <input
                      value={f.value}
                      onChange={(e) => f.set(e.target.value)}
                      placeholder={f.placeholder}
                      style={{ width: '100%', height: 34, padding: '0 12px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--panel2)', font: '500 12.5px Manrope,sans-serif', color: 'var(--ink)' }}
                    />
                  </label>
                ))}
                <label style={{ display: 'block' }}>
                  <span style={{ display: 'block', font: '700 10px Manrope,sans-serif', letterSpacing: '.08em', color: 'var(--ink3)', marginBottom: 5 }}>NOTES</span>
                  <textarea
                    value={view.newNotes}
                    onChange={(e) => view.onNewNotes(e.target.value)}
                    placeholder="How they buy, who really decides, anything the team should know before a call"
                    style={{ width: '100%', height: 74, padding: '9px 12px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--panel2)', font: '500 12.5px/1.6 Manrope,sans-serif', color: 'var(--ink)', resize: 'vertical' }}
                  />
                </label>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                {view.newPractices.map((p) => (
                  <button key={p.label} onClick={p.pick} style={{ height: 28, padding: '0 11px', borderRadius: 20, border: `1px solid ${p.border}`, background: p.bg, color: p.fg, font: '700 11px Manrope,sans-serif', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: p.dot, display: 'block' }} />
                    {p.label}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {view.newStages.map((g) => (
                  <button key={g.label} onClick={g.pick} style={{ height: 28, padding: '0 11px', borderRadius: 20, border: `1px solid ${g.border}`, background: g.bg, color: g.fg, font: '600 11px Manrope,sans-serif' }}>
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ padding: '16px 17px', border: '1px solid var(--line)', borderRadius: 11 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
                <span style={{ font: '700 9px Manrope,sans-serif', letterSpacing: '.26em', color: 'var(--ink3)' }}>KEY PEOPLE</span>
                <span style={{ font: '600 10.5px Manrope,sans-serif', color: 'var(--ink3)' }}>project managers, decision makers, finance</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                {view.newContacts.map((c, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '26px minmax(0,1fr) auto', gap: 10, alignItems: 'center', padding: '9px 11px', borderRadius: 8, background: 'var(--panel2)' }}>
                    <span style={{ width: 26, height: 26, borderRadius: '50%', background: c.color, color: '#fff', display: 'grid', placeItems: 'center', font: '700 9px Manrope,sans-serif' }}>{c.ini}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ font: '700 12px Manrope,sans-serif', color: 'var(--ink)' }}>
                        {c.name} <span style={{ font: '600 11px Manrope,sans-serif', color: 'var(--ink3)' }}>· {c.role}</span>
                      </div>
                      <div style={{ font: '500 10.5px Manrope,sans-serif', color: 'var(--ink3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.line}</div>
                    </div>
                    <button onClick={c.remove} className="x-hover" style={{ width: 22, height: 22, borderRadius: 6, border: 0, background: 'transparent', color: 'var(--ink3)', fontSize: 12 }}>
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  view.addContact();
                }}
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}
              >
                <input value={view.ctName} onChange={(e) => view.onCtName(e.target.value)} placeholder="Full name" style={{ height: 32, padding: '0 11px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--panel)', font: '500 12px Manrope,sans-serif', color: 'var(--ink)' }} />
                <input value={view.ctRole} onChange={(e) => view.onCtRole(e.target.value)} placeholder="Role, e.g. Project manager" style={{ height: 32, padding: '0 11px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--panel)', font: '500 12px Manrope,sans-serif', color: 'var(--ink)' }} />
                <input value={view.ctEmail} onChange={(e) => view.onCtEmail(e.target.value)} placeholder="Email" style={{ height: 32, padding: '0 11px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--panel)', font: '500 12px Manrope,sans-serif', color: 'var(--ink)' }} />
                <input value={view.ctPhone} onChange={(e) => view.onCtPhone(e.target.value)} placeholder="Phone" style={{ height: 32, padding: '0 11px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--panel)', font: '500 12px Manrope,sans-serif', color: 'var(--ink)' }} />
                <button type="submit" style={{ gridColumn: 'span 2', height: 32, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--panel2)', color: 'var(--ink)', font: '700 11px Manrope,sans-serif' }}>
                  + Add person
                </button>
              </form>
            </div>

            <div style={{ padding: '17px 18px', borderRadius: 11, background: 'var(--tint)', border: '1px solid var(--line2)' }}>
              <div style={{ font: '700 9px Manrope,sans-serif', letterSpacing: '.26em', color: 'var(--ink3)', marginBottom: 10 }}>WHAT HAPPENS ON SAVE</div>
              <div style={{ font: '500 12px/1.7 Manrope,sans-serif', color: 'var(--ink2)', marginBottom: 14 }}>{view.saveIntro}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={view.cancelClientForm} style={{ flex: 'none', height: 38, padding: '0 15px', borderRadius: 9, border: '1px solid var(--line)', background: 'transparent', color: 'var(--ink2)', font: '700 12px Manrope,sans-serif' }}>
                  Cancel
                </button>
                <button onClick={view.saveClient} style={{ flex: 1, height: 38, borderRadius: 9, border: 0, background: view.saveClientBg, color: view.saveClientFg, font: '700 12.5px Manrope,sans-serif' }}>
                  {view.saveClientLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {view.clientModeDetail && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 18, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ border: '1px solid var(--line)', borderRadius: 11, overflow: 'hidden' }}>
              {view.detailFacts.map((f, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '132px minmax(0,1fr)', gap: 14, padding: '11px 15px', borderBottom: '1px solid var(--line2)', background: f.bg }}>
                  <span style={{ font: '600 11px JetBrains Mono,monospace', color: 'var(--ink3)' }}>{f.k}</span>
                  <span style={{ font: '600 12.5px/1.55 Manrope,sans-serif', color: 'var(--ink)' }}>{f.v}</span>
                </div>
              ))}
            </div>
            <div style={{ padding: '16px 17px', border: '1px solid var(--line)', borderRadius: 11 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                <span style={{ font: '700 9px Manrope,sans-serif', letterSpacing: '.26em', color: 'var(--ink3)' }}>NOTES</span>
                <span style={{ font: '600 10.5px Manrope,sans-serif', color: 'var(--ink3)' }}>{view.noteCount}</span>
              </div>
              <div style={{ maxHeight: 230, overflow: 'auto', paddingRight: 4, display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 12 }}>
                {view.detailNotes.map((n, i) => (
                  <div key={i} style={{ paddingBottom: 12, borderBottom: `1px solid ${n.divider}` }}>
                    <div style={{ font: '600 10px Manrope,sans-serif', letterSpacing: '.05em', color: 'var(--ink3)', marginBottom: 5 }}>{n.meta}</div>
                    <div style={{ font: '500 12.5px/1.7 Manrope,sans-serif', color: 'var(--ink2)', textWrap: 'pretty' } as React.CSSProperties}>{n.text}</div>
                  </div>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  view.addNote();
                }}
                style={{ display: 'flex', flexDirection: 'column', gap: 7 }}
              >
                <textarea
                  value={view.noteDraft}
                  onChange={(e) => view.onNoteDraft(e.target.value)}
                  placeholder="Add a note — what changed, who to watch, what to raise next time"
                  style={{ width: '100%', height: 62, padding: '9px 12px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--panel2)', font: '500 12.5px/1.6 Manrope,sans-serif', color: 'var(--ink)', resize: 'vertical' }}
                />
                <button type="submit" style={{ height: 32, borderRadius: 8, border: 0, background: view.noteBtnBg, color: view.noteBtnFg, font: '700 11.5px Manrope,sans-serif' }}>
                  {view.noteBtnLabel}
                </button>
              </form>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ padding: '16px 17px', border: '1px solid var(--line)', borderRadius: 11 }}>
              <div style={{ font: '700 9px Manrope,sans-serif', letterSpacing: '.26em', color: 'var(--ink3)', marginBottom: 11 }}>KEY PEOPLE</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {view.detailContacts.map((c, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '28px minmax(0,1fr) auto', gap: 11, alignItems: 'center' }}>
                    <span style={{ width: 28, height: 28, borderRadius: '50%', background: c.color, color: '#fff', display: 'grid', placeItems: 'center', font: '700 9.5px Manrope,sans-serif' }}>{c.ini}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ font: '700 12.5px Manrope,sans-serif', color: 'var(--ink)' }}>
                        {c.name} <span style={{ font: '600 11px Manrope,sans-serif', color: 'var(--ink3)' }}>· {c.role}</span>
                      </div>
                      <div style={{ font: '500 10.5px Manrope,sans-serif', color: 'var(--ink3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.line}</div>
                    </div>
                    <span style={{ font: '600 9.5px Manrope,sans-serif', color: c.vpColor, background: c.vpTint, padding: '3px 7px', borderRadius: 20, whiteSpace: 'nowrap' }}>{c.vp}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding: '16px 17px', border: '1px solid var(--line)', borderRadius: 11 }}>
              <div style={{ font: '700 9px Manrope,sans-serif', letterSpacing: '.26em', color: 'var(--ink3)', marginBottom: 11 }}>MEETINGS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {view.detailMeetings.map((m, i) => (
                  <button
                    key={i}
                    onClick={m.open}
                    className="row-hover"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(0,1fr) auto',
                      gap: 12,
                      alignItems: 'center',
                      padding: '10px 12px',
                      border: m.badge ? '1px dashed #FF6A00' : '1px solid var(--line)',
                      borderRadius: 9,
                      background: m.badge ? 'rgba(255,106,0,.05)' : 'transparent',
                      textAlign: 'left'
                    }}
                  >
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                        <span style={{ font: '700 12.5px Manrope,sans-serif', color: 'var(--ink)' }}>{m.title}</span>
                        {m.badge && (
                          <span style={{ font: '700 9px Manrope,sans-serif', letterSpacing: '.06em', padding: '2px 6px', borderRadius: 5, background: '#FF6A00', color: '#fff' }}>{m.badge}</span>
                        )}
                      </span>
                      <span style={{ display: 'block', font: '600 10.5px Manrope,sans-serif', color: 'var(--ink3)', marginTop: 3 }}>{m.meta}</span>
                    </span>
                    <span style={{ font: '500 11px JetBrains Mono,monospace', color: 'var(--ink3)', whiteSpace: 'nowrap' }}>{m.date}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
