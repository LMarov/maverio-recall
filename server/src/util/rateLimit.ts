import type { NextFunction, Request, Response } from 'express';

/**
 * A small in-memory fixed-window rate limiter — enough for a single-process
 * deployment at this app's scale. If this ever runs as multiple instances
 * behind a load balancer, swap the Map for a shared store (e.g. Redis).
 */
export function rateLimit(opts: { windowMs: number; max: number; keyPrefix: string }) {
  const hits = new Map<string, number[]>();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = opts.keyPrefix + ':' + (req.ip || 'unknown');
    const now = Date.now();
    const windowStart = now - opts.windowMs;

    const existing = (hits.get(key) || []).filter((t) => t > windowStart);
    if (existing.length >= opts.max) {
      res.status(429).json({ error: 'Too many attempts — please wait a bit and try again.' });
      return;
    }
    existing.push(now);
    hits.set(key, existing);
    next();
  };
}
