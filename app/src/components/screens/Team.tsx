import type { ViewModel } from '../../useApp';

export function Team({ view }: { view: ViewModel }) {
  return (
    <div style={{ padding: '26px 28px 40px' }}>
      <h1 style={{ font: '600 27px/1.15 Poppins,sans-serif', color: 'var(--ink)', margin: '0 0 5px', letterSpacing: '-.01em' }}>Team &amp; seats</h1>
      <div style={{ font: '500 12.5px Manrope,sans-serif', color: 'var(--ink2)', marginBottom: 16 }}>{view.seatLine}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 10, background: view.ownerBannerBg, border: `1px solid ${view.ownerBannerBorder}`, marginBottom: 22 }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: view.ownerBannerDot, flex: 'none', display: 'block' }} />
        <span style={{ font: '600 11.5px/1.5 Manrope,sans-serif', color: 'var(--ink2)' }}>{view.ownerBanner}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 11, marginBottom: 26 }}>
        <div style={{ padding: '16px 17px', border: '1px solid var(--line)', borderRadius: 11, background: 'var(--panel2)' }}>
          <div style={{ font: '700 9px Manrope,sans-serif', letterSpacing: '.26em', color: 'var(--ink3)', marginBottom: 10 }}>INSTALL LINK</div>
          <div style={{ font: '500 11.5px JetBrains Mono,monospace', color: 'var(--ink)', background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 8, padding: '9px 11px', marginBottom: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {view.inviteLink}
          </div>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            <button onClick={view.copyLink} style={{ height: 30, padding: '0 13px', borderRadius: 8, border: 0, background: 'linear-gradient(90deg,#4192B9,#5AC3A7)', color: '#fff', font: '700 11px Manrope,sans-serif' }}>
              {view.copyLinkLabel}
            </button>
            <button style={{ height: 30, padding: '0 13px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--panel)', color: 'var(--ink)', font: '700 11px Manrope,sans-serif' }}>Download for macOS</button>
          </div>
          <div style={{ font: '500 10.5px Manrope,sans-serif', color: 'var(--ink3)', marginTop: 9 }}>Recall 1.4 · Apple silicon &amp; Intel · macOS 14+ · 38 MB. Only @maverio.com addresses can redeem the link.</div>
        </div>

        <div style={{ padding: '16px 17px', border: '1px solid var(--line)', borderRadius: 11 }}>
          <div style={{ font: '700 9px Manrope,sans-serif', letterSpacing: '.26em', color: 'var(--ink3)', marginBottom: 10 }}>INVITE A COLLEAGUE</div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              view.onInvite();
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
          >
            <input
              value={view.inviteEmail}
              onChange={(e) => view.onInviteEmail(e.target.value)}
              placeholder="name@maverio.com"
              style={{ height: 34, padding: '0 12px', borderRadius: 8, border: `1px solid ${view.inviteBorder}`, background: 'var(--panel2)', font: '500 12.5px Manrope,sans-serif', color: 'var(--ink)' }}
            />
            <div style={{ display: 'flex', gap: 6 }}>
              {view.roles.map((r) => (
                <button key={r.label} type="button" onClick={r.pick} style={{ flex: 1, height: 30, borderRadius: 8, border: `1px solid ${r.border}`, background: r.bg, color: r.fg, font: '700 11px Manrope,sans-serif' }}>
                  {r.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {view.scopes.map((c) => (
                <button key={c.label} type="button" onClick={c.pick} style={{ flex: 1, height: 30, borderRadius: 8, border: `1px solid ${c.border}`, background: c.bg, color: c.fg, font: '700 11px Manrope,sans-serif' }}>
                  {c.label}
                </button>
              ))}
            </div>
            <button type="submit" style={{ height: 34, borderRadius: 8, border: 0, background: view.inviteBtnBg, color: view.inviteBtnFg, font: '700 11.5px Manrope,sans-serif' }}>
              {view.inviteBtnLabel}
            </button>
          </form>
          <div style={{ font: '500 10.5px/1.5 Manrope,sans-serif', color: 'var(--ink3)', marginTop: 9 }}>{view.inviteHelp}</div>
          {view.lastInviteToken && (
            <div style={{ marginTop: 10, padding: '9px 11px', borderRadius: 8, background: 'var(--panel2)', border: '1px solid var(--line)' }}>
              <div style={{ font: '700 9px Manrope,sans-serif', letterSpacing: '.14em', color: 'var(--ink3)', marginBottom: 5 }}>SHARE THIS INVITE CODE WITH THEM</div>
              <div style={{ font: '500 11px JetBrains Mono,monospace', color: 'var(--ink)', wordBreak: 'break-all' }}>{view.lastInviteToken}</div>
            </div>
          )}
        </div>
      </div>

      <div style={{ font: '700 9px Manrope,sans-serif', letterSpacing: '.26em', color: 'var(--ink3)', marginBottom: 11 }}>MEMBERS</div>
      <div style={{ border: '1px solid var(--line)', borderRadius: 11, overflow: 'hidden' }}>
        {view.team.map((t) => (
          <div key={t.email} style={{ display: 'grid', gridTemplateColumns: '32px minmax(0,1fr) auto auto auto', gap: 12, alignItems: 'center', padding: '12px 15px', borderBottom: '1px solid var(--line2)', background: t.rowBg }}>
            <span style={{ width: 32, height: 32, borderRadius: '50%', background: t.color, color: '#fff', display: 'grid', placeItems: 'center', font: '700 10.5px Manrope,sans-serif' }}>{t.ini}</span>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ font: '700 13px Manrope,sans-serif', color: 'var(--ink)' }}>{t.name}</span>
                <span style={{ font: '700 9px Manrope,sans-serif', letterSpacing: '.05em', padding: '2.5px 7px', borderRadius: 5, background: t.roleTint, color: t.roleColor }}>{t.role}</span>
              </div>
              <div style={{ font: '500 11px Manrope,sans-serif', color: 'var(--ink3)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {t.email} · {t.seen}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 0, border: '1px solid var(--line)', borderRadius: 7, overflow: 'hidden', opacity: t.scopeOpacity as any }}>
              {t.scopeOpts.map((o) => (
                <button key={o.label} onClick={o.pick} title={o.title} style={{ height: 26, padding: '0 10px', border: 0, borderRight: '1px solid var(--line)', background: o.bg, color: o.fg, font: '700 10px Manrope,sans-serif', whiteSpace: 'nowrap' }}>
                  {o.label}
                </button>
              ))}
            </div>
            <span style={{ font: '600 10.5px Manrope,sans-serif', color: t.vpColor, background: t.vpTint, padding: '4px 9px', borderRadius: 20, whiteSpace: 'nowrap' }}>{t.voiceprint}</span>
            <button onClick={t.act} className="act-hover" style={{ height: 28, padding: '0 11px', borderRadius: 7, border: '1px solid var(--line)', background: 'transparent', color: 'var(--ink2)', font: '700 10.5px Manrope,sans-serif', whiteSpace: 'nowrap' }}>
              {t.actLabel}
            </button>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 18, padding: '15px 17px', border: '1px dashed var(--line)', borderRadius: 11, font: '500 12px/1.65 Manrope,sans-serif', color: 'var(--ink2)' }}>
        <strong style={{ color: 'var(--ink)' }}>Lana Marov is the owner</strong> — the only account that can promote or demote admins, change anyone's library access, or transfer ownership. Admins
        can invite and manage seats but cannot widen their own access. <strong style={{ color: 'var(--ink)' }}>Full library</strong> reads every meeting ever recorded;{' '}
        <strong style={{ color: 'var(--ink)' }}>Attended only</strong> limits a member to meetings their voiceprint appears in. Every read is written to the audit log with account and timestamp.
      </div>
    </div>
  );
}
