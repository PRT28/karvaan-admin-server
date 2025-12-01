import { Request, Response } from 'express';
import Traveller from '../models/Traveller';
import mongoose from 'mongoose';

// Get all travellers with isDeleted filter
export const getTravellers = async (req: Request, res: Response) => {
  try {
    const { isDeleted, ownerId } = req.query;

    // Filter by business for business users, show all for super admin
    const filter: any = req.user?.userType === 'super_admin' ? {} : { businessId: req.user?.businessId };
    
    // Add isDeleted filter
    filter.isDeleted = isDeleted === 'true' ? true : false;
    
    // Add ownerId filter if provided
    if (ownerId) {
      filter.ownerId = ownerId;
    }

    const travellers = await Traveller.find(filter)
      .populate({
        path: 'businessId',
        select: 'businessName businessType',
      })
      .populate({
        path: 'ownerId',
        select: 'name email phone',
      })
      .sort({ createdAt: -1 });

    res.status(200).json({ 
      success: true,
      count: travellers.length,
      travellers 
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch travellers', 
      message: errorMessage 
    });
  }
};

// Get traveller by ID
export const getTravellerById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ 
        success: false,
        message: 'Invalid traveller ID' 
      });
      return;
    }

    // Build filter based on user type
    const filter: any = { _id: id };
    if (req.user?.userType !== 'super_admin') {
      filter.businessId = req.user?.businessId;
    }

    const traveller = await Traveller.findOne(filter)
      .populate({
        path: 'businessId',
        select: 'businessName businessType',
      })
      .populate({
        path: 'ownerId',
        select: 'name email phone',
      });

    if (!traveller) {
      res.status(404).json({ 
        success: false,
        message: 'Traveller not found' 
      });
      return;
    }

    res.status(200).json({ 
      success: true,
      traveller 
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch traveller by ID', 
      message: errorMessage 
    });
  }
};

// Create new traveller
export const createTraveller = async (req: Request, res: Response): Promise<void> => {
  try {
    const travellerData = {
      ...req.body,
      businessId: req.user?.businessId // Ensure traveller belongs to user's business
    };

    // Validate required fields
    if (!travellerData.name) {
      res.status(400).json({ 
        success: false,
        message: 'Name is required' 
      });
      return;
    }

    const traveller = new Traveller(travellerData);
    await traveller.save();

    // Populate the created traveller
    await traveller.populate([
      {
        path: 'businessId',
        select: 'businessName businessType',
      },
      {
        path: 'ownerId',
        select: 'name email phone',
      }
    ]);

    res.status(201).json({ 
      success: true,
      message: 'Traveller created successfully',
      traveller 
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
    res.status(500).json({
      success: false,
      error: 'Failed to create traveller',
      message: errorMessage
    });
  }
};

// Update traveller
export const updateTraveller = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid traveller ID'
      });
      return;
    }

    // Build filter based on user type
    const filter: any = { _id: id };
    if (req.user?.userType !== 'super_admin') {
      filter.businessId = req.user?.businessId;
    }

    // Don't allow updating businessId through this endpoint
    const updateData = { ...req.body };
    delete updateData.businessId;

    const traveller = await Traveller.findOneAndUpdate(
      filter,
      updateData,
      {
        new: true,
        runValidators: true
      }
    ).populate([
      {
        path: 'businessId',
        select: 'businessName businessType',
      },
      {
        path: 'ownerId',
        select: 'name email phone',
      }
    ]);

    if (!traveller) {
      res.status(404).json({
        success: false,
        message: 'Traveller not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Traveller updated successfully',
      traveller
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
    res.status(500).json({
      success: false,
      error: 'Failed to update traveller',
      message: errorMessage
    });
  }
};

// Soft delete traveller (set isDeleted to true)
export const deleteTraveller = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid traveller ID'
      });
      return;
    }


    const traveller = await Traveller.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );

    if (!traveller) {
      res.status(404).json({
        success: false,
        message: 'Traveller not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Traveller deleted successfully',
      traveller: {
        _id: traveller._id,
        name: traveller.name,
        isDeleted: traveller.isDeleted
      }
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
    res.status(500).json({
      success: false,
      error: 'Failed to delete traveller',
      message: errorMessage
    });
  }
};

// Restore traveller (set isDeleted to false)
export const restoreTraveller = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid traveller ID'
      });
      return;
    }

    // Build filter based on user type
    const filter: any = { _id: id };
    if (req.user?.userType !== 'super_admin') {
      filter.businessId = req.user?.businessId;
    }

    const traveller = await Traveller.findOneAndUpdate(
      filter,
      { isDeleted: false },
      { new: true }
    ).populate([
      {
        path: 'businessId',
        select: 'businessName businessType',
      },
      {
        path: 'ownerId',
        select: 'name email phone',
      }
    ]);

    if (!traveller) {
      res.status(404).json({
        success: false,
        message: 'Traveller not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Traveller restored successfully',
      traveller
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
    res.status(500).json({
      success: false,
      error: 'Failed to restore traveller',
      message: errorMessage
    });
  }
};
