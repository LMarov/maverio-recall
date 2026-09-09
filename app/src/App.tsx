import { useApp } from './useApp';
import { Auth } from './components/screens/Auth';
import { Titlebar } from './components/Titlebar';
import { Sidebar } from './components/Sidebar';
import { Timeline } from './components/screens/Timeline';
import { Search } from './components/screens/Search';
import { MeetingDetail } from './components/screens/MeetingDetail';
import { Voices } from './components/screens/Voices';
import { KnowledgeBase } from './components/screens/KnowledgeBase';
import { Clients } from './components/screens/Clients';
import { Prep } from './components/screens/Prep';
import { Team } from './components/screens/Team';
import { SettingsScreen } from './components/screens/Settings';
import { AskRail } from './components/AskRail';
import { AccountMenu } from './components/AccountMenu';
import { RecordingPill } from './components/RecordingPill';
import { NamerModal } from './components/NamerModal';

export default function App() {
  const { view } = useApp();

  return (
    <div
      data-theme={view.theme}
      style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '26px 22px', background: 'var(--canvas)' }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: view.authed ? 1300 : 420,
          height: view.authed ? 'min(834px,90vh)' : 'auto',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--panel)',
          border: '1px solid var(--line)',
          borderRadius: 15,
          boxShadow: 'var(--shadow)',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {!view.authed && <Auth view={view} />}
        {view.authed && (
          <>
        {(view.captureError || view.analysisError) && (
          <div
            style={{
              position: 'absolute',
              top: 62,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 20,
              maxWidth: 'min(560px,92%)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: '11px 13px',
              borderRadius: 10,
              background: 'rgba(255,106,0,.14)',
              border: '1px solid rgba(255,106,0,.4)',
              boxShadow: '0 12px 30px rgba(0,0,0,.25)'
            }}
          >
            <span style={{ font: '500 12px/1.5 Manrope,sans-serif', color: 'var(--ink)', flex: 1 }}>{view.captureError || view.analysisError}</span>
            <button
              onClick={view.captureError ? view.dismissCaptureError : view.dismissAnalysisError}
              style={{ border: 0, background: 'transparent', color: 'var(--ink2)', font: '700 13px Manrope,sans-serif', flex: 'none', padding: 0 }}
            >
              ✕
            </button>
          </div>
        )}

        <Titlebar view={view} />

        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          <Sidebar view={view} />

          <div style={{ flex: 1, display: 'flex', minWidth: 0 }}>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'auto', background: 'var(--panel)' }}>
              {view.isLibrary && <Timeline view={view} />}
              {view.isSearch && <Search view={view} />}
              {view.isMeeting && <MeetingDetail view={view} />}
              {view.isVoices && <Voices view={view} />}
              {view.isExport && <KnowledgeBase view={view} />}
              {view.isClients && <Clients view={view} />}
              {view.isPrep && <Prep view={view} />}
              {view.isTeam && <Team view={view} />}
              {view.isSettings && <SettingsScreen view={view} />}
            </div>

            <AskRail view={view} />
          </div>
        </div>

        <AccountMenu view={view} />
        <RecordingPill view={view} />
        <NamerModal view={view} />
          </>
        )}
      </div>
    </div>
  );
}
