// Real microphone + system-audio capture for a live recording.
//
// Mic capture is standard getUserMedia and works everywhere. System-audio
// loopback capture (so the other side of the call is recorded too, not just
// your mic) is the fragile part: it relies on Electron's desktopCapturer +
// a constrained getUserMedia call, macOS's Screen & System Audio Recording
// permission, and behaves differently across macOS versions. If it fails we
// fall back to mic-only rather than blocking the recording outright — the
// UI surfaces which mode actually ran.

export interface ActiveRecording {
  stop: () => Promise<{ blob: Blob; arrayBuffer: ArrayBuffer }>;
  systemAudioCaptured: boolean;
}

async function getSystemAudioStream(): Promise<MediaStream | null> {
  const api = window.recallAPI;
  if (!api) return null; // plain browser dev mode — no desktopCapturer available
  try {
    const sources = await api.getScreenSource();
    const primary = sources[0];
    if (!primary) return null;
    const constraints: any = {
      audio: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: primary.id
        }
      },
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: primary.id,
          maxWidth: 1,
          maxHeight: 1
        }
      }
    };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    // We only want the audio track — drop the throwaway 1x1 video track.
    stream.getVideoTracks().forEach((t) => {
      stream.removeTrack(t);
      t.stop();
    });
    return stream.getAudioTracks().length ? stream : null;
  } catch {
    return null; // permission denied, unsupported macOS version, no audio on the source, etc.
  }
}

export async function startRecording(): Promise<ActiveRecording> {
  const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const systemStream = await getSystemAudioStream();

  const audioCtx = new AudioContext();
  const dest = audioCtx.createMediaStreamDestination();
  const micSource = audioCtx.createMediaStreamSource(micStream);
  micSource.connect(dest);
  let systemSource: MediaStreamAudioSourceNode | null = null;
  if (systemStream) {
    systemSource = audioCtx.createMediaStreamSource(systemStream);
    systemSource.connect(dest);
  }

  const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
  const recorder = new MediaRecorder(dest.stream, { mimeType });
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size) chunks.push(e.data);
  };
  recorder.start(1000);

  const cleanup = () => {
    micStream.getTracks().forEach((t) => t.stop());
    systemStream?.getTracks().forEach((t) => t.stop());
    micSource.disconnect();
    systemSource?.disconnect();
    audioCtx.close().catch(() => {});
  };

  return {
    systemAudioCaptured: !!systemStream,
    stop: () =>
      new Promise((resolve) => {
        recorder.onstop = async () => {
          cleanup();
          const blob = new Blob(chunks, { type: mimeType });
          const arrayBuffer = await blob.arrayBuffer();
          resolve({ blob, arrayBuffer });
        };
        recorder.stop();
      })
  };
}
