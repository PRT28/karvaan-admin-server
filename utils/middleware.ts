import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import User, { IUser } from '../models/User';

interface DecodedToken {
  id: string;
  iat: number;
  exp: number;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: IUser;
  }
}

export const checkKarvaanToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  let token = req.headers['x-access-token'] || req.headers['authorization'];

  if (typeof token === 'string' && token.startsWith('Bearer ')) {
    token = token.slice(7, token.length);
  }

  if (!token || typeof token !== 'string') {
    res.status(401).json({
      success: false,
      message: 'Auth token is not supplied'
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any as DecodedToken;
    if (!decoded || !decoded.id) {
      res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
      return;
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      message: 'Token is not valid'
    });
  }
};
