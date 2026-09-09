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

export function verifyToken(token: string): AuthedUser {
  return jwt.verify(token, env.jwtSecret) as AuthedUser;
}
