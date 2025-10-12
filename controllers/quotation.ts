import { Request, Response } from 'express';
import Quotation from '../models/Quotation';
import Customer from '../models/Customer';
import Vendor from '../models/Vendors';
import mongoose from 'mongoose';

export const createQuotation = async (req: Request, res: Response) => {
  try {
    const quotationData = { ...req.body };

    // Set partyModel based on channel
    if (quotationData.channel === 'B2B') {
      quotationData.partyModel = 'Vendor';
    } else if (quotationData.channel === 'B2C') {
      quotationData.partyModel = 'Customer';
    }

    const newQuotation = new Quotation(quotationData);
    await newQuotation.save();
    res.status(201).json({ success: true, quotation: newQuotation });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create quotation', error: (err as Error).message });
  }
};

export const updateQuotation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updated = await Quotation.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) {
      res.status(404).json({ success: false, message: 'Quotation not found' });
      return;
    } 
    res.status(200).json({ success: true, quotation: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update quotation', error: (err as Error).message });
  }
};

export const deleteQuotation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await Quotation.findByIdAndDelete(id);
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Quotation not found' });
      return
    }
    res.status(200).json({ success: true, message: 'Quotation deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete quotation', error: (err as Error).message });
  }
};

export const getAllQuotations = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, name, channel } = req.query;

    // Build date filter
    const dateFilter: any = {};
    if (startDate) dateFilter.$gte = new Date(startDate as string);
    if (endDate) dateFilter.$lte = new Date(endDate as string);

    // Build name filter
    let nameFilter: any = {};
    if (name && channel) {
      let parties: any[] = [];

      if (channel === 'B2B') {
        // Search vendors by company name
        parties = await Vendor.find({
          companyName: { $regex: name, $options: 'i' }
        });
      } else if (channel === 'B2C') {
        // Search customers by name
        parties = await Customer.find({
          name: { $regex: name, $options: 'i' }
        });
      }

      if (parties.length > 0) {
        nameFilter.partyId = { $in: parties.map((p: any) => p._id) };
      } else {
        // If no parties found with the name, return empty result
        res.status(200).json({ success: true, quotations: [] });
        return;
      }
    }

    // Build final query
    const query: any = {};
    if (startDate || endDate) {
      query.createdAt = dateFilter;
    }
    if (nameFilter.partyId) {
      query.partyId = nameFilter.partyId;
    }
    if (channel && !name) {
      query.channel = channel;
    }

    // Get quotations with population
    const quotations = await Quotation.find(query).populate('partyId').sort({ createdAt: -1 });

    res.status(200).json({ success: true, quotations });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch quotations', error: (err as Error).message });
  }
};

export const getQuotationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid quotation ID' });
      return;
    }

    const quotation = await Quotation.findById(id).populate('partyId');

    if (!quotation) {
      res.status(404).json({ success: false, message: 'Quotation not found' });
      return;
    }

    res.status(200).json({ success: true, quotation });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch quotation', error: (err as Error).message });
  }
};



export const getQuotationsByParty = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid party ID' });
      return;
    }

    // Query by partyId, not id
    const quotations = await Quotation.find({ partyId: id }).populate('partyId').sort({ createdAt: -1 });

    res.status(200).json({ success: true, quotations });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch quotations', error: (err as Error).message });
  }
};
