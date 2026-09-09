import jwt from 'jsonwebtoken';
import { env } from '../env';

export interface AuthedUser {
  id: string;
  email: string;
  name: string;
  role: 'Owner' | 'Admin' | 'Member';
  scope: 'all' | 'attended';
}

export function signToken(user: AuthedUser): string {
  return jwt.sign(user, env.jwtSecret, { expiresIn: '30d' });
}

/**
 * Always signs with the current JWT_SECRET, but verifies against it first and
 * falls back to JWT_SECRET_PREVIOUS if set — so rotating the secret doesn't
 * instantly invalidate every signed-in session. Drop JWT_SECRET_PREVIOUS once
 * old tokens have expired (30d).
 */
export function verifyToken(token: string): AuthedUser {
  try {
    return jwt.verify(token, env.jwtSecret) as AuthedUser;
  } catch (err) {
    if (env.jwtSecretPrevious) return jwt.verify(token, env.jwtSecretPrevious) as AuthedUser;
    throw err;
  }
}
