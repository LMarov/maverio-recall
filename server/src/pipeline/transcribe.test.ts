import { describe, expect, it } from 'vitest';
import { fmtTime } from './transcribe';

describe('fmtTime', () => {
  it('formats whole minutes and seconds as mm:ss', () => {
    expect(fmtTime(0)).toBe('00:00');
    expect(fmtTime(5)).toBe('00:05');
    expect(fmtTime(65)).toBe('01:05');
    expect(fmtTime(3661)).toBe('61:01');
  });

  it('rounds fractional seconds', () => {
    expect(fmtTime(5.6)).toBe('00:06');
  });

  it('clamps negative/undefined input to zero', () => {
    expect(fmtTime(-5)).toBe('00:00');
    expect(fmtTime(undefined as unknown as number)).toBe('00:00');
  });
});
