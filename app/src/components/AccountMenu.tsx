import type { ViewModel } from '../useApp';

export function AccountMenu({ view }: { view: ViewModel }) {
  if (!view.accountMenu) return null;
  return (
    <>
      <div onClick={view.toggleAccountMenu} style={{ position: 'absolute', inset: 0, zIndex: 15 }} />
      <div
        style={{
          position: 'absolute',
          left: 12,
          top: 64,
          bottom: 64,
          width: 286,
          maxHeight: 'calc(100% - 128px)',
          zIndex: 16,
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--panel)',
          border: '1px solid var(--line)',
          borderRadius: 12,
          boxShadow: '0 22px 60px rgba(0,0,0,.32)',
          overflow: 'hidden',
          animation: 'rise .16s ease both'
        }}
      >
        <div style={{ flex: 'none', padding: '14px 15px', borderBottom: '1px solid var(--line)', background: 'var(--panel2)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 32, height: 32, borderRadius: '50%', background: view.meAvatarBg, color: '#fff', display: 'grid', placeItems: 'center', font: '700 11px Manrope,sans-serif', flex: 'none' }}>{view.meIni}</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ font: '700 13px Manrope,sans-serif', color: 'var(--ink)' }}>{view.meName}</div>
            <div style={{ font: '600 10.5px Manrope,sans-serif', color: view.meRoleColor }}>{view.meRole}</div>
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          <div style={{ padding: '8px 8px 4px' }}>
            <div style={{ font: '700 9px Manrope,sans-serif', letterSpacing: '.24em', color: 'var(--ink3)', padding: '6px 8px 8px' }}>SETTINGS</div>
            {view.accountLinks.map((a) => (
              <button
                key={a.key}
                onClick={a.go}
                className="tint-hover"
                style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 9px', border: 0, borderRadius: 8, background: 'transparent', color: 'var(--ink)', font: '600 12.5px Manrope,sans-serif', textAlign: 'left' }}
              >
                <span style={{ width: 16, textAlign: 'center', fontSize: 12, color: 'var(--ink3)' }}>{a.icon}</span>
                <span style={{ flex: 1 }}>{a.label}</span>
                <span style={{ font: '600 10px Manrope,sans-serif', color: 'var(--ink3)' }}>{a.meta}</span>
              </button>
            ))}
          </div>

          <div style={{ padding: '4px 8px 8px', borderTop: '1px solid var(--line2)', marginTop: 4 }}>
            <div style={{ font: '700 9px Manrope,sans-serif', letterSpacing: '.24em', color: 'var(--ink3)', padding: '8px 8px 8px' }}>APPEARANCE</div>
            <div style={{ display: 'flex', gap: 6, padding: '0 8px 6px' }}>
              {view.themeOpts.map((t) => (
                <button key={t.label} onClick={t.pick} style={{ flex: 1, height: 29, borderRadius: 8, border: `1px solid ${t.border}`, background: t.bg, color: t.fg, font: '700 11px Manrope,sans-serif' }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ padding: '4px 8px 10px', borderTop: '1px solid var(--line2)' }}>
            <div style={{ font: '700 9px Manrope,sans-serif', letterSpacing: '.24em', color: 'var(--ink3)', padding: '8px 8px 6px' }}>PREVIEW AS</div>
            {view.accountList.map((a) => (
              <button
                key={a.name}
                onClick={a.pick}
                className="tint-hover"
                style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '7px 9px', border: 0, borderRadius: 8, background: a.bg, font: '600 12px Manrope,sans-serif', color: 'var(--ink)', textAlign: 'left' }}
              >
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: a.color, color: '#fff', display: 'grid', placeItems: 'center', font: '700 8px Manrope,sans-serif', flex: 'none' }}>{a.ini}</span>
                <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</span>
                <span style={{ font: '600 9.5px Manrope,sans-serif', color: 'var(--ink3)' }}>{a.role}</span>
              </button>
            ))}
            <div style={{ font: '500 10.5px/1.5 Manrope,sans-serif', color: 'var(--ink3)', padding: '8px 9px 0' }}>Audit log is on — every read and export is recorded against the account above.</div>
          </div>

          <div style={{ padding: '4px 8px 10px', borderTop: '1px solid var(--line2)' }}>
            <button
              onClick={view.logout}
              className="tint-hover"
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 9px', border: 0, borderRadius: 8, background: 'transparent', color: '#FF6A00', font: '600 12.5px Manrope,sans-serif', textAlign: 'left' }}
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
