import { Request, Response } from 'express';
import Vendor from '../models/Vendors';

export const createVendor = async (req: Request, res: Response) => {
  try {
    // Add businessId from authenticated user
    const vendorData = {
      ...req.body,
      businessId: req.user?.businessId || req.user?._id // Use businessId or fallback to user ID for super admin
    };

    const vendor = await Vendor.create(vendorData);
    res.status(201).json({ vendor });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
    res.status(500).json({ error: 'Failed to create vendor', message: errorMessage });
  }
};

export const getVendors = async (req: Request, res: Response) => {
  try {
    // Filter by business for business users, show all for super admin
    const filter = req.user?.userType === 'super_admin' ? {} : { businessId: req.user?.businessId };

    const vendors = await Vendor.find(filter)
      .populate({
        path: 'businessId',
        select: 'businessName businessType',
      });
    res.status(200).json({ vendors });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
    res.status(500).json({ error: 'Failed to fetch vendors', message: errorMessage });
  }
};

export const getVendorById = async (req: Request, res: Response): Promise<void> => {
  try {
    // Build filter based on user type
    const filter: any = { _id: req.params.id };
    if (req.user?.userType !== 'super_admin') {
      filter.businessId = req.user?.businessId;
    }

    const vendor = await Vendor.findOne(filter)
      .populate({
        path: 'businessId',
        select: 'businessName businessType',
      });

    if (!vendor) {
      res.status(404).json({ message: 'Vendor not found' });
      return;
    }
    res.status(200).json({ vendor });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
    res.status(500).json({ error: 'Failed to fetch vendor by ID', message: errorMessage });
  }
};

export const updateVendor = async (req: Request, res: Response): Promise<void> => {
  try {
    // Build filter based on user type
    const filter: any = { _id: req.params.id };
    if (req.user?.userType !== 'super_admin') {
      filter.businessId = req.user?.businessId;
    }

    // Don't allow updating businessId through this endpoint
    const updateData = { ...req.body };
    delete updateData.businessId;

    const vendor = await Vendor.findOneAndUpdate(filter, updateData, { new: true })
      .populate({
        path: 'businessId',
        select: 'businessName businessType',
      });

     if (!vendor) {
      res.status(404).json({ message: 'Vendor not found' });
      return;
    }
    res.status(200).json({ vendor });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
    res.status(500).json({ error: 'Failed to update vendor', message: errorMessage });
  }
};

export const deleteVendor = async (req: Request, res: Response): Promise<void> => {
  try {
    // Build filter based on user type
    const filter: any = { _id: req.params.id };
    if (req.user?.userType !== 'super_admin') {
      filter.businessId = req.user?.businessId;
    }

    const vendor = await Vendor.findOneAndDelete(filter);
     if (!vendor) {
      res.status(404).json({ message: 'Vendor not found' });
      return;
    }
    res.status(200).json({ message: 'Vendor deleted' });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
    res.status(500).json({ error: 'Failed to delete vendor', message: errorMessage });
  }
};
