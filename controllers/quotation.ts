import { Request, Response } from 'express';
import Quotation from '../models/Quotation';
import Customer from '../models/Customer';
import Vendor from '../models/Vendors';
import mongoose from 'mongoose';

export const createQuotation = async (req: Request, res: Response) => {
  try {
    const newQuotation = new Quotation(req.body);
    await newQuotation.save();
    res.status(201).json({ success: true, quotation: newQuotation });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create quotation', error: (err as Error).message });
  }
};

export const updateQuotation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await Quotation.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Quotation not found' });
    res.status(200).json({ success: true, quotation: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update quotation', error: (err as Error).message });
  }
};

export const deleteQuotation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await Quotation.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Quotation not found' });
    res.status(200).json({ success: true, message: 'Quotation deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete quotation', error: (err as Error).message });
  }
};

export const getAllQuotations = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, name, channel } = req.query;

    const dateFilter: any = {};
    if (startDate) dateFilter.$gte = new Date(startDate as string);
    if (endDate) dateFilter.$lte = new Date(endDate as string);

    let nameFilter: any = {};
    if (name && channel) {
      let parties: any;
      if (channel === 'B2B') {
        nameFilter.partyModel = 'Vendor';
        parties =  Vendor.find({
            name: { $regex: name, $options: 'i' }
        });
      } else {
        nameFilter.partyModel = 'Customer';
        parties = Customer.find({
          name: { $regex: name, $options: 'i' }
        });
      };
      nameFilter.partyId = { $in: parties.map((p: any) => p._id) };
    }

    const quotations = await Quotation.find({
      ...(startDate || endDate ? { createdAt: dateFilter } : {}),
      ...(nameFilter.partyId ? nameFilter : {})
    }).populate({
      path: 'partyId',
      model: req.query.channel === 'B2B' ? 'Vendor' : 'Customer',
    });

    res.status(200).json({ success: true, quotations });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch quotations', error: (err as Error).message });
  }
};

export const getQuotationsByParty = async (req: Request, res: Response) => {
  try {
    const { partyId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(partyId)) {
      return res.status(400).json({ success: false, message: 'Invalid party ID' });
    }

    const quotations = await Quotation.find({ partyId }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, quotations });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch quotations', error: (err as Error).message });
  }
};
