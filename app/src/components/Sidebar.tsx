import type { ViewModel } from '../useApp';

export function Sidebar({ view }: { view: ViewModel }) {
  return (
    <div
      style={{
        flex: 'none',
        width: view.sideW,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--panel2)',
        borderRight: '1px solid var(--line)',
        padding: '16px 12px 12px',
        overflow: 'auto'
      }}
    >
      <div style={{ padding: '0 6px 16px', display: view.showLabels as any }}>
        <div
          style={{
            font: '500 21px/1 Poppins,sans-serif',
            letterSpacing: '.02em',
            background: 'linear-gradient(90deg,#4192B9,#5AC3A7)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent'
          } as React.CSSProperties}
        >
          maverio
        </div>
        <div style={{ font: '700 9px Manrope,sans-serif', letterSpacing: '.34em', color: 'var(--ink3)', marginTop: 5 }}>RECALL</div>
      </div>

      {view.collapsed && (
        <div style={{ display: 'grid', placeItems: 'center', padding: '0 0 16px' }}>
          <span style={{ width: 26, height: 26, borderRadius: 8, background: 'linear-gradient(135deg,#4192B9,#5AC3A7)', display: 'block' }} />
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {view.nav.map((n) => (
          <button
            key={n.key}
            onClick={n.go}
            title={n.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              width: '100%',
              padding: '8px 9px',
              borderRadius: 8,
              border: 0,
              textAlign: 'left',
              justifyContent: view.navJustify as any,
              background: n.bg,
              color: n.fg,
              font: '600 12.5px Manrope,sans-serif'
            }}
          >
            <span style={{ width: 16, textAlign: 'center', fontSize: 12, opacity: 0.9, flex: 'none' }}>{n.icon}</span>
            <span style={{ flex: 1, display: view.showLabels as any }}>{n.label}</span>
            {n.badge && (
              <span style={{ font: '700 9.5px Manrope,sans-serif', padding: '2px 6px', borderRadius: 20, background: '#FF6A00', color: '#fff', flex: 'none' }}>{n.badge}</span>
            )}
          </button>
        ))}
      </div>

      <div style={{ alignItems: 'baseline', justifyContent: 'space-between', gap: 8, padding: '22px 9px 9px', display: view.clientsDisplay as any }}>
        <span style={{ font: '700 9px Manrope,sans-serif', letterSpacing: '.28em', color: 'var(--ink3)' }}>CLIENTS · ACTIVE</span>
        <span style={{ font: '600 9.5px Manrope,sans-serif', color: 'var(--ink3)' }}>{view.activeCount}</span>
      </div>
      <div style={{ display: view.clientsDisplay as any, flexDirection: 'column', gap: 1, flex: 'none' }}>
        {view.clientsActive.map((c) => (
          <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 2, borderRadius: 7, background: c.bg }}>
            <button
              onClick={c.pick}
              style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0, padding: '7px 4px 7px 9px', borderRadius: 7, border: 0, textAlign: 'left', background: 'transparent', font: '600 12px Manrope,sans-serif', color: c.fg }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, flex: 'none', display: 'block' }} />
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
            </button>
            <button onClick={c.toggleArchive} title={`Archive ${c.name}`} style={{ width: 22, height: 26, border: 0, background: 'transparent', color: 'var(--ink3)', font: '600 12px Manrope,sans-serif', flex: 'none', borderRadius: 6 }}>
              –
            </button>
          </div>
        ))}
        {view.noActiveClients && <div style={{ padding: '8px 9px', font: '500 11px Manrope,sans-serif', color: 'var(--ink3)' }}>Everything is archived.</div>}
      </div>

      <button
        onClick={view.toggleArchive}
        style={{ display: view.clientsDisplay as any, alignItems: 'baseline', justifyContent: 'space-between', gap: 8, width: '100%', padding: '18px 9px 9px', border: 0, background: 'transparent', textAlign: 'left' }}
      >
        <span style={{ font: '700 9px Manrope,sans-serif', letterSpacing: '.28em', color: 'var(--ink3)' }}>ARCHIVED</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ font: '600 9.5px Manrope,sans-serif', color: 'var(--ink3)' }}>{view.archivedCount}</span>
          <span style={{ fontSize: 9, color: 'var(--ink3)', display: 'inline-block', transform: `rotate(${view.archiveChevron})` }}>▾</span>
        </span>
      </button>
      <div style={{ display: view.archiveListDisplay as any, flexDirection: 'column', gap: 1, flex: 'none' }}>
        {view.clientsArchived.map((c) => (
          <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 2, borderRadius: 7, background: c.bg, opacity: 0.72 }}>
            <button
              onClick={c.pick}
              style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0, padding: '7px 4px 7px 9px', borderRadius: 7, border: 0, textAlign: 'left', background: 'transparent', font: '500 12px Manrope,sans-serif', color: c.fg }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--ink3)', flex: 'none', display: 'block' }} />
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
            </button>
            <button onClick={c.toggleArchive} title={`Restore ${c.name} to active`} style={{ width: 22, height: 26, border: 0, background: 'transparent', color: 'var(--ink3)', font: '600 12px Manrope,sans-serif', flex: 'none', borderRadius: 6 }}>
              +
            </button>
          </div>
        ))}
        {view.noArchivedClients && (
          <div style={{ padding: '8px 9px', font: '500 11px Manrope,sans-serif', color: 'var(--ink3)', textWrap: 'pretty' } as React.CSSProperties}>
            Nothing archived. Use – to move a finished client out of the active list.
          </div>
        )}
      </div>

      <button
        onClick={view.toggleAccountMenu}
        title="Account, settings and appearance"
        style={{ border: 0, borderTop: '1px solid var(--line)', marginTop: 'auto', padding: '14px 7px 6px', display: 'flex', alignItems: 'center', gap: 9, flex: 'none', background: 'transparent', width: '100%', textAlign: 'left' }}
      >
        <div style={{ width: 26, height: 26, borderRadius: '50%', background: view.meAvatarBg, color: '#fff', display: 'grid', placeItems: 'center', font: '700 10px Manrope,sans-serif', flex: 'none' }}>{view.meIni}</div>
        <div style={{ minWidth: 0, flex: 1, display: view.showLabels as any }}>
          <div style={{ font: '700 11.5px Manrope,sans-serif', color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{view.meName}</div>
          <div style={{ font: '600 9.5px Manrope,sans-serif', color: view.meRoleColor }}>{view.meRole}</div>
        </div>
      </button>
    </div>
  );
}
