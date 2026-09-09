import { describe, expect, it, vi } from 'vitest';
import type { NextFunction, Request, Response } from 'express';
import { rateLimit } from './rateLimit';

function mockReqRes(ip = '1.2.3.4') {
  const req = { ip } as unknown as Request;
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response;
  const next = vi.fn() as NextFunction;
  return { req, res, next };
}

describe('rateLimit', () => {
  it('allows requests under the limit', () => {
    const mw = rateLimit({ windowMs: 60_000, max: 3, keyPrefix: 'test' });
    for (let i = 0; i < 3; i++) {
      const { req, res, next } = mockReqRes();
      mw(req, res, next);
      expect(next).toHaveBeenCalledOnce();
      expect(res.status).not.toHaveBeenCalled();
    }
  });

  it('blocks the request that exceeds the limit within the window', () => {
    const mw = rateLimit({ windowMs: 60_000, max: 2, keyPrefix: 'test' });
    const ip = '5.6.7.8';
    mw(mockReqRes(ip).req, mockReqRes(ip).res, mockReqRes(ip).next);
    const { req: req1, res: res1, next: next1 } = mockReqRes(ip);
    mw(req1, res1, next1);
    const { req: req2, res: res2, next: next2 } = mockReqRes(ip);
    mw(req2, res2, next2);
    // The 3rd request against a max of 2 should be blocked.
    const { req: req3, res: res3, next: next3 } = mockReqRes(ip);
    mw(req3, res3, next3);
    expect(res3.status).toHaveBeenCalledWith(429);
    expect(next3).not.toHaveBeenCalled();
  });

  it('tracks different IPs independently', () => {
    const mw = rateLimit({ windowMs: 60_000, max: 1, keyPrefix: 'test' });
    const a = mockReqRes('1.1.1.1');
    mw(a.req, a.res, a.next);
    expect(a.next).toHaveBeenCalledOnce();

    const b = mockReqRes('2.2.2.2');
    mw(b.req, b.res, b.next);
    expect(b.next).toHaveBeenCalledOnce();
    expect(b.res.status).not.toHaveBeenCalled();
  });

  it('resets once the window has passed', () => {
    vi.useFakeTimers();
    try {
      const mw = rateLimit({ windowMs: 1000, max: 1, keyPrefix: 'test' });
      const ip = '9.9.9.9';

      const first = mockReqRes(ip);
      mw(first.req, first.res, first.next);
      expect(first.next).toHaveBeenCalledOnce();

      const second = mockReqRes(ip);
      mw(second.req, second.res, second.next);
      expect(second.res.status).toHaveBeenCalledWith(429);

      vi.advanceTimersByTime(1001);

      const third = mockReqRes(ip);
      mw(third.req, third.res, third.next);
      expect(third.next).toHaveBeenCalledOnce();
    } finally {
      vi.useRealTimers();
    }
  });
});
