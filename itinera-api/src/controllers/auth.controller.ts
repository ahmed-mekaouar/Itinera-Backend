import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { generateToken, generateRefreshToken, getRefreshTokenExpiry } from '../utils/jwt.utils';
import { AuthRequest } from '../middleware/auth.middleware';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, full_name, role } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ success: false, message: 'Email already registered' });
      return;
    }

    const password_hash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { email, password_hash, full_name, role: role || 'tourist' },
      select: {
        id: true, email: true, full_name: true, role: true, created_at: true,
      },
    });

    const access_token = generateToken({ id: user.id, email: user.email, role: user.role });
    const refresh_token = generateRefreshToken();

    await prisma.refreshToken.create({
      data: {
        user_id: user.id,
        token: refresh_token,
        expires_at: getRefreshTokenExpiry(),
      },
    });

    res.status(201).json({
      success: true,
      data: { access_token, refresh_token, token_type: 'Bearer', user },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    const access_token = generateToken({ id: user.id, email: user.email, role: user.role });
    const refresh_token = generateRefreshToken();

    await prisma.refreshToken.create({
      data: {
        user_id: user.id,
        token: refresh_token,
        expires_at: getRefreshTokenExpiry(),
      },
    });

    res.json({
      success: true,
      data: {
        access_token,
        refresh_token,
        token_type: 'Bearer',
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          created_at: user.created_at,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true, email: true, full_name: true, role: true,
        created_at: true, updated_at: true,
      },
    });
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) {
      res.status(400).json({ success: false, message: 'Refresh token is required' });
      return;
    }

    const stored = await prisma.refreshToken.findUnique({ where: { token: refresh_token } });
    if (!stored || stored.expires_at < new Date()) {
      if (stored) {
        await prisma.refreshToken.delete({ where: { id: stored.id } });
      }
      res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: stored.user_id } });
    if (!user) {
      await prisma.refreshToken.delete({ where: { id: stored.id } });
      res.status(401).json({ success: false, message: 'User no longer exists' });
      return;
    }

    await prisma.refreshToken.delete({ where: { id: stored.id } });

    const access_token = generateToken({ id: user.id, email: user.email, role: user.role });
    const new_refresh_token = generateRefreshToken();

    await prisma.refreshToken.create({
      data: {
        user_id: user.id,
        token: new_refresh_token,
        expires_at: getRefreshTokenExpiry(),
      },
    });

    res.json({
      success: true,
      data: {
        access_token,
        refresh_token: new_refresh_token,
        token_type: 'Bearer',
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          created_at: user.created_at,
        },
      },
    });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({ success: false, message: 'Token refresh failed' });
  }
};
