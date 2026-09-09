import type { ViewModel } from '../../useApp';

export function Auth({ view }: { view: ViewModel }) {
  const isLogin = view.authView === 'login';

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <div style={{ width: '100%', maxWidth: 360 }}>
        <div style={{ font: '700 22px Poppins,sans-serif', color: 'var(--ink)', marginBottom: 4 }}>Maverio Recall</div>
        <div style={{ font: '500 12.5px Manrope,sans-serif', color: 'var(--ink2)', marginBottom: 26 }}>
          {isLogin ? 'Sign in with your Maverio account.' : 'Set your name and a password to join.'}
        </div>

        {isLogin ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              view.submitLogin();
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
          >
            <input
              value={view.authEmail}
              onChange={(e) => view.onAuthEmail(e.target.value)}
              placeholder="name@maverio.com"
              type="email"
              autoFocus
              style={{ height: 40, padding: '0 13px', borderRadius: 9, border: '1px solid var(--line)', background: 'var(--panel2)', color: 'var(--ink)', font: '500 13px Manrope,sans-serif' }}
            />
            <input
              value={view.authPassword}
              onChange={(e) => view.onAuthPassword(e.target.value)}
              placeholder="Password"
              type="password"
              style={{ height: 40, padding: '0 13px', borderRadius: 9, border: '1px solid var(--line)', background: 'var(--panel2)', color: 'var(--ink)', font: '500 13px Manrope,sans-serif' }}
            />
            {view.authError && <div style={{ font: '600 11.5px Manrope,sans-serif', color: '#FF6A00' }}>{view.authError}</div>}
            <button
              type="submit"
              disabled={!view.authLoginReady || view.authLoading}
              style={{
                height: 42,
                borderRadius: 9,
                border: 0,
                background: view.authLoginReady ? 'linear-gradient(90deg,#4192B9,#5AC3A7)' : 'var(--panel3)',
                color: view.authLoginReady ? '#fff' : 'var(--ink3)',
                font: '700 13px Manrope,sans-serif',
                marginTop: 6
              }}
            >
              {view.authLoading ? 'Signing in…' : 'Sign in'}
            </button>
            <button
              type="button"
              onClick={view.goAcceptInvite}
              style={{ border: 0, background: 'transparent', color: 'var(--ink2)', font: '600 12px Manrope,sans-serif', marginTop: 8, padding: 0 }}
            >
              Have an invite code? Join the workspace →
            </button>
          </form>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              view.submitAcceptInvite();
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
          >
            <input
              value={view.authInviteToken}
              onChange={(e) => view.onAuthInviteToken(e.target.value)}
              placeholder="Invite code"
              autoFocus
              style={{ height: 40, padding: '0 13px', borderRadius: 9, border: '1px solid var(--line)', background: 'var(--panel2)', color: 'var(--ink)', font: '500 12.5px JetBrains Mono,monospace' }}
            />
            <input
              value={view.authName}
              onChange={(e) => view.onAuthName(e.target.value)}
              placeholder="Your full name"
              style={{ height: 40, padding: '0 13px', borderRadius: 9, border: '1px solid var(--line)', background: 'var(--panel2)', color: 'var(--ink)', font: '500 13px Manrope,sans-serif' }}
            />
            <input
              value={view.authPassword}
              onChange={(e) => view.onAuthPassword(e.target.value)}
              placeholder="Choose a password (min. 8 characters)"
              type="password"
              style={{ height: 40, padding: '0 13px', borderRadius: 9, border: '1px solid var(--line)', background: 'var(--panel2)', color: 'var(--ink)', font: '500 13px Manrope,sans-serif' }}
            />
            {view.authError && <div style={{ font: '600 11.5px Manrope,sans-serif', color: '#FF6A00' }}>{view.authError}</div>}
            <button
              type="submit"
              disabled={!view.authAcceptReady || view.authLoading}
              style={{
                height: 42,
                borderRadius: 9,
                border: 0,
                background: view.authAcceptReady ? 'linear-gradient(90deg,#4192B9,#5AC3A7)' : 'var(--panel3)',
                color: view.authAcceptReady ? '#fff' : 'var(--ink3)',
                font: '700 13px Manrope,sans-serif',
                marginTop: 6
              }}
            >
              {view.authLoading ? 'Joining…' : 'Join workspace'}
            </button>
            <button
              type="button"
              onClick={view.goLogin}
              style={{ border: 0, background: 'transparent', color: 'var(--ink2)', font: '600 12px Manrope,sans-serif', marginTop: 8, padding: 0 }}
            >
              ← Back to sign in
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
