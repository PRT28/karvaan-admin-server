import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import Business from '../models/Business';
import User from '../models/User';
import Role from '../models/Roles';
import mongoose from 'mongoose';

// Register a new business with admin user
export const registerBusiness = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      // Business details
      businessName,
      businessType,
      businessEmail,
      businessPhone,
      address,
      website,
      description,
      gstin,
      panNumber,
      registrationNumber,
      
      // Admin user details
      adminName,
      adminEmail,
      adminMobile,
      adminPhoneCode,
      adminPassword,
    } = req.body;

    // Validate required fields
    if (!businessName || !businessType || !businessEmail || !businessPhone || !address ||
        !adminName || !adminEmail || !adminMobile || !adminPhoneCode || !adminPassword) {
      await session.abortTransaction();
      res.status(400).json({ 
        success: false, 
        message: 'All required fields must be provided' 
      });
      return;
    }

    // Check if business email already exists
    const existingBusiness = await Business.findOne({ email: businessEmail }).session(session);
    if (existingBusiness) {
      await session.abortTransaction();
      res.status(400).json({ 
        success: false, 
        message: 'Business with this email already exists' 
      });
      return;
    }

    // Check if admin email already exists
    const existingUser = await User.findOne({ email: adminEmail }).session(session);
    if (existingUser) {
      await session.abortTransaction();
      res.status(400).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
      return;
    }

    // Find or create admin role
    let adminRole = await Role.findOne({ roleName: 'Admin' }).session(session);
    if (!adminRole) {
      adminRole = new Role({
        roleName: 'Admin',
        permission: {
          sales: { create: true, read: true, update: true, delete: true },
          operateions: {
            voucher: { create: true, read: true, update: true, delete: true },
            content: { create: true, read: true, update: true, delete: true },
          },
          userAccess: {
            roles: { create: true, read: true, update: true, delete: true },
            user: { create: true, read: true, update: true, delete: true },
          },
        }
      });
      await adminRole.save({ session });
    }

    // Hash admin password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Create business first (without adminUserId)
    const business = new Business({
      businessName,
      businessType,
      email: businessEmail,
      phone: businessPhone,
      address,
      website,
      description,
      gstin,
      panNumber,
      registrationNumber,
      adminUserId: new mongoose.Types.ObjectId(), // Temporary ID, will be updated
    });

    const savedBusiness = await business.save({ session });

    // Create admin user
    const adminUser = new User({
      name: adminName,
      email: adminEmail,
      mobile: adminMobile,
      phoneCode: adminPhoneCode,
      roleId: adminRole._id,
      businessId: savedBusiness._id,
      userType: 'business_admin',
      password: hashedPassword,
    });

    const savedAdminUser = await adminUser.save({ session });

    // Update business with correct admin user ID
    savedBusiness.adminUserId = savedAdminUser._id as mongoose.Types.ObjectId;
    await savedBusiness.save({ session });

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: 'Business and admin user registered successfully',
      data: {
        business: {
          id: savedBusiness._id,
          businessName: savedBusiness.businessName,
          email: savedBusiness.email,
          businessType: savedBusiness.businessType,
        },
        adminUser: {
          id: savedAdminUser._id,
          name: savedAdminUser.name,
          email: savedAdminUser.email,
          userType: savedAdminUser.userType,
        }
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Business registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register business',
      error: (error as Error).message
    });
  } finally {
    session.endSession();
  }
};

// Get business details
export const getBusinessDetails = async (req: Request, res: Response) => {
  try {
    const { businessId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(businessId)) {
      res.status(400).json({ success: false, message: 'Invalid business ID' });
      return;
    }

    const business = await Business.findById(businessId)
      .populate('adminUserId', 'name email userType')
      .populate({
        path: 'userCount',
        select: 'name email userType isActive'
      });

    if (!business) {
      res.status(404).json({ success: false, message: 'Business not found' });
      return;
    }

    res.status(200).json({ success: true, business });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch business details',
      error: (error as Error).message
    });
  }
};

// Update business details
export const updateBusiness = async (req: Request, res: Response) => {
  try {
    const { businessId } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(businessId)) {
      res.status(400).json({ success: false, message: 'Invalid business ID' });
      return;
    }

    // Remove fields that shouldn't be updated directly
    delete updateData.adminUserId;
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const business = await Business.findByIdAndUpdate(
      businessId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!business) {
      res.status(404).json({ success: false, message: 'Business not found' });
      return;
    }

    res.status(200).json({ 
      success: true, 
      message: 'Business updated successfully',
      business 
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update business',
      error: (error as Error).message
    });
  }
};

// Get all businesses (Super Admin only)
export const getAllBusinesses = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, search, businessType, isActive } = req.query;
    
    const query: any = {};
    
    if (search) {
      query.$or = [
        { businessName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (businessType) {
      query.businessType = businessType;
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const skip = (Number(page) - 1) * Number(limit);
    
    const businesses = await Business.find(query)
      .populate('adminUserId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Business.countDocuments(query);

    res.status(200).json({
      success: true,
      businesses,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalBusinesses: total,
        hasNext: skip + businesses.length < total,
        hasPrev: Number(page) > 1
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch businesses',
      error: (error as Error).message
    });
  }
};

// Deactivate/Activate business
export const toggleBusinessStatus = async (req: Request, res: Response) => {
  try {
    const { businessId } = req.params;
    const { isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(businessId)) {
      res.status(400).json({ success: false, message: 'Invalid business ID' });
      return;
    }

    const business = await Business.findByIdAndUpdate(
      businessId,
      { isActive },
      { new: true }
    );

    if (!business) {
      res.status(404).json({ success: false, message: 'Business not found' });
      return;
    }

    // Also update all users of this business
    await User.updateMany(
      { businessId },
      { isActive }
    );

    res.status(200).json({
      success: true,
      message: `Business ${isActive ? 'activated' : 'deactivated'} successfully`,
      business
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update business status',
      error: (error as Error).message
    });
  }
};
