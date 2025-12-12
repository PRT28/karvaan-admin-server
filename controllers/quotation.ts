import { Request, Response } from 'express';
import Quotation from '../models/Quotation';
import Customer from '../models/Customer';
import Vendor from '../models/Vendors';
import Traveller from '../models/Traveller';
import Team from '../models/Team';
import mongoose from 'mongoose';
import { uploadMultipleToS3, UploadedDocument } from '../utils/s3';

export const createQuotation = async (req: Request, res: Response): Promise<void> => {
  try {
    const quotationData = { ...req.body };

    console.log('📝 Creating quotation with payload:', JSON.stringify(quotationData, null, 2));

    if (quotationData.serviceStatus !== 'draft') {

      if (!quotationData.quotationType || !quotationData.channel) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: quotationType and channel are required'
      });
      return;
    }

    if (!quotationData.formFields) {
      res.status(400).json({
        success: false,
        message: 'formFields is required'
      });
      return;
    }

    if (typeof quotationData.formFields === "string") {
        quotationData.formFields = JSON.parse(quotationData.formFields);
      }

    if (typeof quotationData.travelers === "string") {
        quotationData.travelers = JSON.parse(quotationData.travelers);
      }

    if (quotationData.totalAmount === undefined || quotationData.totalAmount === null) {
      res.status(400).json({
        success: false,
        message: 'totalAmount is required'
      });
      return;
    }

    console.log()

    if (!quotationData.owner || !Array.isArray(quotationData.owner) || quotationData.owner.length === 0) {
      res.status(400).json({
        success: false,
        message: 'owner array with at least one team member ID is required'
      });
      return;
    }

    if (!quotationData.travelDate) {
      res.status(400).json({
        success: false,
        message: 'travelDate is required'
      });
      return;
    }

    // Validate and convert travelDate if provided as string
    if (typeof quotationData.travelDate === 'string') {
      const travelDate = new Date(quotationData.travelDate);
      if (isNaN(travelDate.getTime())) {
        res.status(400).json({
          success: false,
          message: 'Invalid travelDate format. Please provide a valid date.'
        });
        return;
      }
      quotationData.travelDate = travelDate;
    }

    // Ensure totalAmount is a number
    quotationData.totalAmount = Number(quotationData.totalAmount);
    if (isNaN(quotationData.totalAmount)) {
      res.status(400).json({
        success: false,
        message: 'totalAmount must be a valid number'
      });
      return;
    }
      
    }

    // Validate required fields
    

    // Add businessId to quotation data
    quotationData.businessId = req.user?.businessInfo?.businessId;

    


    // Handle document uploads if files are present
    let uploadedDocuments: UploadedDocument[] = [];
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      console.log(`📁 Uploading ${req.files.length} document(s) to S3...`);

      if (req.files.length > 3) {
        res.status(400).json({
          success: false,
          message: 'Maximum 3 documents are allowed per quotation'
        });
        return;
      }

      try {
        uploadedDocuments = await uploadMultipleToS3(
          req.files as Express.Multer.File[],
          `quotations/${req.user?.businessInfo?.businessId}`
        );
        console.log(`✅ ${uploadedDocuments.length} document(s) uploaded successfully`);
      } catch (uploadError) {
        console.error('❌ Error uploading documents to S3:', uploadError);
        res.status(500).json({
          success: false,
          message: 'Failed to upload documents',
          error: (uploadError as Error).message
        });
        return;
      }
    }

    // Add documents to quotation data
    quotationData.documents = uploadedDocuments;

    const newQuotation = new Quotation(quotationData);
    await newQuotation.save();

    console.log('✅ Quotation created successfully:', newQuotation.customId);

    res.status(201).json({ success: true, quotation: newQuotation });
  } catch (err) {
    console.error('❌ Error creating quotation:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to create quotation',
      error: (err as Error).message
    });
  }
};

export const updateQuotation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Build filter based on user type
    const filter: any = { _id: id };
    if (req.user?.userType !== 'super_admin') {
      filter.businessId = req.user?.businessInfo?.businessId;
    }

    // Don't allow updating businessId through this endpoint
    const updateData = { ...req.body };
    delete updateData.businessId;

    const updated = await Quotation.findOneAndUpdate(filter, updateData, { new: true })
      .populate('businessId')
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
    const filter: any = { _id: id, isDeleted: false };
    if (req.user?.userType !== 'super_admin') {
      filter.businessId = req.user?.businessInfo?.businessId;
    }

    // Soft delete - set isDeleted to true instead of removing the document
    const deleted = await Quotation.findOneAndUpdate(
      filter,
      { isDeleted: true },
      { new: true }
    );

    if (!deleted) {
      res.status(404).json({ success: false, message: 'Quotation not found' });
      return;
    }
    res.status(200).json({ success: true, message: 'Quotation deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete quotation', error: (err as Error).message });
  }
};

export const getAllQuotations = async (req: Request, res: Response) => {
  try {
    const { bookingStartDate, bookingEndDate, travelStartDate, travelEndDate, owner, isDeleted, serviceStatus } = req.query;

    // Build business filter - exclude deleted quotations by default
    const businessFilter: any = {};

    console.log(req.user);
    if (req.user?.userType !== 'super_admin') {
      businessFilter.businessId = req.user?.businessInfo?.businessId;
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

    if (serviceStatus) {
      query.serviceStatus = serviceStatus;
    }

    // Get quotations with population
    const quotations = await Quotation.find({...query, isDeleted: isDeleted === 'true' ? true : false})
      .populate({
        path: 'businessId',
        select: 'businessName businessType',
      })
      .populate('customerId', 'name email phone companyName')
      .populate('vendorId', 'companyName contactPerson email phone')
      .populate('travelers', 'name email phone')
      .populate('owner', 'name email')
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

    // Exclude deleted quotations
    const quotation = await Quotation.findOne({ _id: id, isDeleted: { $ne: true } }).populate('businessId');

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

    // Query by businessId, not id
    const quotations = await Quotation.find({ businessId: id }).populate('businessId').sort({ createdAt: -1 });

    res.status(200).json({ success: true, quotations });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch quotations', error: (err as Error).message });
  }
};

// Get booking history by customer ID
export const getBookingHistoryByCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { customerId } = req.params;
    const {
      status,
      quotationType,
      startDate,
      endDate,
      travelStartDate,
      travelEndDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    // Validate customer ID
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid customer ID'
      });
      return;
    }

    // Verify customer exists and belongs to user's business
    const customer = await Customer.findById(customerId);
    if (!customer) {
      res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
      return;
    }

    console.log(req.user, 'User')

    // Check business access
    if (req.user?.userType !== 'super_admin' && customer.businessId.toString() !== req.user?.businessInfo?.businessId?.toString()) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: Cannot access customer from other business'
      });
      return;
    }

    // Build query filter - exclude deleted quotations
    const filter: any = {
      customerId: customerId,
      businessId: customer.businessId,
      isDeleted: { $ne: true }
    };

    // Add optional filters
    if (status) {
      filter.status = status;
    }

    if (quotationType) {
      filter.quotationType = quotationType;
    }

    // Date filters for booking date (createdAt)
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate as string);
      if (endDate) filter.createdAt.$lte = new Date(endDate as string);
    }

    // Date filters for travel date
    if (travelStartDate || travelEndDate) {
      filter.travelDate = {};
      if (travelStartDate) filter.travelDate.$gte = new Date(travelStartDate as string);
      if (travelEndDate) filter.travelDate.$lte = new Date(travelEndDate as string);
    }

    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Sort configuration
    const sortConfig: any = {};
    sortConfig[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    // Get quotations with population
    const quotations = await Quotation.find(filter)
      .populate('customerId', 'name email phone companyName')
      .populate('vendorId', 'companyName contactPerson email phone')
      .populate('travelers', 'name email phone')
      .populate('owner', 'name email')
      .populate('businessId', 'businessName')
      .sort(sortConfig)
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const totalCount = await Quotation.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / limitNum);

    res.status(200).json({
      success: true,
      data: {
        quotations,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalCount,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        },
        customer: {
          _id: customer._id,
          name: customer.name,
          email: customer.email,
          companyName: customer.companyName
        }
      }
    });

  } catch (error) {
    console.error('Error fetching booking history by customer:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching booking history',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get booking history by vendor ID
export const getBookingHistoryByVendor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { vendorId } = req.params;
    const {
      status,
      quotationType,
      startDate,
      endDate,
      travelStartDate,
      travelEndDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    // Validate vendor ID
    if (!mongoose.Types.ObjectId.isValid(vendorId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid vendor ID'
      });
      return;
    }

    // Verify vendor exists and belongs to user's business
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
      return;
    }

    // Check business access
    if (req.user?.userType !== 'super_admin' && vendor.businessId.toString() !== req.user?.businessInfo?.businessId?.toString()) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: Cannot access vendor from other business'
      });
      return;
    }

    // Build query filter - exclude deleted quotations
    const filter: any = {
      vendorId: vendorId,
      businessId: vendor.businessId,
      isDeleted: { $ne: true }
    };

    // Add optional filters
    if (status) {
      filter.status = status;
    }

    if (quotationType) {
      filter.quotationType = quotationType;
    }

    // Date filters for booking date (createdAt)
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate as string);
      if (endDate) filter.createdAt.$lte = new Date(endDate as string);
    }

    // Date filters for travel date
    if (travelStartDate || travelEndDate) {
      filter.travelDate = {};
      if (travelStartDate) filter.travelDate.$gte = new Date(travelStartDate as string);
      if (travelEndDate) filter.travelDate.$lte = new Date(travelEndDate as string);
    }

    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Sort configuration
    const sortConfig: any = {};
    sortConfig[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    // Get quotations with population
    const quotations = await Quotation.find(filter)
      .populate('customerId', 'name email phone companyName')
      .populate('vendorId', 'companyName contactPerson email phone')
      .populate('travelers', 'name email phone')
      .populate('owner', 'name email')
      .populate('businessId', 'businessName')
      .sort(sortConfig)
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const totalCount = await Quotation.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / limitNum);

    res.status(200).json({
      success: true,
      data: {
        quotations,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalCount,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        },
        vendor: {
          _id: vendor._id,
          companyName: vendor.companyName,
          contactPerson: vendor.contactPerson,
          email: vendor.email
        }
      }
    });

  } catch (error) {
    console.error('Error fetching booking history by vendor:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching booking history',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get booking history by traveller ID
export const getBookingHistoryByTraveller = async (req: Request, res: Response): Promise<void> => {
  try {
    const { travellerId } = req.params;
    const {
      status,
      quotationType,
      startDate,
      endDate,
      travelStartDate,
      travelEndDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    // Validate traveller ID
    if (!mongoose.Types.ObjectId.isValid(travellerId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid traveller ID'
      });
      return;
    }

    // Verify traveller exists and belongs to user's business
    const traveller = await Traveller.findById(travellerId);
    if (!traveller) {
      res.status(404).json({
        success: false,
        message: 'Traveller not found'
      });
      return;
    }

    // Check business access
    if (req.user?.userType !== 'super_admin' && traveller.businessId.toString() !== req.user?.businessInfo?.businessId?.toString()) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: Cannot access traveller from other business'
      });
      return;
    }

    // Build query filter - search in travelers array, exclude deleted quotations
    const filter: any = {
      travelers: { $in: [travellerId] },
      businessId: traveller.businessId,
      isDeleted: { $ne: true }
    };

    // Add optional filters
    if (status) {
      filter.status = status;
    }

    if (quotationType) {
      filter.quotationType = quotationType;
    }

    // Date filters for booking date (createdAt)
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate as string);
      if (endDate) filter.createdAt.$lte = new Date(endDate as string);
    }

    // Date filters for travel date
    if (travelStartDate || travelEndDate) {
      filter.travelDate = {};
      if (travelStartDate) filter.travelDate.$gte = new Date(travelStartDate as string);
      if (travelEndDate) filter.travelDate.$lte = new Date(travelEndDate as string);
    }

    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Sort configuration
    const sortConfig: any = {};
    sortConfig[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    // Get quotations with population
    const quotations = await Quotation.find(filter)
      .populate('customerId', 'name email phone companyName')
      .populate('vendorId', 'companyName contactPerson email phone')
      .populate('travelers', 'name email phone')
      .populate('owner', 'name email')
      .populate('businessId', 'businessName')
      .sort(sortConfig)
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const totalCount = await Quotation.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / limitNum);

    res.status(200).json({
      success: true,
      data: {
        quotations,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalCount,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        },
        traveller: {
          _id: traveller._id,
          name: traveller.name,
          email: traveller.email,
          phone: traveller.phone
        }
      }
    });

  } catch (error) {
    console.error('Error fetching booking history by traveller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching booking history',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get booking history by team member ID (owner)
export const getBookingHistoryByTeamMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const { teamMemberId } = req.params;
    const {
      status,
      quotationType,
      startDate,
      endDate,
      travelStartDate,
      travelEndDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    // Validate team member ID
    if (!mongoose.Types.ObjectId.isValid(teamMemberId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid team member ID'
      });
      return;
    }

    // Verify team member exists and belongs to user's business
    const teamMember = await Team.findById(teamMemberId);
    if (!teamMember) {
      res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
      return;
    }

    // Check business access
    if (req.user?.userType !== 'super_admin' && teamMember.businessId.toString() !== req.user?.businessInfo?.businessId?.toString()) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: Cannot access team member from other business'
      });
      return;
    }

    // Build query filter - search for quotations where this team member is in the owner array, exclude deleted
    const filter: any = {
      owner: teamMemberId,
      businessId: teamMember.businessId,
      isDeleted: { $ne: true }
    };

    // Add optional filters
    if (status) {
      filter.status = status;
    }

    if (quotationType) {
      filter.quotationType = quotationType;
    }

    // Date filters for booking date (createdAt)
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate as string);
      if (endDate) filter.createdAt.$lte = new Date(endDate as string);
    }

    // Date filters for travel date
    if (travelStartDate || travelEndDate) {
      filter.travelDate = {};
      if (travelStartDate) filter.travelDate.$gte = new Date(travelStartDate as string);
      if (travelEndDate) filter.travelDate.$lte = new Date(travelEndDate as string);
    }

    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Sort configuration
    const sortConfig: any = {};
    sortConfig[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    // Get quotations with population
    const quotations = await Quotation.find(filter)
      .populate('customerId', 'name email phone companyName')
      .populate('vendorId', 'companyName contactPerson email phone')
      .populate('travelers', 'name email phone')
      .populate('owner', 'name email')
      .populate('businessId', 'businessName')
      .sort(sortConfig)
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const totalCount = await Quotation.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / limitNum);

    res.status(200).json({
      success: true,
      data: {
        quotations,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalCount,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        },
        teamMember: {
          _id: teamMember._id,
          name: teamMember.name,
          email: teamMember.email,
          phone: teamMember.phone
        }
      }
    });

  } catch (error) {
    console.error('Error fetching booking history by team member:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching booking history',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
