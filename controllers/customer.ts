import { Request, Response } from 'express';
import Customer from '../models/Customer';

export const createCustomer = async (req: Request, res: Response) => {
  try {
    const customerData = {
      ...req.body,
      businessId: req.user?.businessId || req.user?._id
    };

    const customer = await Customer.create(customerData);
    res.status(201).json({ customer });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
    res.status(500).json({ error: 'Failed to create customer', message: errorMessage });
  }
};

export const getCustomers = async (req: Request, res: Response) => {
  try {
    // Filter by business for business users, show all for super admin
    const filter = req.user?.userType === 'super_admin' ? {} : { businessId: req.user?.businessId };

    const customers = await Customer.find(filter)
      .populate({
        path: 'ownerId',
        select: 'name email phone',
      })
      .populate({
        path: 'businessId',
        select: 'businessName businessType',
      });
    res.status(200).json({ customers });
  } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
        res.status(500).json({ error: 'Failed to fetch customer', message: errorMessage });
    }
};

export const getCustomerById = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Fetching customer by ID:', req.params);

    // Build filter based on user type
    const filter: any = { _id: req.params.id };
    if (req.user?.userType !== 'super_admin') {
      filter.businessId = req.user?.businessId;
    }

    const customer = await Customer.findOne(filter)
      .populate({
        path: 'ownerId',
        select: 'name email phone',
      })
      .populate({
        path: 'businessId',
        select: 'businessName businessType',
      });

    if (!customer) {
      res.status(404).json({ message: 'Customer not found' });
      return;
    }
    res.status(200).json({ customer });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
    res.status(500).json({ error: 'Failed to get customer', message: errorMessage });
}
};

export const updateCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    // Build filter based on user type
    const filter: any = { _id: req.params.id };
    if (req.user?.userType !== 'super_admin') {
      filter.businessId = req.user?.businessId;
    }

    // Don't allow updating businessId through this endpoint
    const updateData = { ...req.body };
    delete updateData.businessId;

    const customer = await Customer.findOneAndUpdate(filter, updateData, { new: true })
      .populate({
        path: 'ownerId',
        select: 'name email phone',
      })
      .populate({
        path: 'businessId',
        select: 'businessName businessType',
      });

    if (!customer) {
      res.status(404).json({ message: 'Customer not found' });
      return;
    }
    res.status(200).json({ customer });
  }catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
    res.status(500).json({ error: 'Failed to update customer', message: errorMessage });
    }
};

export const deleteCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    // Build filter based on user type
    const filter: any = { _id: req.params.id };
    if (req.user?.userType !== 'super_admin') {
      filter.businessId = req.user?.businessId;
    }

    const customer = await Customer.findOneAndDelete(filter);
    if (!customer) {
      res.status(404).json({ message: 'Customer not found' });
      return;
    }
    res.status(200).json({ message: 'Customer deleted' });
  }catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
    res.status(500).json({ error: 'Failed to delete customer', message: errorMessage });
  }
};
