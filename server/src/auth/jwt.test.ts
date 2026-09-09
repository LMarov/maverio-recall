import { describe, expect, it } from 'vitest';
import jwt from 'jsonwebtoken';
import { env } from '../env';
import { signToken, verifyToken, type AuthedUser } from './jwt';

const user: AuthedUser = { id: 'u1', email: 'lana@maverio.com', name: 'Lana Marov', role: 'Owner', scope: 'all' };

/** Temporarily overrides env.jwtSecretPrevious for one test, always restoring it afterward. */
function withPreviousSecret(value: string, run: () => void) {
  const original = env.jwtSecretPrevious;
  env.jwtSecretPrevious = value;
  try {
    run();
  } finally {
    env.jwtSecretPrevious = original;
  }
}

describe('signToken / verifyToken', () => {
  it('round-trips a token signed with the current secret', () => {
    const token = signToken(user);
    expect(verifyToken(token)).toMatchObject(user);
  });

  it('rejects a token signed with an unrelated secret when no previous secret is configured', () => {
    withPreviousSecret('', () => {
      const foreignToken = jwt.sign(user, 'some-other-secret');
      expect(() => verifyToken(foreignToken)).toThrow();
    });
  });

  it('accepts a token signed with JWT_SECRET_PREVIOUS during rotation', () => {
    withPreviousSecret('the-old-secret', () => {
      const oldToken = jwt.sign(user, 'the-old-secret');
      expect(verifyToken(oldToken)).toMatchObject(user);
    });
  });

  it('still rejects a token signed with neither the current nor previous secret', () => {
    withPreviousSecret('the-old-secret', () => {
      const foreignToken = jwt.sign(user, 'totally-unrelated-secret');
      expect(() => verifyToken(foreignToken)).toThrow();
    });
  });
});
