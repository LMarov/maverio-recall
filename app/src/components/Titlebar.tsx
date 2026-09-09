import type { ViewModel } from '../useApp';

declare global {
  interface Window {
    recallWindow?: {
      close: () => void;
      minimize: () => void;
      toggleFullscreen: () => void;
      isElectron: boolean;
    };
  }
}

export function Titlebar({ view }: { view: ViewModel }) {
  const rw = typeof window !== 'undefined' ? window.recallWindow : undefined;

  return (
    <div
      style={{
        flex: 'none',
        height: 52,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '0 16px',
        background: 'var(--bar)',
        borderBottom: '1px solid var(--line)',
        WebkitAppRegion: 'drag'
      } as React.CSSProperties}
    >
      <div style={{ display: 'flex', gap: 8, flex: 'none', WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <span onClick={() => rw?.close()} title="Close" style={{ width: 12, height: 12, borderRadius: '50%', background: '#FF5F57', display: 'block', cursor: rw ? 'pointer' : 'default' }} />
        <span onClick={() => rw?.minimize()} title="Minimize" style={{ width: 12, height: 12, borderRadius: '50%', background: '#FEBC2E', display: 'block', cursor: rw ? 'pointer' : 'default' }} />
        <span onClick={() => rw?.toggleFullscreen()} title="Fullscreen" style={{ width: 12, height: 12, borderRadius: '50%', background: '#28C840', display: 'block', cursor: rw ? 'pointer' : 'default' }} />
      </div>

      {view.backDisplay === 'flex' && (
        <button
          onClick={view.goBack}
          title={view.backLabel}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            height: 28,
            padding: '0 10px 0 8px',
            borderRadius: 8,
            border: '1px solid var(--line)',
            background: 'var(--panel3)',
            color: 'var(--ink)',
            font: '700 11.5px Manrope,sans-serif',
            flex: 'none',
            WebkitAppRegion: 'no-drag'
          } as React.CSSProperties}
        >
          <span style={{ fontSize: 13, lineHeight: 1 }}>←</span>
          {view.backLabel}
        </button>
      )}

      {view.chromeTitleDisplay === 'block' && (
        <div style={{ font: '600 12.5px Manrope,sans-serif', color: 'var(--ink2)', letterSpacing: '.01em', flex: 'none' }}>Recall</div>
      )}

      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            width: '100%',
            maxWidth: 420,
            height: 30,
            padding: '0 11px',
            borderRadius: 8,
            background: 'var(--panel3)',
            border: '1px solid var(--line2)',
            WebkitAppRegion: 'no-drag'
          } as React.CSSProperties}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} style={{ color: 'var(--ink3)', flex: 'none' }}>
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-4-4" />
          </svg>
          <input
            value={view.query}
            onChange={(e) => view.onQuery(e.target.value)}
            placeholder="Search every meeting, decision, or speaker"
            style={{ flex: 1, minWidth: 0, border: 0, background: 'transparent', font: '500 12.5px Manrope,sans-serif', color: 'var(--ink)' }}
          />
          <span style={{ font: '500 10px JetBrains Mono,monospace', color: 'var(--ink3)', flex: 'none' }}>⌘K</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 9, flex: 'none', WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <button
          onClick={view.toggleRecord}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            height: 30,
            padding: '0 13px',
            borderRadius: 8,
            border: '1px solid var(--line)',
            background: view.recBg,
            color: view.recFg,
            font: '700 11.5px Manrope,sans-serif',
            letterSpacing: '.02em'
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: view.recDot, animation: view.recAnim, display: 'block' }} />
          {view.recLabel}
        </button>
        {view.narrow && (
          <button
            onClick={view.toggleRail}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              height: 30,
              padding: '0 12px',
              borderRadius: 8,
              border: '1px solid var(--line)',
              background: view.railBtnBg,
              color: view.railBtnFg,
              font: '700 11.5px Manrope,sans-serif'
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'linear-gradient(90deg,#4192B9,#5AC3A7)', display: 'block' }} />
            Ask
          </button>
        )}
        <button
          onClick={view.toggleTheme}
          title="Appearance"
          style={{ width: 30, height: 30, display: 'grid', placeItems: 'center', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--panel3)', color: 'var(--ink2)', fontSize: 12 }}
        >
          {view.themeIcon}
        </button>
      </div>
    </div>
  );
}
