import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '7d') as string & { __brand: never };
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

export const generateToken = (payload: {
  id: number;
  email: string;
  role: string;
}): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET);
};

export const generateRefreshToken = (): string => {
  return crypto.randomBytes(40).toString('hex');
};

export const getRefreshTokenExpiry = (): Date => {
  const match = JWT_REFRESH_EXPIRES_IN.match(/^(\d+)([dhms])$/);
  if (!match) return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const value = parseInt(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = { d: 86400000, h: 3600000, m: 60000, s: 1000 };
  return new Date(Date.now() + value * (multipliers[unit] || 86400000));
};
