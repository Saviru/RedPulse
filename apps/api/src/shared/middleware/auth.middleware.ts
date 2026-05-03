import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import { UserModel } from '../../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: string;
  };
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Not authorized, no token' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { username: string; role: string };
    
    if (!decoded.username) {
      res.status(401).json({ message: 'Not authorized, invalid token data' });
      return;
    }

    const user = await UserModel.findOne({ username: decoded.username }).select('_id');
    if (!user) {
      res.status(401).json({ message: 'Not authorized, user not found' });
      return;
    }

    req.user = {
      id: user._id.toString(),
      username: decoded.username,
      role: decoded.role
    };
    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, token failed' });
    return;
  }
};

export const requireRoles = (...rolesArgs: any[]) => {
  const roles = rolesArgs.flat().map((r: string) => r.toUpperCase());
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role.toUpperCase())) {
      res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
      return;
    }
    next();
  };
};
