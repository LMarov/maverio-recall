import { describe, expect, it } from 'vitest';
import { env } from '../env';
import { enrollSpeaker, identifySpeakers, isVoiceprintEnabled, sliceSpeakerPcm } from './voiceprint';
import type { RawUtterance } from './transcribe';

describe('sliceSpeakerPcm', () => {
  const SAMPLE_RATE = 16000;

  it('concatenates only the given speaker\'s utterance segments, in order', () => {
    const pcm = new Int16Array(SAMPLE_RATE * 10); // 10s of audio
    for (let i = 0; i < pcm.length; i++) pcm[i] = i % 1000;

    const utterances: RawUtterance[] = [
      { speaker: '0', start: 0, end: 2 },
      { speaker: '1', start: 2, end: 4 },
      { speaker: '0', start: 4, end: 6 }
    ];

    const speaker0 = sliceSpeakerPcm(pcm, utterances, '0');
    const speaker1 = sliceSpeakerPcm(pcm, utterances, '1');

    expect(speaker0.length).toBe(4 * SAMPLE_RATE); // the two 2s segments combined
    expect(speaker1.length).toBe(2 * SAMPLE_RATE);
    // First segment's first sample should be pcm[0]; the second segment
    // (starting at t=4s) should pick straight back up from that offset.
    expect(speaker0[0]).toBe(pcm[0]);
    expect(speaker0[2 * SAMPLE_RATE]).toBe(pcm[4 * SAMPLE_RATE]);
  });

  it('returns an empty array for a speaker with no utterances', () => {
    const pcm = new Int16Array(SAMPLE_RATE);
    const result = sliceSpeakerPcm(pcm, [{ speaker: '0', start: 0, end: 1 }], '1');
    expect(result.length).toBe(0);
  });

  it('clamps segments that run past the end of the provided PCM buffer', () => {
    const pcm = new Int16Array(SAMPLE_RATE); // only 1s of audio
    const result = sliceSpeakerPcm(pcm, [{ speaker: '0', start: 0, end: 5 }], '0');
    expect(result.length).toBe(SAMPLE_RATE);
  });
});

describe('voiceprint enable/disable gating', () => {
  it('isVoiceprintEnabled reflects whether PICOVOICE_ACCESS_KEY is set', () => {
    const original = env.picovoiceAccessKey;
    try {
      env.picovoiceAccessKey = '';
      expect(isVoiceprintEnabled()).toBe(false);
      env.picovoiceAccessKey = 'some-key';
      expect(isVoiceprintEnabled()).toBe(true);
    } finally {
      env.picovoiceAccessKey = original;
    }
  });

  it('enrollSpeaker is a no-op returning false when disabled', async () => {
    const original = env.picovoiceAccessKey;
    env.picovoiceAccessKey = '';
    try {
      const result = await enrollSpeaker('Someone', new Int16Array(1000));
      expect(result).toBe(false);
    } finally {
      env.picovoiceAccessKey = original;
    }
  });

  it('identifySpeakers is a no-op returning {} when disabled', async () => {
    const original = env.picovoiceAccessKey;
    env.picovoiceAccessKey = '';
    try {
      const result = await identifySpeakers({ '0': new Int16Array(1000) });
      expect(result).toEqual({});
    } finally {
      env.picovoiceAccessKey = original;
    }
  });
});
