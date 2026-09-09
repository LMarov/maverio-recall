import type { ViewModel } from '../../useApp';

const inputStyle: React.CSSProperties = {
  height: 40,
  padding: '0 13px',
  borderRadius: 9,
  border: '1px solid var(--line)',
  background: 'var(--panel2)',
  color: 'var(--ink)',
  font: '500 13px Manrope,sans-serif'
};

function SubmitButton({ label, loadingLabel, ready, loading }: { label: string; loadingLabel: string; ready: boolean; loading: boolean }) {
  return (
    <button
      type="submit"
      disabled={!ready || loading}
      style={{
        height: 42,
        borderRadius: 9,
        border: 0,
        background: ready ? 'linear-gradient(90deg,#4192B9,#5AC3A7)' : 'var(--panel3)',
        color: ready ? '#fff' : 'var(--ink3)',
        font: '700 13px Manrope,sans-serif',
        marginTop: 6
      }}
    >
      {loading ? loadingLabel : label}
    </button>
  );
}

function LinkButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} style={{ border: 0, background: 'transparent', color: 'var(--ink2)', font: '600 12px Manrope,sans-serif', marginTop: 8, padding: 0 }}>
      {children}
    </button>
  );
}

export function Auth({ view }: { view: ViewModel }) {
  const subtitle = {
    login: 'Sign in with your Maverio account.',
    'accept-invite': 'Set your name and a password to join.',
    'forgot-password': "Enter your email and we'll send a reset code.",
    'reset-password': 'Enter the code from your email and a new password.'
  }[view.authView];

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <div style={{ width: '100%', maxWidth: 360 }}>
        <div style={{ font: '700 22px Poppins,sans-serif', color: 'var(--ink)', marginBottom: 4 }}>Maverio Recall</div>
        <div style={{ font: '500 12.5px Manrope,sans-serif', color: 'var(--ink2)', marginBottom: 26 }}>{subtitle}</div>

        {view.authInfo && <div style={{ font: '600 11.5px Manrope,sans-serif', color: '#27AC53', marginBottom: 12 }}>{view.authInfo}</div>}

        {view.authView === 'login' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              view.submitLogin();
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
          >
            <input value={view.authEmail} onChange={(e) => view.onAuthEmail(e.target.value)} placeholder="name@maverio.com" type="email" autoFocus style={inputStyle} />
            <input value={view.authPassword} onChange={(e) => view.onAuthPassword(e.target.value)} placeholder="Password" type="password" style={inputStyle} />
            {view.authError && <div style={{ font: '600 11.5px Manrope,sans-serif', color: '#FF6A00' }}>{view.authError}</div>}
            <SubmitButton label="Sign in" loadingLabel="Signing in…" ready={view.authLoginReady} loading={view.authLoading} />
            <LinkButton onClick={view.goForgotPassword}>Forgot your password?</LinkButton>
            <LinkButton onClick={view.goAcceptInvite}>Have an invite code? Join the workspace →</LinkButton>
          </form>
        )}

        {view.authView === 'accept-invite' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              view.submitAcceptInvite();
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
          >
            <input value={view.authInviteToken} onChange={(e) => view.onAuthInviteToken(e.target.value)} placeholder="Invite code" autoFocus style={{ ...inputStyle, font: '500 12.5px JetBrains Mono,monospace' }} />
            <input value={view.authName} onChange={(e) => view.onAuthName(e.target.value)} placeholder="Your full name" style={inputStyle} />
            <input value={view.authPassword} onChange={(e) => view.onAuthPassword(e.target.value)} placeholder="Choose a password (min. 8 characters)" type="password" style={inputStyle} />
            {view.authError && <div style={{ font: '600 11.5px Manrope,sans-serif', color: '#FF6A00' }}>{view.authError}</div>}
            <SubmitButton label="Join workspace" loadingLabel="Joining…" ready={view.authAcceptReady} loading={view.authLoading} />
            <LinkButton onClick={view.goLogin}>← Back to sign in</LinkButton>
          </form>
        )}

        {view.authView === 'forgot-password' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              view.submitForgotPassword();
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
          >
            <input value={view.authEmail} onChange={(e) => view.onAuthEmail(e.target.value)} placeholder="name@maverio.com" type="email" autoFocus style={inputStyle} />
            {view.authError && <div style={{ font: '600 11.5px Manrope,sans-serif', color: '#FF6A00' }}>{view.authError}</div>}
            <SubmitButton label="Send reset code" loadingLabel="Sending…" ready={view.authForgotReady} loading={view.authLoading} />
            <LinkButton onClick={view.goResetPassword}>Already have a code?</LinkButton>
            <LinkButton onClick={view.goLogin}>← Back to sign in</LinkButton>
          </form>
        )}

        {view.authView === 'reset-password' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              view.submitResetPassword();
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
          >
            <input value={view.authResetToken} onChange={(e) => view.onAuthResetToken(e.target.value)} placeholder="Reset code" autoFocus style={{ ...inputStyle, font: '500 12.5px JetBrains Mono,monospace' }} />
            <input value={view.authPassword} onChange={(e) => view.onAuthPassword(e.target.value)} placeholder="New password (min. 8 characters)" type="password" style={inputStyle} />
            {view.authError && <div style={{ font: '600 11.5px Manrope,sans-serif', color: '#FF6A00' }}>{view.authError}</div>}
            <SubmitButton label="Set new password" loadingLabel="Saving…" ready={view.authResetReady} loading={view.authLoading} />
            <LinkButton onClick={view.goLogin}>← Back to sign in</LinkButton>
          </form>
        )}
      </div>
    </div>
  );
}
