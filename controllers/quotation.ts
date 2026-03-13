import { Request, Response } from 'express';
import Quotation, {
  getCustomerPricingValidationError,
  getMissingFormFieldKeys,
  getPriceInfoValidationError
} from '../models/Quotation';
import Customer from '../models/Customer';
import Vendor from '../models/Vendors';
import Traveller from '../models/Traveller';
import Team from '../models/Team';
import mongoose from 'mongoose';
import Payments from '../models/Payments';
import Logs from '../models/Logs';
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

const normalizeObjectId = (value: unknown) => {
  if (!value) return value;
  if (value instanceof mongoose.Types.ObjectId) return value;
  if (mongoose.isValidObjectId(String(value))) {
    return new mongoose.Types.ObjectId(String(value));
  }
  return value;
};

const hasCustomers = (quotation: any): boolean => {
  if (Array.isArray(quotation.customerId)) return quotation.customerId.length > 0;
  return Boolean(quotation.customerId);
};

const normalizeCustomerIdsInput = (value: unknown): unknown[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return [value];
};

const getQuotationAmountForParty = (
  quotation: any,
  party: 'customer' | 'vendor',
  customerId?: mongoose.Types.ObjectId | string
) => {
  const baseAmount = Number(quotation.totalAmount ?? 0);
  if (party === 'customer') {
    const customerPricing = Array.isArray(quotation.customerPricing) ? quotation.customerPricing : [];
    if (customerPricing.length > 0) {
      if (customerId) {
        const matched = customerPricing.find((entry: any) =>
          String(entry?.customerId) === String(customerId)
        );
        if (matched) {
          const matchedAmount = Number(matched.sellingPrice);
          if (!Number.isNaN(matchedAmount)) return matchedAmount;
        }
      }

      const summedAmount = customerPricing.reduce(
        (sum: number, entry: any) => sum + (Number(entry?.sellingPrice) || 0),
        0
      );
      if (!Number.isNaN(summedAmount) && summedAmount > 0) {
        return summedAmount;
      }
    }

    const priceInfo: any = quotation.priceInfo;
    if (priceInfo) {
      const directSelling = priceInfo instanceof Map ? priceInfo.get('sellingPrice') : priceInfo?.sellingPrice;
      const parsedSelling = Number(directSelling);
      if (!Number.isNaN(parsedSelling)) {
        return parsedSelling;
      }
    }

    return baseAmount;
  }

  const priceInfo: any = quotation.priceInfo;
  if (priceInfo) {
    const directCost = priceInfo instanceof Map ? priceInfo.get('costPrice') : priceInfo?.costPrice;
    const parsedCost = Number(directCost);
    if (!Number.isNaN(parsedCost)) {
      return parsedCost;
    }
  }

  const formFields: any = quotation.formFields;
  if (!formFields) return baseAmount;

  const candidateKeys = ['costAmount', 'costprice', 'vendorCost', 'purchaseAmount'];
  for (const key of candidateKeys) {
    const rawValue = formFields instanceof Map ? formFields.get(key) : formFields?.[key];
    if (rawValue === undefined || rawValue === null) continue;
    const numericValue = Number(rawValue);
    if (!Number.isNaN(numericValue)) {
      return numericValue;
    }
  }

  return baseAmount;
};

const hasValue = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return !Number.isNaN(value);
  if (typeof value === 'boolean') return true;
  if (value instanceof Date) return !Number.isNaN(value.getTime());
  if (value instanceof mongoose.Types.ObjectId) return true;
  if (Array.isArray(value)) return value.length > 0 && value.some((item) => hasValue(item));
  if (value instanceof Map) {
    if (value.size === 0) return false;
    return Array.from(value.values()).some((item) => hasValue(item));
  }
  if (typeof value === 'object') {
    if ('_id' in value) return hasValue((value as any)._id);
    const entries = Object.entries(value);
    if (entries.length === 0) return false;
    return entries.some(([, item]) => hasValue(item));
  }
  return true;
};

const isBookingDataComplete = (quotation: any): boolean => {
  const requiredTopLevelFields = [
    quotation.quotationType,
    quotation.travelDate,
    quotation.totalAmount,
    quotation.primaryOwner,
    quotation.customerId
  ];

  const areRequiredTopLevelFieldsPresent = requiredTopLevelFields.every((field) => hasValue(field));
  const areFormFieldsComplete = hasValue(quotation.formFields);
  const hasAnyTraveller =
    (Array.isArray(quotation.adultTravelers) && quotation.adultTravelers.length > 0) ||
    (Array.isArray(quotation.childTravelers) && quotation.childTravelers.length > 0);

  return areRequiredTopLevelFieldsPresent && areFormFieldsComplete && hasAnyTraveller;
};

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

    if (quotationData.totalAmount === undefined || quotationData.totalAmount === null) {
      res.status(400).json({
        success: false,
        message: 'totalAmount is required'
      });
      return;
    }

    console.log(typeof quotationData.formFields, typeof quotationData.travellers, quotationData)

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

      // formFields
    if (typeof quotationData.formFields === "string") {
      quotationData.formFields = JSON.parse(quotationData.formFields);
    }
    if (typeof quotationData.customerId === 'string') {
      const trimmedValue = quotationData.customerId.trim();
      if (trimmedValue.startsWith('[')) {
        try {
          quotationData.customerId = JSON.parse(trimmedValue);
        } catch (error) {
          res.status(400).json({
            success: false,
            message: 'Invalid customerId JSON format'
          });
          return;
        }
      } else {
        quotationData.customerId = [trimmedValue];
      }
    } else if (quotationData.customerId !== undefined) {
      quotationData.customerId = normalizeCustomerIdsInput(quotationData.customerId);
    }
    if (typeof quotationData.customerPricing === 'string') {
      quotationData.customerPricing = JSON.parse(quotationData.customerPricing);
    }
    if (typeof quotationData.priceInfo === 'string') {
      quotationData.priceInfo = JSON.parse(quotationData.priceInfo);
    }

    const missingCreateFields = getMissingFormFieldKeys(
      quotationData.quotationType,
      quotationData.formFields
    );
    if (missingCreateFields.length > 0) {
      res.status(400).json({
        success: false,
        message: `Missing required formFields for type "${quotationData.quotationType}": ${missingCreateFields.join(', ')}`
      });
      return;
    }

    const priceInfoError = getPriceInfoValidationError(quotationData.priceInfo);
    if (priceInfoError) {
      res.status(400).json({
        success: false,
        message: priceInfoError
      });
      return;
    }

    const customerPricingError = getCustomerPricingValidationError(
      quotationData.customerId,
      quotationData.customerPricing
    );
    if (customerPricingError) {
      res.status(400).json({
        success: false,
        message: customerPricingError
      });
      return;
    }

    // secondaryOwner
    if (typeof quotationData.secondaryOwner === "string") {
      quotationData.secondaryOwner = JSON.parse(quotationData.secondaryOwner);
    }

    // adultTravelers
    if (typeof quotationData.adultTravelers === "string") {
      quotationData.adultTravelers = JSON.parse(quotationData.adultTravelers);
    }

    // childTravelers
    if (typeof quotationData.childTravelers === "string") {
      quotationData.childTravelers = JSON.parse(quotationData.childTravelers);
    }

    

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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid quotation ID' });
      return;
    }

    // Build filter based on user type
    const filter: any = { _id: id };
    if (req.user?.userType !== 'super_admin') {
      const businessId = getBusinessIdFromRequest(req);
      if (!businessId) {
        res.status(403).json({ success: false, message: 'Business context missing' });
        return;
      }
      filter.businessId = businessId;
    }

    // Don't allow updating businessId through this endpoint
    const updateData = { ...req.body };
    delete updateData.businessId;
    delete updateData.customId;

    const parseJsonField = (field: keyof typeof updateData, label: string) => {
      if (typeof updateData[field] === 'string') {
        try {
          updateData[field] = JSON.parse(updateData[field] as string);
        } catch (error) {
          res.status(400).json({
            success: false,
            message: `Invalid ${label} JSON format`
          });
          return false;
        }
      }
      return true;
    };

    if (!parseJsonField('formFields', 'formFields')) return;
    if (!parseJsonField('priceInfo', 'priceInfo')) return;
    if (!parseJsonField('customerPricing', 'customerPricing')) return;
    if (!parseJsonField('secondaryOwner', 'secondaryOwner')) return;
    if (!parseJsonField('adultTravelers', 'adultTravelers')) return;
    if (!parseJsonField('childTravelers', 'childTravelers')) return;
    if (!parseJsonField('documents', 'documents')) return;

    if (typeof updateData.travelDate === 'string') {
      const travelDate = new Date(updateData.travelDate);
      if (isNaN(travelDate.getTime())) {
        res.status(400).json({
          success: false,
          message: 'Invalid travelDate format. Please provide a valid date.'
        });
        return;
      }
      updateData.travelDate = travelDate;
    }

    if (updateData.totalAmount !== undefined && updateData.totalAmount !== null) {
      updateData.totalAmount = Number(updateData.totalAmount);
      if (isNaN(updateData.totalAmount)) {
        res.status(400).json({
          success: false,
          message: 'totalAmount must be a valid number'
        });
        return;
      }
    }

    if (typeof updateData.customerId === 'string') {
      const trimmedCustomerId = updateData.customerId.trim();
      if (trimmedCustomerId.startsWith('[')) {
        try {
          updateData.customerId = JSON.parse(trimmedCustomerId);
        } catch (error) {
          res.status(400).json({
            success: false,
            message: 'Invalid customerId JSON format'
          });
          return;
        }
      } else {
        updateData.customerId = [trimmedCustomerId];
      }
    } else if (updateData.customerId !== undefined) {
      updateData.customerId = normalizeCustomerIdsInput(updateData.customerId);
    }

    if (
      Object.prototype.hasOwnProperty.call(updateData, 'quotationType') ||
      Object.prototype.hasOwnProperty.call(updateData, 'formFields')
    ) {
      const existingQuotationForValidation = await Quotation.findOne(filter).select('quotationType formFields');
      if (!existingQuotationForValidation) {
        res.status(404).json({ success: false, message: 'Quotation not found' });
        return;
      }

      const effectiveQuotationType =
        (updateData.quotationType as string | undefined) ?? existingQuotationForValidation.quotationType;
      const effectiveFormFields =
        Object.prototype.hasOwnProperty.call(updateData, 'formFields')
          ? updateData.formFields
          : existingQuotationForValidation.formFields;

      const missingUpdateFields = getMissingFormFieldKeys(effectiveQuotationType, effectiveFormFields);
      if (missingUpdateFields.length > 0) {
        res.status(400).json({
          success: false,
          message: `Missing required formFields for type "${effectiveQuotationType}": ${missingUpdateFields.join(', ')}`
        });
        return;
      }
    }

    if (Object.prototype.hasOwnProperty.call(updateData, 'priceInfo')) {
      const priceInfoError = getPriceInfoValidationError(updateData.priceInfo);
      if (priceInfoError) {
        res.status(400).json({
          success: false,
          message: priceInfoError
        });
        return;
      }
    }

    if (
      Object.prototype.hasOwnProperty.call(updateData, 'customerId') ||
      Object.prototype.hasOwnProperty.call(updateData, 'customerPricing')
    ) {
      const existingQuotationForCustomerPricing = await Quotation.findOne(filter).select('customerId customerPricing');
      if (!existingQuotationForCustomerPricing) {
        res.status(404).json({ success: false, message: 'Quotation not found' });
        return;
      }

      const effectiveCustomerIds =
        Object.prototype.hasOwnProperty.call(updateData, 'customerId')
          ? updateData.customerId
          : existingQuotationForCustomerPricing.customerId;
      const effectiveCustomerPricing =
        Object.prototype.hasOwnProperty.call(updateData, 'customerPricing')
          ? updateData.customerPricing
          : existingQuotationForCustomerPricing.customerPricing;

      const customerPricingError = getCustomerPricingValidationError(
        effectiveCustomerIds,
        effectiveCustomerPricing
      );
      if (customerPricingError) {
        res.status(400).json({
          success: false,
          message: customerPricingError
        });
        return;
      }
    }

    const hasDocumentsInBody = Object.prototype.hasOwnProperty.call(updateData, 'documents');
    let existingDocuments = Array.isArray(updateData.documents) ? updateData.documents : [];

    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const businessIdForUploads = getBusinessIdFromRequest(req);
      if (!hasDocumentsInBody) {
        const existingQuotation = await Quotation.findOne(filter).select('documents');
        if (!existingQuotation) {
          res.status(404).json({ success: false, message: 'Quotation not found' });
          return;
        }
        existingDocuments = existingQuotation.documents || [];
      }

      if (req.files.length + existingDocuments.length > 3) {
        res.status(400).json({
          success: false,
          message: 'Maximum 3 documents are allowed per quotation'
        });
        return;
      }

      const uploadedDocuments = await uploadMultipleToS3(
        req.files as Express.Multer.File[],
        `quotations/${businessIdForUploads ?? 'unknown-business'}`
      );

      updateData.documents = [...existingDocuments, ...uploadedDocuments];
    }

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
    const { bookingStartDate, bookingEndDate, travelStartDate, travelEndDate, primaryOwner, secondaryOwner, isDeleted, serviceStatus } = req.query;

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

    // Get quotations with population
    const quotations = await Quotation.find({...query, isDeleted: isDeleted === 'true' ? true : false})
      .populate({
        path: 'businessId',
        select: 'businessName businessType',
      })
      .populate('customerId', 'name email phone companyName')
      .populate('vendorId', 'companyName contactPerson email phone')
      .populate('adultTravelers', 'name email phone')
      .populate({
        path: "childTravelers.id",
        model: "Traveller",
        select: "name email phone",
      })
      .populate('primaryOwner', 'name email')
      .populate('secondaryOwner', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    const quotationIds = quotations
      .map((quotation) => quotation?._id)
      .filter((id) => mongoose.isValidObjectId(String(id)))
      .map((id) => new mongoose.Types.ObjectId(String(id)));

    const paymentBaseMatch: any = { isDeleted: { $ne: true } };
    if (businessFilter.businessId) {
      paymentBaseMatch.businessId = normalizeObjectId(businessFilter.businessId);
    }

    const [customerAllocations, vendorAllocations, taskCounts] = await Promise.all([
      Payments.aggregate([
        { $match: { ...paymentBaseMatch, party: 'Customer' } },
        { $unwind: '$allocations' },
        { $match: { 'allocations.quotationId': { $in: quotationIds } } },
        { $group: { _id: '$allocations.quotationId', totalAllocated: { $sum: '$allocations.amount' } } }
      ]),
      Payments.aggregate([
        { $match: { ...paymentBaseMatch, party: 'Vendor' } },
        { $unwind: '$allocations' },
        { $match: { 'allocations.quotationId': { $in: quotationIds } } },
        { $group: { _id: '$allocations.quotationId', totalAllocated: { $sum: '$allocations.amount' } } }
      ]),
      Logs.aggregate([
        { $match: { bookingId: { $in: quotationIds } } },
        { $group: { _id: '$bookingId', taskCount: { $sum: 1 } } }
      ])
    ]);

    const customerAllocationMap = new Map<string, number>();
    customerAllocations.forEach((item) => {
      customerAllocationMap.set(String(item._id), Number(item.totalAllocated || 0));
    });

    const vendorAllocationMap = new Map<string, number>();
    vendorAllocations.forEach((item) => {
      vendorAllocationMap.set(String(item._id), Number(item.totalAllocated || 0));
    });

    const taskCountMap = new Map<string, number>();
    taskCounts.forEach((item) => {
      taskCountMap.set(String(item._id), Number(item.taskCount || 0));
    });

    const getPaymentStatus = (allocated: number, total: number) => {
      if (total <= 0) return 'pending';
      if (allocated <= 0) return 'pending';
      if (allocated >= total) return 'paid';
      return 'partially paid';
    };

    const quotationsWithPayments = quotations.map((quotation) => {
      const quotationId = String(quotation._id);
      const customerExists = hasCustomers(quotation);
      const customerAmount = customerExists ? getQuotationAmountForParty(quotation, 'customer') : 0;
      const vendorAmount = quotation.vendorId ? getQuotationAmountForParty(quotation, 'vendor') : 0;
      const customerAllocated = customerAllocationMap.get(quotationId) || 0;
      const vendorAllocated = vendorAllocationMap.get(quotationId) || 0;
      const customerRemainingAmount = Math.max(customerAmount - customerAllocated, 0);
      const vendorRemainingAmount = Math.max(vendorAmount - vendorAllocated, 0);

      return {
        ...quotation,
        taskCount: taskCountMap.get(quotationId) || 0,
        customerPaymentDone: customerExists && customerAllocated >= customerAmount,
        vendorPaymentDone: Boolean(quotation.vendorId) && vendorAllocated >= vendorAmount,
        customerRemainingAmount,
        vendorRemainingAmount,
        isBookingDataComplete: isBookingDataComplete(quotation),
        customerPaymentStatus: customerExists ? getPaymentStatus(customerAllocated, customerAmount) : 'not_applicable',
        vendorPaymentStatus: quotation.vendorId ? getPaymentStatus(vendorAllocated, vendorAmount) : 'not_applicable'
      };
    });

    res.status(200).json({ success: true, quotations: quotationsWithPayments });
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
      .populate('adultTravelers', 'name email phone')
      .populate({
        path: "childTravelers.id",
        model: "Traveller",
        select: "name email phone",
      })
      .populate('primaryOwner', 'name email')
      .populate('secondaryOwner', 'name email')
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
      .populate('adultTravelers', 'name email phone')
      .populate({
        path: "childTravelers.id",
        model: "Traveller",
        select: "name email phone",
      })
      .populate('primaryOwner', 'name email')
      .populate('secondaryOwner', 'name email')
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

    // Build query filter against current traveller fields, exclude deleted quotations
    const filter: any = {
      businessId: traveller.businessId,
      isDeleted: { $ne: true },
      $or: [
        { adultTravelers: { $in: [travellerId] } },
        { 'childTravelers.id': travellerId }
      ]
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
      .populate('adultTravelers', 'name email phone')
      .populate({
        path: "childTravelers.id",
        model: "Traveller",
        select: "name email phone",
      })
      .populate('primaryOwner', 'name email')
      .populate('secondaryOwner', 'name email')
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
      primaryOwner: teamMemberId,
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
      .populate('adultTravelers', 'name email phone')
      .populate({
        path: "childTravelers.id",
        model: "Traveller",
        select: "name email phone",
      })
      .populate('primaryOwner', 'name email')
      .populate('secondaryOwner', 'name email')
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


export const approveQuotation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Build filter based on user type
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

    console.log(req.user, 'User')

    const quotation = await Quotation.findOne(filter).select('primaryOwner businessId');
    if (!quotation) {
      res.status(404).json({ success: false, message: 'Quotation not found' });
      return;
    }

    console.log(quotation, 'Quotation')

    const ownerId = quotation.primaryOwner;
    if (!ownerId) {
      res.status(400).json({ success: false, message: 'Quotation owner is missing' });
      return;
    }

    console.log(quotation.businessId, 'Business ID')

    const checkerGroup = await MakerCheckerGroup.findOne({
      businessId: quotation.businessId,
      type: 'booking',
      checkers: userId,
      makers: { $in: ownerId },
    }).select('_id');

    console.log(checkerGroup, 'Checker Group')

    if (!checkerGroup) {
      res.status(403).json({ success: false, message: 'Not authorized to approve this quotation' });
      return;
    }

    const updated = await Quotation.findOneAndUpdate(
      { _id: quotation._id },
      { serviceStatus: 'approved', remarks: reason },
      { new: true }
    );

    if (!updated) {
      res.status(404).json({ success: false, message: 'Quotation not found' });
      return;
    }

    res.status(200).json({ success: true, quotation: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to approve quotation', error: (err as Error).message });
  }
};

export const denyQuotation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Build filter based on user type
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

    const quotation = await Quotation.findOne(filter).select('primaryOwner businessId');
    if (!quotation) {
      res.status(404).json({ success: false, message: 'Quotation not found' });
      return;
    }

   const ownerId = quotation.primaryOwner;
    if (!ownerId) {
      res.status(400).json({ success: false, message: 'Quotation owner is missing' });
      return;
    }

    const checkerGroup = await MakerCheckerGroup.findOne({
      businessId: quotation.businessId,
      type: 'booking',
      checkers: userId,
      makers: { $in: ownerId },
    }).select('_id');

    if (!checkerGroup) {
      res.status(403).json({ success: false, message: 'Not authorized to deny this quotation' });
      return;
    }

    const updated = await Quotation.findOneAndUpdate(
      { _id: quotation._id },
      { serviceStatus: 'denied', remarks: reason },
      { new: true }
    );

    if (!updated) {
      res.status(404).json({ success: false, message: 'Quotation not found' });
      return;
    }

    res.status(200).json({ success: true, quotation: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to deny quotation', error: (err as Error).message });
  }
};
