import type { ViewModel } from '../../useApp';

export function Prep({ view }: { view: ViewModel }) {
  return (
    <div style={{ padding: '26px 28px 40px' }}>
      <h1 style={{ font: '600 27px/1.15 Poppins,sans-serif', color: 'var(--ink)', margin: '0 0 5px', letterSpacing: '-.01em' }}>Prep a meeting</h1>
      <div style={{ font: '500 12.5px Manrope,sans-serif', color: 'var(--ink2)', marginBottom: 24 }}>
        Set the agenda and the outcomes you want before you walk in. Recall marks each item as it is covered and tells you afterwards what you did not get.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 18, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ padding: '16px 17px', border: '1px solid var(--line)', borderRadius: 11 }}>
            <div style={{ font: '700 9px Manrope,sans-serif', letterSpacing: '.26em', color: 'var(--ink3)', marginBottom: 11 }}>THE MEETING</div>
            <input
              value={view.prepTitle}
              onChange={(e) => view.onPrepTitle(e.target.value)}
              placeholder="What is this meeting called?"
              style={{ width: '100%', height: 36, padding: '0 12px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--panel2)', font: '600 13px Manrope,sans-serif', color: 'var(--ink)', marginBottom: 10 }}
            />
            <input
              value={view.prepClient}
              onChange={(e) => view.onPrepClient(e.target.value)}
              placeholder="Client or team"
              style={{ width: '100%', height: 36, padding: '0 12px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--panel2)', font: '500 12.5px Manrope,sans-serif', color: 'var(--ink)', marginBottom: 11 }}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {view.prepPractices.map((p) => (
                <button key={p.label} onClick={p.pick} style={{ height: 28, padding: '0 11px', borderRadius: 20, border: `1px solid ${p.border}`, background: p.bg, color: p.fg, font: '700 11px Manrope,sans-serif', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: p.dot, display: 'block' }} />
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ padding: '16px 17px', border: '1px solid var(--line)', borderRadius: 11 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, marginBottom: 11 }}>
              <span style={{ font: '700 9px Manrope,sans-serif', letterSpacing: '.26em', color: 'var(--ink3)' }}>AGENDA</span>
              <span style={{ font: '600 10.5px Manrope,sans-serif', color: 'var(--ink3)' }}>becomes chapter markers in the transcript</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
              {view.agenda.map((a, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '22px minmax(0,1fr) auto', gap: 10, alignItems: 'center', padding: '9px 11px', borderRadius: 8, background: 'var(--panel2)' }}>
                  <span style={{ font: '700 11px JetBrains Mono,monospace', color: 'var(--ink3)' }}>{a.n}</span>
                  <span style={{ font: '600 12.5px/1.45 Manrope,sans-serif', color: 'var(--ink)' }}>{a.text}</span>
                  <button onClick={a.remove} title="Remove" className="x-hover" style={{ width: 22, height: 22, borderRadius: 6, border: 0, background: 'transparent', color: 'var(--ink3)', fontSize: 12 }}>
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                view.addAgenda();
              }}
              style={{ display: 'flex', gap: 7 }}
            >
              <input
                value={view.agendaDraft}
                onChange={(e) => view.onAgendaDraft(e.target.value)}
                placeholder="Add an agenda item"
                style={{ flex: 1, minWidth: 0, height: 34, padding: '0 12px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--panel)', font: '500 12.5px Manrope,sans-serif', color: 'var(--ink)' }}
              />
              <button type="submit" style={{ width: 34, height: 34, borderRadius: 8, border: 0, background: 'linear-gradient(135deg,#4192B9,#5AC3A7)', color: '#fff', fontSize: 15, flex: 'none' }}>
                +
              </button>
            </form>
          </div>

          <div style={{ padding: '16px 17px', border: '1px solid var(--line)', borderRadius: 11 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, marginBottom: 11 }}>
              <span style={{ font: '700 9px Manrope,sans-serif', letterSpacing: '.26em', color: 'var(--ink3)' }}>PROPOSED OUTCOMES</span>
              <span style={{ font: '600 10.5px Manrope,sans-serif', color: 'var(--ink3)' }}>checked against real decisions</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
              {view.outcomes.map((o, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '14px minmax(0,1fr) auto', gap: 10, alignItems: 'center', padding: '9px 11px', borderRadius: 8, background: 'var(--tint)' }}>
                  <span style={{ width: 13, height: 13, borderRadius: 4, border: '1.5px solid var(--aqua1)', display: 'block' }} />
                  <span style={{ font: '600 12.5px/1.45 Manrope,sans-serif', color: 'var(--ink)' }}>{o.text}</span>
                  <button onClick={o.remove} title="Remove" className="x-hover" style={{ width: 22, height: 22, borderRadius: 6, border: 0, background: 'transparent', color: 'var(--ink3)', fontSize: 12 }}>
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                view.addOutcome();
              }}
              style={{ display: 'flex', gap: 7 }}
            >
              <input
                value={view.outcomeDraft}
                onChange={(e) => view.onOutcomeDraft(e.target.value)}
                placeholder="What has to be true when you leave?"
                style={{ flex: 1, minWidth: 0, height: 34, padding: '0 12px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--panel)', font: '500 12.5px Manrope,sans-serif', color: 'var(--ink)' }}
              />
              <button type="submit" style={{ width: 34, height: 34, borderRadius: 8, border: 0, background: 'linear-gradient(135deg,#4192B9,#5AC3A7)', color: '#fff', fontSize: 15, flex: 'none' }}>
                +
              </button>
            </form>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ padding: '16px 17px', border: '1px solid var(--line)', borderRadius: 11 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, marginBottom: 11 }}>
              <span style={{ font: '700 9px Manrope,sans-serif', letterSpacing: '.26em', color: 'var(--ink3)' }}>VOICES IN THE ROOM</span>
              <span style={{ font: '600 10.5px Manrope,sans-serif', color: 'var(--ink3)' }}>{view.attendeeCount}</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 12 }}>
              {view.voicePicks.map((v) => (
                <button
                  key={v.name}
                  onClick={v.toggle}
                  title={v.role}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, height: 32, padding: '0 12px 0 4px', borderRadius: 20, border: `1px solid ${v.border}`, background: v.bg, font: '600 11.5px Manrope,sans-serif', color: v.fg }}
                >
                  <span style={{ width: 24, height: 24, borderRadius: '50%', background: v.color, color: '#fff', display: 'grid', placeItems: 'center', font: '700 8.5px Manrope,sans-serif' }}>{v.ini}</span>
                  {v.name}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 12 }}>
              {view.guests.map((g, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, height: 32, padding: '0 10px 0 4px', borderRadius: 20, border: '1px dashed #FF6A00', background: 'rgba(255,106,0,.06)', font: '600 11.5px Manrope,sans-serif', color: '#FF6A00' }}>
                  <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--panel3)', color: 'var(--ink2)', display: 'grid', placeItems: 'center', font: '700 10px Manrope,sans-serif' }}>?</span>
                  {g.label}
                  <button onClick={g.remove} style={{ border: 0, background: 'transparent', color: '#FF6A00', fontSize: 11, padding: '0 2px' }}>
                    ✕
                  </button>
                </span>
              ))}
            </div>
            <button onClick={view.addGuest} style={{ height: 30, padding: '0 12px', borderRadius: 8, border: '1px dashed var(--line)', background: 'transparent', color: 'var(--ink2)', font: '700 11px Manrope,sans-serif' }}>
              + Expected guest
            </button>
            <div style={{ font: '500 11px/1.55 Manrope,sans-serif', color: 'var(--ink3)', marginTop: 10 }}>
              Known voices are matched instantly. Each expected guest reserves a voiceprint slot, so their turns are separated from the start and you only have to name them once.
            </div>
          </div>

          <div style={{ padding: '16px 17px', border: '1px solid var(--line)', borderRadius: 11 }}>
            <div style={{ font: '700 9px Manrope,sans-serif', letterSpacing: '.26em', color: 'var(--ink3)', marginBottom: 11 }}>WHEN &amp; WHERE</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
              <label style={{ display: 'block' }}>
                <span style={{ display: 'block', font: '700 10px Manrope,sans-serif', letterSpacing: '.08em', color: 'var(--ink3)', marginBottom: 5 }}>DATE</span>
                <input
                  type="date"
                  value={view.scheduleDate}
                  onChange={(e) => view.onScheduleDate(e.target.value)}
                  style={{ width: '100%', height: 34, padding: '0 10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--panel2)', font: '500 12.5px Manrope,sans-serif', color: 'var(--ink)' }}
                />
              </label>
              <label style={{ display: 'block' }}>
                <span style={{ display: 'block', font: '700 10px Manrope,sans-serif', letterSpacing: '.08em', color: 'var(--ink3)', marginBottom: 5 }}>START TIME</span>
                <input
                  type="time"
                  value={view.scheduleTime}
                  onChange={(e) => view.onScheduleTime(e.target.value)}
                  style={{ width: '100%', height: 34, padding: '0 10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--panel2)', font: '500 12.5px Manrope,sans-serif', color: 'var(--ink)' }}
                />
              </label>
            </div>
            <span style={{ display: 'block', font: '700 10px Manrope,sans-serif', letterSpacing: '.08em', color: 'var(--ink3)', marginBottom: 5 }}>DURATION</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {view.scheduleDurations.map((d) => (
                <button key={d.label} onClick={d.pick} style={{ height: 28, padding: '0 12px', borderRadius: 20, border: `1px solid ${d.border}`, background: d.bg, color: d.fg, font: '700 11px Manrope,sans-serif' }}>
                  {d.label}
                </button>
              ))}
            </div>
            <label style={{ display: 'block', marginBottom: 10 }}>
              <span style={{ display: 'block', font: '700 10px Manrope,sans-serif', letterSpacing: '.08em', color: 'var(--ink3)', marginBottom: 5 }}>PLACE / LINK</span>
              <input
                value={view.schedulePlace}
                onChange={(e) => view.onSchedulePlace(e.target.value)}
                placeholder="Video link or address"
                style={{ width: '100%', height: 34, padding: '0 12px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--panel2)', font: '500 12.5px Manrope,sans-serif', color: 'var(--ink)' }}
              />
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {view.scheduleTypes.map((t) => (
                <button key={t.label} onClick={t.pick} style={{ height: 28, padding: '0 12px', borderRadius: 20, border: `1px solid ${t.border}`, background: t.bg, color: t.fg, font: '700 11px Manrope,sans-serif' }}>
                  {t.label}
                </button>
              ))}
            </div>
            <button
              onClick={view.scheduleMeeting}
              disabled={!view.scheduleReady}
              style={{ width: '100%', height: 36, borderRadius: 9, border: 0, background: view.scheduleBtnBg, color: view.scheduleBtnFg, font: '700 12px Manrope,sans-serif' }}
            >
              {view.scheduleBtnLabel}
            </button>
          </div>

          <div style={{ padding: '17px 18px', borderRadius: 11, background: 'var(--tint)', border: '1px solid var(--line2)' }}>
            <div style={{ font: '700 9px Manrope,sans-serif', letterSpacing: '.26em', color: 'var(--ink3)', marginBottom: 12 }}>RECORDING BRIEF</div>
            <div style={{ font: '600 15px/1.5 Poppins,sans-serif', color: 'var(--ink)', marginBottom: 12 }}>{view.briefTitle}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 16 }}>
              {view.brief.map((b, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '118px minmax(0,1fr)', gap: 12 }}>
                  <span style={{ font: '600 11px JetBrains Mono,monospace', color: 'var(--ink3)' }}>{b.k}</span>
                  <span style={{ font: '600 12px/1.5 Manrope,sans-serif', color: 'var(--ink)' }}>{b.v}</span>
                </div>
              ))}
            </div>
            <button onClick={view.armMeeting} style={{ width: '100%', height: 38, borderRadius: 9, border: 0, background: view.armBg, color: view.armFg, font: '700 12.5px Manrope,sans-serif', marginBottom: 8 }}>
              {view.armLabel}
            </button>
            <div style={{ font: '500 10.5px/1.55 Manrope,sans-serif', color: 'var(--ink3)', display: view.discloseDisplay as any }}>
              Disclosure prompt is on: read the one-line script at the top of the call before you begin.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
