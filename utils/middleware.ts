import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import User, { IUser } from '../models/User';

declare module 'express-serve-static-core' {
  interface Request {
    user?: IUser;
  }
}

export const checkKarvaanToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  let token = req.headers['x-access-token'] || req.headers['authorization'];

  if (!token || typeof token !== 'string') {
    res.status(401).json({
      success: false,
      message: 'Auth token is not supplied'
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    console.log(decoded);
    if (!decoded) {
      res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
      return;
    }

    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      message: 'Token is not valid'
    });
  }
};
