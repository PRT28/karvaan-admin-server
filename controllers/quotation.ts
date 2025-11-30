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

    // Get party to determine businessId
    let party: any;
    if (quotationData.partyModel === 'Customer') {
      party = await Customer.findById(quotationData.partyId);
    } else {
      party = await Vendor.findById(quotationData.partyId);
    }

    if (!party) {
      return res.status(404).json({
        success: false,
        message: `${quotationData.partyModel} not found`
      });
    }

    // Verify user can access this party's business
    if (req.user?.userType !== 'super_admin' && party.businessId.toString() !== req.user?.businessId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Cannot create quotation for other business'
      });
    }

    // Add businessId to quotation data
    quotationData.businessId = party.businessId;

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

    // Build filter based on user type
    const filter: any = { _id: id };
    if (req.user?.userType !== 'super_admin') {
      filter.businessId = req.user?.businessId;
    }

    // Don't allow updating businessId through this endpoint
    const updateData = { ...req.body };
    delete updateData.businessId;

    const updated = await Quotation.findOneAndUpdate(filter, updateData, { new: true })
      .populate('partyId')
      .populate({
        path: 'businessId',
        select: 'businessName businessType',
      });

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

    // Build filter based on user type
    const filter: any = { _id: id };
    if (req.user?.userType !== 'super_admin') {
      filter.businessId = req.user?.businessId;
    }

    const deleted = await Quotation.findOneAndDelete(filter);
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
    const { bookingStartDate, bookingEndDate, travelStartDate, travelEndDate, owner } = req.query;

    // Build business filter
    const businessFilter: any = {};
    console.log(req.user);
    if (req.user?.userType !== 'super_admin') {
      businessFilter.businessId = req.user?.businessId;
    }

    // Build date filter
    const bookingDateFilter: any = {};
    if (bookingStartDate) bookingDateFilter.$gte = new Date(bookingStartDate as string);
    if (bookingEndDate) bookingDateFilter.$lte = new Date(bookingEndDate as string);

    const travelDateFilter: any = {};

    if (travelStartDate) travelDateFilter.$gte = new Date(travelStartDate as string);
    if (travelEndDate) travelDateFilter.$lte = new Date(travelEndDate as string);

    if (owner) {
      businessFilter.owner = owner;
    }

    const query: any = { ...businessFilter };
    if (bookingStartDate || bookingEndDate) {
      query.createdAt = bookingDateFilter;
    }
    if (travelStartDate || travelEndDate) {
      query.travelDate = travelDateFilter;
    }

    // Get quotations with population
    const quotations = await Quotation.find(query)
      .populate('partyId')
      .populate({
        path: 'businessId',
        select: 'businessName businessType',
      })
      .sort({ createdAt: -1 });

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
