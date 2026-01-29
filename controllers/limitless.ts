import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Limitless from '../models/Limitless';
import Customer from '../models/Customer';
import Traveller from '../models/Traveller';
import Team from '../models/Team';
import { uploadMultipleToS3, UploadedDocument } from '../utils/s3';
import MakerCheckerGroup from '../models/MakerCheckerGroup';

const getBusinessIdFromRequest = (req: Request): string | undefined => {
  const businessInfoId = req.user?.businessInfo?.businessId;
  if (businessInfoId) return businessInfoId.toString();

  const userBusinessId = req.user?.businessId;
  if (!userBusinessId) return undefined;

  if (typeof userBusinessId === 'string') return userBusinessId;
  if (typeof userBusinessId === 'object' && (userBusinessId as any)._id) {
    return (userBusinessId as any)._id.toString();
  }

  return undefined;
};

const getUserIdFromRequest = (req: Request): string | undefined => {
  const userId = (req.user as any)?._id;
  if (!userId) return undefined;
  if (typeof userId === 'string') return userId;
  if (typeof userId === 'object' && (userId as any)._id) {
    return (userId as any)._id.toString();
  }
  return undefined;
};

const parseJsonField = (
  data: Record<string, any>,
  field: string,
  label: string,
  res: Response
): boolean => {
  if (typeof data[field] === 'string') {
    try {
      data[field] = JSON.parse(data[field]);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: `Invalid ${label} JSON format`,
      });
      return false;
    }
  }
  return true;
};

const parseDateField = (data: Record<string, any>, field: string, res: Response): boolean => {
  if (typeof data[field] === 'string') {
    const parsed = new Date(data[field]);
    if (isNaN(parsed.getTime())) {
      res.status(400).json({
        success: false,
        message: `Invalid ${field} format. Please provide a valid date.`,
      });
      return false;
    }
    data[field] = parsed;
  }
  return true;
};

const parseNumberField = (data: Record<string, any>, field: string, res: Response): boolean => {
  if (data[field] !== undefined && data[field] !== null) {
    const value = Number(data[field]);
    if (Number.isNaN(value)) {
      res.status(400).json({
        success: false,
        message: `${field} must be a valid number`,
      });
      return false;
    }
    data[field] = value;
  }
  return true;
};

export const createLimitless = async (req: Request, res: Response): Promise<void> => {
  try {
    const limitlessData = { ...req.body };

    if (limitlessData.serviceStatus !== 'draft') {
      if (limitlessData.totalAmount === undefined || limitlessData.totalAmount === null) {
        res.status(400).json({
          success: false,
          message: 'totalAmount is required',
        });
        return;
      }

      if (!limitlessData.travelDate) {
        res.status(400).json({
          success: false,
          message: 'travelDate is required',
        });
        return;
      }
    }

    if (!parseDateField(limitlessData, 'travelDate', res)) return;
    if (!parseDateField(limitlessData, 'bookingDate', res)) return;

    if (!parseJsonField(limitlessData, 'secondaryOwner', 'secondaryOwner', res)) return;
    if (!parseJsonField(limitlessData, 'adultTravelers', 'adultTravelers', res)) return;
    if (!parseJsonField(limitlessData, 'childTravelers', 'childTravelers', res)) return;
    if (!parseJsonField(limitlessData, 'limitlessDestinations', 'limitlessDestinations', res)) return;

    if (!parseNumberField(limitlessData, 'totalAmount', res)) return;
    if (!parseNumberField(limitlessData, 'roe', res)) return;
    if (!parseNumberField(limitlessData, 'adultNumber', res)) return;
    if (!parseNumberField(limitlessData, 'childNumber', res)) return;

    limitlessData.businessId = req.user?.businessInfo?.businessId;

    let uploadedDocuments: UploadedDocument[] = [];
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      if (req.files.length > 3) {
        res.status(400).json({
          success: false,
          message: 'Maximum 3 documents are allowed per limitless booking',
        });
        return;
      }

      try {
        uploadedDocuments = await uploadMultipleToS3(
          req.files as Express.Multer.File[],
          `limitless/${req.user?.businessInfo?.businessId}`
        );
      } catch (uploadError) {
        res.status(500).json({
          success: false,
          message: 'Failed to upload documents',
          error: (uploadError as Error).message,
        });
        return;
      }
    }

    limitlessData.documents = uploadedDocuments;

    const newLimitless = new Limitless(limitlessData);
    await newLimitless.save();

    res.status(201).json({ success: true, limitless: newLimitless });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to create limitless booking',
      error: (err as Error).message,
    });
  }
};

export const updateLimitless = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid limitless ID' });
      return;
    }

    const filter: any = { _id: id };
    if (req.user?.userType !== 'super_admin') {
      const businessId = getBusinessIdFromRequest(req);
      if (!businessId) {
        res.status(403).json({ success: false, message: 'Business context missing' });
        return;
      }
      filter.businessId = businessId;
    }

    const updateData = { ...req.body };
    delete updateData.businessId;
    delete updateData.customId;

    if (!parseJsonField(updateData, 'secondaryOwner', 'secondaryOwner', res)) return;
    if (!parseJsonField(updateData, 'adultTravelers', 'adultTravelers', res)) return;
    if (!parseJsonField(updateData, 'childTravelers', 'childTravelers', res)) return;
    if (!parseJsonField(updateData, 'limitlessDestinations', 'limitlessDestinations', res)) return;
    if (!parseJsonField(updateData, 'documents', 'documents', res)) return;

    if (!parseDateField(updateData, 'travelDate', res)) return;
    if (!parseDateField(updateData, 'bookingDate', res)) return;

    if (!parseNumberField(updateData, 'totalAmount', res)) return;
    if (!parseNumberField(updateData, 'roe', res)) return;
    if (!parseNumberField(updateData, 'adultNumber', res)) return;
    if (!parseNumberField(updateData, 'childNumber', res)) return;

    const hasDocumentsInBody = Object.prototype.hasOwnProperty.call(updateData, 'documents');
    let existingDocuments = Array.isArray(updateData.documents) ? updateData.documents : [];

    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const businessIdForUploads = getBusinessIdFromRequest(req);
      if (!hasDocumentsInBody) {
        const existingLimitless = await Limitless.findOne(filter).select('documents');
        if (!existingLimitless) {
          res.status(404).json({ success: false, message: 'Limitless booking not found' });
          return;
        }
        existingDocuments = existingLimitless.documents || [];
      }

      if (req.files.length + existingDocuments.length > 3) {
        res.status(400).json({
          success: false,
          message: 'Maximum 3 documents are allowed per limitless booking',
        });
        return;
      }

      const uploadedDocuments = await uploadMultipleToS3(
        req.files as Express.Multer.File[],
        `limitless/${businessIdForUploads ?? 'unknown-business'}`
      );

      updateData.documents = [...existingDocuments, ...uploadedDocuments];
    }

    const updated = await Limitless.findOneAndUpdate(filter, updateData, { new: true })
      .populate('businessId')
      .populate({
        path: 'businessId',
        select: 'businessName businessType',
      });

    if (!updated) {
      res.status(404).json({ success: false, message: 'Limitless booking not found' });
      return;
    }

    res.status(200).json({ success: true, limitless: updated });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to update limitless booking',
      error: (err as Error).message,
    });
  }
};

export const deleteLimitless = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const filter: any = { _id: id, isDeleted: false };
    if (req.user?.userType !== 'super_admin') {
      filter.businessId = req.user?.businessInfo?.businessId;
    }

    const deleted = await Limitless.findOneAndUpdate(filter, { isDeleted: true }, { new: true });

    if (!deleted) {
      res.status(404).json({ success: false, message: 'Limitless booking not found' });
      return;
    }

    res.status(200).json({ success: true, message: 'Limitless booking deleted successfully' });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete limitless booking',
      error: (err as Error).message,
    });
  }
};

export const getAllLimitless = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      bookingStartDate,
      bookingEndDate,
      travelStartDate,
      travelEndDate,
      primaryOwner,
      secondaryOwner,
      isDeleted,
      serviceStatus,
    } = req.query;

    const businessFilter: any = {};
    if (req.user?.userType !== 'super_admin') {
      businessFilter.businessId = req.user?.businessInfo?.businessId;
    }

    const bookingDateFilter: any = {};
    if (bookingStartDate) bookingDateFilter.$gte = new Date(bookingStartDate as string);
    if (bookingEndDate) bookingDateFilter.$lte = new Date(bookingEndDate as string);

    const travelDateFilter: any = {};
    if (travelStartDate) travelDateFilter.$gte = new Date(travelStartDate as string);
    if (travelEndDate) travelDateFilter.$lte = new Date(travelEndDate as string);

    if (primaryOwner) {
      businessFilter.primaryOwner = primaryOwner;
    }

    if (secondaryOwner) {
      businessFilter.secondaryOwner = secondaryOwner;
    }

    const query: any = { ...businessFilter };
    if (bookingStartDate || bookingEndDate) {
      query.createdAt = bookingDateFilter;
    }
    if (travelStartDate || travelEndDate) {
      query.travelDate = travelDateFilter;
    }
    if (serviceStatus) {
      query.serviceStatus = serviceStatus;
    }

    const limitlessBookings = await Limitless.find({
      ...query,
      isDeleted: isDeleted === 'true' ? true : false,
    })
      .populate({
        path: 'businessId',
        select: 'businessName businessType',
      })
      .populate('customerId', 'name email phone companyName')
      .populate('adultTravelers', 'name email phone')
      .populate({
        path: 'childTravelers.id',
        model: 'Traveller',
        select: 'name email phone',
      })
      .populate('primaryOwner', 'name email')
      .populate('secondaryOwner', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ success: true, limitless: limitlessBookings });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch limitless bookings',
      error: (err as Error).message,
    });
  }
};

export const getLimitlessById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid limitless ID' });
      return;
    }

    const limitless = await Limitless.findOne({ _id: id, isDeleted: { $ne: true } }).populate('businessId');

    if (!limitless) {
      res.status(404).json({ success: false, message: 'Limitless booking not found' });
      return;
    }

    res.status(200).json({ success: true, limitless });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch limitless booking',
      error: (err as Error).message,
    });
  }
};

export const getLimitlessByParty = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid party ID' });
      return;
    }

    const limitlessBookings = await Limitless.find({ businessId: id })
      .populate('businessId')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, limitless: limitlessBookings });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch limitless bookings',
      error: (err as Error).message,
    });
  }
};

export const getLimitlessHistoryByCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { customerId } = req.params;
    const {
      status,
      startDate,
      endDate,
      travelStartDate,
      travelEndDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
    } = req.query;

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      res.status(400).json({ success: false, message: 'Invalid customer ID' });
      return;
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      res.status(404).json({ success: false, message: 'Customer not found' });
      return;
    }

    if (
      req.user?.userType !== 'super_admin' &&
      customer.businessId.toString() !== req.user?.businessInfo?.businessId?.toString()
    ) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: Cannot access customer from other business',
      });
      return;
    }

    const filter: any = {
      customerId: customerId,
      businessId: customer.businessId,
      isDeleted: { $ne: true },
    };

    if (status) {
      filter.status = status;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate as string);
      if (endDate) filter.createdAt.$lte = new Date(endDate as string);
    }

    if (travelStartDate || travelEndDate) {
      filter.travelDate = {};
      if (travelStartDate) filter.travelDate.$gte = new Date(travelStartDate as string);
      if (travelEndDate) filter.travelDate.$lte = new Date(travelEndDate as string);
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const sortConfig: any = {};
    sortConfig[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    const limitlessBookings = await Limitless.find(filter)
      .populate('customerId', 'name email phone companyName')
      .populate('adultTravelers', 'name email phone')
      .populate({
        path: 'childTravelers.id',
        model: 'Traveller',
        select: 'name email phone',
      })
      .populate('primaryOwner', 'name email')
      .populate('secondaryOwner', 'name email')
      .populate('businessId', 'businessName')
      .sort(sortConfig)
      .skip(skip)
      .limit(limitNum);

    const totalCount = await Limitless.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / limitNum);

    res.status(200).json({
      success: true,
      data: {
        limitless: limitlessBookings,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalCount,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
        },
        customer: {
          _id: customer._id,
          name: customer.name,
          email: customer.email,
          companyName: customer.companyName,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching limitless history',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const getLimitlessHistoryByTraveller = async (req: Request, res: Response): Promise<void> => {
  try {
    const { travellerId } = req.params;
    const {
      status,
      startDate,
      endDate,
      travelStartDate,
      travelEndDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
    } = req.query;

    if (!mongoose.Types.ObjectId.isValid(travellerId)) {
      res.status(400).json({ success: false, message: 'Invalid traveller ID' });
      return;
    }

    const traveller = await Traveller.findById(travellerId);
    if (!traveller) {
      res.status(404).json({ success: false, message: 'Traveller not found' });
      return;
    }

    if (
      req.user?.userType !== 'super_admin' &&
      traveller.businessId.toString() !== req.user?.businessInfo?.businessId?.toString()
    ) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: Cannot access traveller from other business',
      });
      return;
    }

    const filter: any = {
      businessId: traveller.businessId,
      isDeleted: { $ne: true },
      $or: [
        { adultTravelers: { $in: [travellerId] } },
        { 'childTravelers.id': { $in: [travellerId] } },
      ],
    };

    if (status) {
      filter.status = status;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate as string);
      if (endDate) filter.createdAt.$lte = new Date(endDate as string);
    }

    if (travelStartDate || travelEndDate) {
      filter.travelDate = {};
      if (travelStartDate) filter.travelDate.$gte = new Date(travelStartDate as string);
      if (travelEndDate) filter.travelDate.$lte = new Date(travelEndDate as string);
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const sortConfig: any = {};
    sortConfig[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    const limitlessBookings = await Limitless.find(filter)
      .populate('customerId', 'name email phone companyName')
      .populate('adultTravelers', 'name email phone')
      .populate({
        path: 'childTravelers.id',
        model: 'Traveller',
        select: 'name email phone',
      })
      .populate('primaryOwner', 'name email')
      .populate('secondaryOwner', 'name email')
      .populate('businessId', 'businessName')
      .sort(sortConfig)
      .skip(skip)
      .limit(limitNum);

    const totalCount = await Limitless.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / limitNum);

    res.status(200).json({
      success: true,
      data: {
        limitless: limitlessBookings,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalCount,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
        },
        traveller: {
          _id: traveller._id,
          name: traveller.name,
          email: traveller.email,
          phone: traveller.phone,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching limitless history',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const getLimitlessHistoryByTeamMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const { teamMemberId } = req.params;
    const {
      status,
      startDate,
      endDate,
      travelStartDate,
      travelEndDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
    } = req.query;

    if (!mongoose.Types.ObjectId.isValid(teamMemberId)) {
      res.status(400).json({ success: false, message: 'Invalid team member ID' });
      return;
    }

    const teamMember = await Team.findById(teamMemberId);
    if (!teamMember) {
      res.status(404).json({ success: false, message: 'Team member not found' });
      return;
    }

    if (
      req.user?.userType !== 'super_admin' &&
      teamMember.businessId.toString() !== req.user?.businessInfo?.businessId?.toString()
    ) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: Cannot access team member from other business',
      });
      return;
    }

    const filter: any = {
      primaryOwner: teamMemberId,
      businessId: teamMember.businessId,
      isDeleted: { $ne: true },
    };

    if (status) {
      filter.status = status;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate as string);
      if (endDate) filter.createdAt.$lte = new Date(endDate as string);
    }

    if (travelStartDate || travelEndDate) {
      filter.travelDate = {};
      if (travelStartDate) filter.travelDate.$gte = new Date(travelStartDate as string);
      if (travelEndDate) filter.travelDate.$lte = new Date(travelEndDate as string);
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const sortConfig: any = {};
    sortConfig[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    const limitlessBookings = await Limitless.find(filter)
      .populate('customerId', 'name email phone companyName')
      .populate('adultTravelers', 'name email phone')
      .populate({
        path: 'childTravelers.id',
        model: 'Traveller',
        select: 'name email phone',
      })
      .populate('primaryOwner', 'name email')
      .populate('secondaryOwner', 'name email')
      .populate('businessId', 'businessName')
      .sort(sortConfig)
      .skip(skip)
      .limit(limitNum);

    const totalCount = await Limitless.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / limitNum);

    res.status(200).json({
      success: true,
      data: {
        limitless: limitlessBookings,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalCount,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
        },
        teamMember: {
          _id: teamMember._id,
          name: teamMember.name,
          email: teamMember.email,
          phone: teamMember.phone,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching limitless history',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const approveLimitless = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const filter: any = { _id: id };
    if (req.user?.userType !== 'super_admin') {
      const businessId = getBusinessIdFromRequest(req);
      if (!businessId) {
        res.status(400).json({ success: false, message: 'Business context is missing' });
        return;
      }
      filter.businessId = businessId;
    }

    const userId = getUserIdFromRequest(req);
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      res.status(401).json({ success: false, message: 'Unauthorized user' });
      return;
    }

    const limitless = await Limitless.findOne(filter).select('primaryOwner businessId');
    if (!limitless) {
      res.status(404).json({ success: false, message: 'Limitless booking not found' });
      return;
    }

    const ownerId = limitless.primaryOwner;
    if (!ownerId) {
      res.status(400).json({ success: false, message: 'Limitless owner is missing' });
      return;
    }

    const checkerGroup = await MakerCheckerGroup.findOne({
      businessId: limitless.businessId,
      type: 'booking',
      checkers: userId,
      makers: { $in: ownerId },
    }).select('_id');

    if (!checkerGroup) {
      res.status(403).json({ success: false, message: 'Not authorized to approve this booking' });
      return;
    }

    const updated = await Limitless.findOneAndUpdate(
      { _id: limitless._id },
      { serviceStatus: 'approved', remarks: reason },
      { new: true }
    );

    if (!updated) {
      res.status(404).json({ success: false, message: 'Limitless booking not found' });
      return;
    }

    res.status(200).json({ success: true, limitless: updated });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to approve limitless booking',
      error: (err as Error).message,
    });
  }
};

export const denyLimitless = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const filter: any = { _id: id };
    if (req.user?.userType !== 'super_admin') {
      const businessId = getBusinessIdFromRequest(req);
      if (!businessId) {
        res.status(400).json({ success: false, message: 'Business context is missing' });
        return;
      }
      filter.businessId = businessId;
    }

    const userId = getUserIdFromRequest(req);
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      res.status(401).json({ success: false, message: 'Unauthorized user' });
      return;
    }

    const limitless = await Limitless.findOne(filter).select('primaryOwner businessId');
    if (!limitless) {
      res.status(404).json({ success: false, message: 'Limitless booking not found' });
      return;
    }

    const ownerId = limitless.primaryOwner;
    if (!ownerId) {
      res.status(400).json({ success: false, message: 'Limitless owner is missing' });
      return;
    }

    const checkerGroup = await MakerCheckerGroup.findOne({
      businessId: limitless.businessId,
      type: 'booking',
      checkers: userId,
      makers: { $in: ownerId },
    }).select('_id');

    if (!checkerGroup) {
      res.status(403).json({ success: false, message: 'Not authorized to deny this booking' });
      return;
    }

    const updated = await Limitless.findOneAndUpdate(
      { _id: limitless._id },
      { serviceStatus: 'denied', remarks: reason },
      { new: true }
    );

    if (!updated) {
      res.status(404).json({ success: false, message: 'Limitless booking not found' });
      return;
    }

    res.status(200).json({ success: true, limitless: updated });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to deny limitless booking',
      error: (err as Error).message,
    });
  }
};
