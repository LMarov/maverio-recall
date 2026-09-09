import { spawn } from 'child_process';
import ffmpegPath from 'ffmpeg-static';

/**
 * Decodes an arbitrary compressed audio buffer (webm/opus from the browser's
 * MediaRecorder, in this app's case) to 16kHz mono 16-bit PCM — the format
 * Picovoice Eagle requires for voiceprint enrollment/identification.
 */
export function decodeToPcm16k(buffer: Buffer): Promise<Int16Array> {
  return new Promise((resolve, reject) => {
    const ff = spawn(ffmpegPath as unknown as string, ['-i', 'pipe:0', '-f', 's16le', '-ar', '16000', '-ac', '1', 'pipe:1']);
    const chunks: Buffer[] = [];
    let stderr = '';
    ff.stdout.on('data', (d) => chunks.push(d));
    ff.stderr.on('data', (d) => (stderr += d));
    ff.on('error', reject);
    ff.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`ffmpeg exited ${code}: ${stderr.slice(-400)}`));
        return;
      }
      const out = Buffer.concat(chunks);
      const evenLen = out.length - (out.length % 2);
      resolve(new Int16Array(out.buffer, out.byteOffset, evenLen / 2));
    });
    ff.stdin.write(buffer);
    ff.stdin.end();
  });
}
