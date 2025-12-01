import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import User, { IUser } from '../models/User';
import Business from '../models/Business';

declare module 'express-serve-static-core' {
  interface Request {
    user?: any;
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

  console.log(token, 'token');

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

// Middleware to verify JWT token and fetch fresh user data
export const verifyJWT = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token = req.headers['x-access-token'] || req.headers['authorization'];

    if (!token || typeof token !== 'string') {
      res.status(401).json({
        success: false,
        message: 'Auth token is not supplied'
      });
      return;
    }

    // Remove 'Bearer ' prefix if present
    if (token.startsWith('Bearer ')) {
      token = token.substring(7);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

    if (!decoded) {
      res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
      return;
    }

    // Fetch fresh user data to ensure user is still active
    const user = await User.findById(decoded._id)
      .populate('roleId', 'roleName permission')
      .populate('businessId', 'businessName isActive');

    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
      return;
    }

    // Check if business is still active (for business users)
    if (user.businessId && !(user.businessId as any).isActive) {
      res.status(403).json({
        success: false,
        message: 'Business account is inactive'
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

// Middleware to check if user is super admin
export const requireSuperAdmin = (req: Request, res: Response, next: NextFunction): void => {
  const user = req.user;

  if (!user || (user as any).userType !== 'super_admin') {
    res.status(403).json({
      success: false,
      message: 'Forbidden: Super admin access required'
    });
    return;
  }

  next();
};

// Middleware to check if user is business admin
export const requireBusinessAdmin = (req: Request, res: Response, next: NextFunction): void => {
  const user = req.user;

  if (!user || ((user as any).userType !== 'business_admin' && (user as any).userType !== 'super_admin')) {
    res.status(403).json({
      success: false,
      message: 'Forbidden: Business admin access required'
    });
    return;
  }

  next();
};

// Middleware to ensure user can only access their own business data
export const requireSameBusiness = (req: Request, res: Response, next: NextFunction): void => {
  const user = req.user;
  const { businessId } = req.params;

  if (!user) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
    return;
  }

  // Super admins can access any business
  if ((user as any).userType === 'super_admin') {
    next();
    return;
  }

  // Business users can only access their own business
  if (!(user as any).businessId || (user as any).businessId.toString() !== businessId) {
    res.status(403).json({
      success: false,
      message: 'Forbidden: Cannot access other business data'
    });
    return;
  }

  next();
};
