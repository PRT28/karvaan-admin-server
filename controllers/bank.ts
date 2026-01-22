import { Request, Response } from 'express';
import Bank from '../models/Bank';
import mongoose from 'mongoose';

const getBusinessIdFromRequest = (req: Request) =>
  req.user?.businessInfo?.businessId || req.user?.businessId || req.user?._id;

const requireBusinessId = (req: Request, res: Response) => {
  const businessId = getBusinessIdFromRequest(req);
  if (!businessId) {
    res.status(401).json({ message: 'Unauthorized user' });
    return null;
  }
  return businessId;
};

export const createBank = async (req: Request, res: Response) => {
  try {
    const businessId = requireBusinessId(req, res);
    if (!businessId) return;

    const bankData = {
      ...req.body,
      businessId,
    };

    const bank = await Bank.create(bankData);
    res.status(201).json({ bank });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
    res.status(500).json({ error: 'Failed to create bank', message: errorMessage });
  }
};

export const getBanks = async (req: Request, res: Response) => {
  try {
    const { isDeleted } = req.query;

    const filter: any = {};
    if (req.user?.userType !== 'super_admin') {
      const businessId = requireBusinessId(req, res);
      if (!businessId) return;
      filter.businessId = businessId;
    }

    if (isDeleted !== undefined) {
      filter.isDeleted = String(isDeleted) === 'true';
    } else {
      filter.isDeleted = { $ne: true };
    }

    const banks = await Bank.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ banks });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
    res.status(500).json({ error: 'Failed to fetch banks', message: errorMessage });
  }
};

export const getBankById = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      res.status(400).json({ message: 'Invalid bank ID' });
      return;
    }

    const filter: any = { _id: req.params.id, isDeleted: { $ne: true } };
    if (req.user?.userType !== 'super_admin') {
      const businessId = requireBusinessId(req, res);
      if (!businessId) return;
      filter.businessId = businessId;
    }

    const bank = await Bank.findOne(filter);
    if (!bank) {
      res.status(404).json({ message: 'Bank not found' });
      return;
    }
    res.status(200).json({ bank });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
    res.status(500).json({ error: 'Failed to fetch bank by ID', message: errorMessage });
  }
};

export const updateBank = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      res.status(400).json({ message: 'Invalid bank ID' });
      return;
    }

    const filter: any = { _id: req.params.id, isDeleted: { $ne: true } };
    if (req.user?.userType !== 'super_admin') {
      const businessId = requireBusinessId(req, res);
      if (!businessId) return;
      filter.businessId = businessId;
    }

    const updateData = { ...req.body };
    delete updateData.businessId;

    const bank = await Bank.findOneAndUpdate(filter, updateData, { new: true });
    if (!bank) {
      res.status(404).json({ message: 'Bank not found' });
      return;
    }
    res.status(200).json({ bank });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
    res.status(500).json({ error: 'Failed to update bank', message: errorMessage });
  }
};

export const deleteBank = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      res.status(400).json({ message: 'Invalid bank ID' });
      return;
    }

    const filter: any = { _id: req.params.id };
    if (req.user?.userType !== 'super_admin') {
      const businessId = requireBusinessId(req, res);
      if (!businessId) return;
      filter.businessId = businessId;
    }

    const bank = await Bank.findOneAndUpdate(filter, { isDeleted: true }, { new: true });
    if (!bank) {
      res.status(404).json({ message: 'Bank not found' });
      return;
    }
    res.status(200).json({ message: 'Bank deleted' });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
    res.status(500).json({ error: 'Failed to delete bank', message: errorMessage });
  }
};
