import { Request, Response } from 'express';
import Vendor from '../models/Vendors';

export const createVendor = async (req: Request, res: Response) => {
  try {
    const vendor = await Vendor.create(req.body);
    res.status(201).json({ vendor });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
    res.status(500).json({ error: 'Failed to create vendor', message: errorMessage });
  }
};

export const getVendors = async (_req: Request, res: Response) => {
  try {
    const vendors = await Vendor.find();
    res.status(200).json({ vendors });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
    res.status(500).json({ error: 'Failed to fetch vendors', message: errorMessage });
  }
};

export const getVendorById = async (req: Request, res: Response): Promise<void> => {
  try {
    const vendor = await Vendor.findById(req.params.id);
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
    const vendor = await Vendor.findByIdAndUpdate(req.params.id, req.body, { new: true });
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
    const vendor = await Vendor.findByIdAndDelete(req.params.id);
     if (!vendor) {
      res.status(404).json({ message: 'Vendor not found' });
      return;
    } 
    res.status(200).json({ message: 'Vendor deleted' });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
    res.status(500).json({ error: 'Failed to delete customer', message: errorMessage });
  }
};
