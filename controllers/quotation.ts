import { Request, Response } from 'express';
import Quotation, {
  getCustomerPricingValidationError,
  getFormFieldsValidationError,
  getMissingFormFieldKeys,
  getPriceInfoValidationError,
  getQuotationPricingSummary
} from '../models/Quotation';
import Customer from '../models/Customer';
import Vendor from '../models/Vendors';
import Traveller from '../models/Traveller';
import Team from '../models/Team';
import mongoose from 'mongoose';
import Payments from '../models/Payments';
import Logs from '../models/Logs';
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
  const pricingSummary = getQuotationPricingSummary(
    (quotation?.status as any) ?? 'confirmed',
    quotation?.priceInfo,
    quotation?.customerPricing
  );

  if (party === 'customer') {
    const customerBreakdown = Array.isArray(pricingSummary.customerBreakdown)
      ? pricingSummary.customerBreakdown
      : [];
    if (customerBreakdown.length > 0) {
      if (customerId) {
        const matched = customerBreakdown.find((entry: any) =>
          String(entry?.customerId) === String(customerId)
        );
        if (matched) {
          const matchedAmount = Number(matched.newSellingPrice);
          if (!Number.isNaN(matchedAmount)) return matchedAmount;
        }
      }

      const summedAmount = customerBreakdown.reduce(
        (sum: number, entry: any) => sum + (Number(entry?.newSellingPrice) || 0),
        0
      );
      if (!Number.isNaN(summedAmount) && summedAmount > 0) {
        return summedAmount;
      }
    }

    if (Number.isFinite(pricingSummary.customerReceivableAmount)) {
      return pricingSummary.customerReceivableAmount;
    }

    return baseAmount;
  }

  if (Number.isFinite(pricingSummary.vendorPayableAmount)) {
    return pricingSummary.vendorPayableAmount;
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

const hasNonNegativeNumber = (value: unknown): boolean => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) && parsedValue >= 0;
};

const hasNonNegativePriceInfoValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'object' && 'amount' in (value as Record<string, unknown>)) {
    return hasNonNegativeNumber((value as Record<string, unknown>).amount);
  }
  return hasNonNegativeNumber(value);
};

const isDraftServiceStatus = (serviceStatus: unknown): boolean => serviceStatus === 'draft';

const getPriceInfoObject = (quotation: any): Record<string, any> => {
  if (!quotation?.priceInfo) return {};
  if (quotation.priceInfo instanceof Map) {
    return Object.fromEntries(quotation.priceInfo.entries());
  }
  return quotation.priceInfo;
};

const getBookingDateValue = (quotation: any) => {
  return quotation.bookingDate;
};

const getPricingSummary = (quotation: any) => {
  return getQuotationPricingSummary(
    (quotation?.status as any) ?? 'confirmed',
    quotation?.priceInfo,
    quotation?.customerPricing
  );
};

const parseDateValue = (value: unknown, fieldName: string): Date | null => {
  if (value === undefined || value === null || value === '') return null;

  const parsedDate = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error(`Invalid ${fieldName} format. Please provide a valid date.`);
  }

  return parsedDate;
};

const parseNumberValue = (value: unknown, fieldName: string): number | undefined => {
  if (value === undefined || value === null || value === '') return undefined;

  const parsedValue = Number(value);
  if (Number.isNaN(parsedValue)) {
    throw new Error(`${fieldName} must be a valid number`);
  }

  return parsedValue;
};

const getQuotationStateValidationError = (quotation: any): string | null => {
  const status = quotation?.status;

  if (status && !['confirmed', 'cancelled', 'rescheduled'].includes(String(status))) {
    return 'status must be one of: confirmed, cancelled, rescheduled';
  }

  if (status === 'cancelled' && !hasValue(quotation?.cancellationDate)) {
    return 'cancellationDate is required when status is cancelled';
  }

  if (status === 'rescheduled') {
    if (!hasValue(quotation?.newBookingDate)) {
      return 'newBookingDate is required when status is rescheduled';
    }
    if (!hasValue(quotation?.newTravelDate)) {
      return 'newTravelDate is required when status is rescheduled';
    }
  }

  const formFieldsError = getFormFieldsValidationError(quotation?.quotationType, quotation?.formFields);
  if (formFieldsError) return formFieldsError;

  return null;
};

const getMandatoryBookingFields = (quotation: any): string[] => {
  const missingFields: string[] = [];

  if (!hasValue(quotation.quotationType)) missingFields.push('quotationType');
  if (!hasValue(quotation.channel)) missingFields.push('channel');
  if (!hasValue(quotation.formFields)) missingFields.push('formFields');
  if (!hasNonNegativeNumber(quotation.adultNumber)) missingFields.push('adultNumber');
  if (!hasNonNegativeNumber(quotation.childNumber)) missingFields.push('childNumber');
  if (!hasValue(quotation.primaryOwner)) missingFields.push('primaryOwner');
  if (!hasValue(quotation.status)) missingFields.push('status');
  if (!hasValue(getBookingDateValue(quotation))) missingFields.push('bookingDate');

  return missingFields;
};


const getSemiMandatoryBookingFields = (quotation: any): string[] => {
  const missingFields: string[] = [];
  const priceInfo = getPriceInfoObject(quotation);
  const status = String(quotation?.status ?? 'confirmed');
  const advancedPricing = priceInfo.advancedPricing === true;

  if (!hasCustomers(quotation)) missingFields.push('customerId');
  if (!hasValue(quotation.vendorId)) missingFields.push('vendorId');
  if (!hasValue(quotation.travelDate)) missingFields.push('travelDate');

  const hasSellingPrice =
    hasNonNegativePriceInfoValue(priceInfo.sellingPrice) ||
    (Array.isArray(quotation.customerPricing) && quotation.customerPricing.length > 0);

  const semiMandatoryPriceFields: string[] = [];

  if (status === 'confirmed') {
    if (advancedPricing) {
      semiMandatoryPriceFields.push(
        'vendorInvoiceBase',
        'vendorIncentiveReceived',
        'commissionPayout'
      );
    } else {
      semiMandatoryPriceFields.push('costPrice');
    }
    if (!hasSellingPrice) missingFields.push('priceInfo.sellingPrice');
  }

  if (status === 'rescheduled') {
    if (advancedPricing) {
      semiMandatoryPriceFields.push(
        'vendorInvoiceBase',
        'additionalVendorInvoiceBase',
        'vendorIncentiveReceived',
        'additionalVendorIncentiveReceived',
        'commissionPayout',
        'additionalCommissionPayout',
        'additionalSellingPrice'
      );
    } else {
      semiMandatoryPriceFields.push('costPrice', 'additionalCostPrice', 'additionalSellingPrice');
    }
    if (!hasSellingPrice) missingFields.push('priceInfo.sellingPrice');
  }

  if (status === 'cancelled') {
    if (advancedPricing) {
      semiMandatoryPriceFields.push(
        'vendorInvoiceBase',
        'refundReceived',
        'vendorIncentiveReceived',
        'vendorIncentiveChargeback',
        'commissionPayout',
        'commissionPayoutChargeback',
        'refundPaid'
      );
    } else {
      semiMandatoryPriceFields.push('costPrice', 'refundReceived', 'refundPaid');
    }
    if (!hasSellingPrice) missingFields.push('priceInfo.sellingPrice');
  }

  for (const field of semiMandatoryPriceFields) {
    if (!hasNonNegativePriceInfoValue(priceInfo[field])) {
      missingFields.push(`priceInfo.${field}`);
    }
  }

  return missingFields;
};

const isBookingDataComplete = (quotation: any): boolean => {
  const mandatoryFields = getMandatoryBookingFields(quotation);
  const semiMandatoryFields = getSemiMandatoryBookingFields(quotation);
  const missingServiceFields = getMissingFormFieldKeys(quotation?.quotationType, quotation?.formFields);

  return mandatoryFields.length === 0 && semiMandatoryFields.length === 0 && missingServiceFields.length === 0;
};

export const createQuotation = async (req: Request, res: Response): Promise<void> => {
  try {
    const quotationData = { ...req.body };

    console.log('📝 Creating quotation with payload:', JSON.stringify(quotationData, null, 2));

    if (typeof quotationData.formFields === 'string') {
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

    if (typeof quotationData.secondaryOwner === 'string') {
      quotationData.secondaryOwner = JSON.parse(quotationData.secondaryOwner);
    }

    if (typeof quotationData.vendorVoucherDocuments === 'string') {
      quotationData.vendorVoucherDocuments = JSON.parse(quotationData.vendorVoucherDocuments);
    }

    if (typeof quotationData.vendorInvoiceDocuments === 'string') {
      quotationData.vendorInvoiceDocuments = JSON.parse(quotationData.vendorInvoiceDocuments);
    }

    if (typeof quotationData.adultTravelers === 'string') {
      quotationData.adultTravelers = JSON.parse(quotationData.adultTravelers);
    }

    if (typeof quotationData.childTravelers === 'string') {
      quotationData.childTravelers = JSON.parse(quotationData.childTravelers);
    }

    try {
      const parsedTravelDate = parseDateValue(quotationData.travelDate, 'travelDate');
      if (parsedTravelDate) quotationData.travelDate = parsedTravelDate;

      const parsedBookingDate = parseDateValue(
        quotationData.bookingDate,
        'bookingDate'
      );
      if (parsedBookingDate) {
        quotationData.bookingDate = parsedBookingDate;
      }

      const parsedNewBookingDate = parseDateValue(quotationData.newBookingDate, 'newBookingDate');
      if (parsedNewBookingDate) quotationData.newBookingDate = parsedNewBookingDate;

      const parsedNewTravelDate = parseDateValue(quotationData.newTravelDate, 'newTravelDate');
      if (parsedNewTravelDate) quotationData.newTravelDate = parsedNewTravelDate;

      const parsedCancellationDate = parseDateValue(quotationData.cancellationDate, 'cancellationDate');
      if (parsedCancellationDate) quotationData.cancellationDate = parsedCancellationDate;

      const parsedTotalAmount = parseNumberValue(quotationData.totalAmount, 'totalAmount');
      if (parsedTotalAmount !== undefined) quotationData.totalAmount = parsedTotalAmount;

      const parsedAdultNumber = parseNumberValue(quotationData.adultNumber, 'adultNumber');
      if (parsedAdultNumber !== undefined) quotationData.adultNumber = parsedAdultNumber;

      const parsedChildNumber = parseNumberValue(quotationData.childNumber, 'childNumber');
      if (parsedChildNumber !== undefined) quotationData.childNumber = parsedChildNumber;
    } catch (error) {
      res.status(400).json({
        success: false,
        message: (error as Error).message
      });
      return;
    }

    if (quotationData.serviceStatus !== 'draft' && (!quotationData.quotationType || !quotationData.channel)) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: quotationType and channel are required'
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

    const quotationStateError = getQuotationStateValidationError(quotationData);
    if (quotationStateError) {
      res.status(400).json({
        success: false,
        message: quotationStateError
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

    if (quotationData.serviceStatus !== 'draft') {
      const missingMandatoryFields = getMandatoryBookingFields(quotationData);
      if (missingMandatoryFields.length > 0) {
        res.status(400).json({
          success: false,
          message: `Missing mandatory fields: ${missingMandatoryFields.join(', ')}`
        });
        return;
      }
    }

    quotationData.businessId = req.user?.businessInfo?.businessId;

    const newQuotation = new Quotation(quotationData);
    await newQuotation.save();

    console.log('✅ Quotation created successfully:', newQuotation.customId);

    res.status(201).json({
      success: true,
      quotation: {
        ...newQuotation.toObject(),
        pricingSummary: getPricingSummary(newQuotation),
      }
    });
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
    if (!parseJsonField('vendorVoucherDocuments', 'vendorVoucherDocuments')) return;
    if (!parseJsonField('vendorInvoiceDocuments', 'vendorInvoiceDocuments')) return;

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

    try {
      const parsedBookingDate = parseDateValue(
        updateData.bookingDate,
        'bookingDate'
      );
      if (parsedBookingDate) {
        updateData.bookingDate = parsedBookingDate;
      }

      const parsedNewBookingDate = parseDateValue(updateData.newBookingDate, 'newBookingDate');
      if (parsedNewBookingDate) updateData.newBookingDate = parsedNewBookingDate;

      const parsedNewTravelDate = parseDateValue(updateData.newTravelDate, 'newTravelDate');
      if (parsedNewTravelDate) updateData.newTravelDate = parsedNewTravelDate;

      const parsedCancellationDate = parseDateValue(updateData.cancellationDate, 'cancellationDate');
      if (parsedCancellationDate) updateData.cancellationDate = parsedCancellationDate;

      const parsedAdultNumber = parseNumberValue(updateData.adultNumber, 'adultNumber');
      if (parsedAdultNumber !== undefined) updateData.adultNumber = parsedAdultNumber;

      const parsedChildNumber = parseNumberValue(updateData.childNumber, 'childNumber');
      if (parsedChildNumber !== undefined) updateData.childNumber = parsedChildNumber;
    } catch (error) {
      res.status(400).json({
        success: false,
        message: (error as Error).message
      });
      return;
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

    const existingQuotationForValidation = await Quotation.findOne(filter).lean();
    if (!existingQuotationForValidation) {
      res.status(404).json({ success: false, message: 'Quotation not found' });
      return;
    }

    const effectiveQuotation = {
      ...existingQuotationForValidation,
      ...updateData
    };

    const effectiveServiceStatus = effectiveQuotation.serviceStatus;
    const effectiveQuotationType = effectiveQuotation.quotationType;
    const effectiveFormFields = effectiveQuotation.formFields;
    const effectivePriceInfo = effectiveQuotation.priceInfo;

    const priceInfoError = getPriceInfoValidationError(effectivePriceInfo);
    if (priceInfoError) {
      res.status(400).json({
        success: false,
        message: priceInfoError
      });
      return;
    }

    const quotationStateError = getQuotationStateValidationError(effectiveQuotation);
    if (quotationStateError) {
      res.status(400).json({
        success: false,
        message: quotationStateError
      });
      return;
    }

    const customerPricingError = getCustomerPricingValidationError(
      effectiveQuotation.customerId,
      effectiveQuotation.customerPricing
    );
    if (customerPricingError) {
      res.status(400).json({
        success: false,
        message: customerPricingError
      });
      return;
    }

    if (!isDraftServiceStatus(effectiveServiceStatus)) {
      if (!effectiveQuotationType || !effectiveQuotation.channel) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: quotationType and channel are required'
        });
        return;
      }

      const missingMandatoryFields = getMandatoryBookingFields(effectiveQuotation);
      if (missingMandatoryFields.length > 0) {
        res.status(400).json({
          success: false,
          message: `Missing mandatory fields: ${missingMandatoryFields.join(', ')}`
        });
        return;
      }
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
    res.status(200).json({
      success: true,
      quotation: {
        ...updated.toObject(),
        pricingSummary: getPricingSummary(updated),
      }
    });
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
      query.bookingDate = bookingDateFilter;
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
        pricingSummary: getPricingSummary(quotation),
        customerPaymentStatus: customerExists ? getPaymentStatus(customerAllocated, customerAmount) : 'not_applicable',
        vendorPaymentStatus: quotation.vendorId ? getPaymentStatus(vendorAllocated, vendorAmount) : 'not_applicable'
      };
    });

    res.status(200).json({ success: true, quotations: quotationsWithPayments });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch quotations', error: (err as Error).message });
  }
};

export const getMyQuotations = async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const {
      bookingStartDate,
      bookingEndDate,
      travelStartDate,
      travelEndDate,
      isDeleted,
      serviceStatus,
      page: pageParam,
      limit: limitParam,
    } = req.query;

    // Optional pagination
    const page = pageParam ? Math.max(1, parseInt(pageParam as string, 10) || 1) : null;
    const limit = limitParam ? Math.min(500, Math.max(1, parseInt(limitParam as string, 10) || 50)) : null;
    const skip = page && limit ? (page - 1) * limit : 0;

    // Build query: user must be primaryOwner OR in secondaryOwner array
    const query: any = {
      $or: [
        { primaryOwner: userObjectId },
        { secondaryOwner: userObjectId },
      ],
      isDeleted: isDeleted === 'true' ? true : false,
    };

    // Business scoping for non-super-admins
    if (req.user?.userType !== 'super_admin') {
      query.businessId = req.user?.businessInfo?.businessId;
    }

    // Date filters
    if (bookingStartDate || bookingEndDate) {
      const bookingDateFilter: any = {};
      if (bookingStartDate) bookingDateFilter.$gte = new Date(bookingStartDate as string);
      if (bookingEndDate) bookingDateFilter.$lte = new Date(bookingEndDate as string);
      query.bookingDate = bookingDateFilter;
    }

    if (travelStartDate || travelEndDate) {
      const travelDateFilter: any = {};
      if (travelStartDate) travelDateFilter.$gte = new Date(travelStartDate as string);
      if (travelEndDate) travelDateFilter.$lte = new Date(travelEndDate as string);
      query.travelDate = travelDateFilter;
    }

    if (serviceStatus) {
      query.serviceStatus = serviceStatus;
    }

    // Fetch quotations (with optional pagination)
    let dbQuery = Quotation.find(query)
      .populate({ path: 'businessId', select: 'businessName businessType' })
      .populate('customerId', 'name email phone companyName')
      .populate('vendorId', 'companyName contactPerson email phone')
      .populate('adultTravelers', 'name email phone')
      .populate({ path: 'childTravelers.id', model: 'Traveller', select: 'name email phone' })
      .populate('primaryOwner', 'name email')
      .populate('secondaryOwner', 'name email')
      .sort({ createdAt: -1 });

    // Get total count for pagination before applying skip/limit
    const totalCount = page && limit ? await Quotation.countDocuments(query) : null;

    if (page && limit) {
      dbQuery = dbQuery.skip(skip).limit(limit);
    }

    const quotations = await dbQuery.lean();

    // Payment & task enrichment (same as getAllQuotations)
    const quotationIds = quotations
      .map((q) => q?._id)
      .filter((id) => mongoose.isValidObjectId(String(id)))
      .map((id) => new mongoose.Types.ObjectId(String(id)));

    const paymentBaseMatch: any = { isDeleted: { $ne: true } };
    if (query.businessId) {
      paymentBaseMatch.businessId = normalizeObjectId(query.businessId);
    }

    const [customerAllocations, vendorAllocations, taskCounts] = await Promise.all([
      Payments.aggregate([
        { $match: { ...paymentBaseMatch, party: 'Customer' } },
        { $unwind: '$allocations' },
        { $match: { 'allocations.quotationId': { $in: quotationIds } } },
        { $group: { _id: '$allocations.quotationId', totalAllocated: { $sum: '$allocations.amount' } } },
      ]),
      Payments.aggregate([
        { $match: { ...paymentBaseMatch, party: 'Vendor' } },
        { $unwind: '$allocations' },
        { $match: { 'allocations.quotationId': { $in: quotationIds } } },
        { $group: { _id: '$allocations.quotationId', totalAllocated: { $sum: '$allocations.amount' } } },
      ]),
      Logs.aggregate([
        { $match: { bookingId: { $in: quotationIds } } },
        { $group: { _id: '$bookingId', taskCount: { $sum: 1 } } },
      ]),
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
        pricingSummary: getPricingSummary(quotation),
        customerPaymentStatus: customerExists ? getPaymentStatus(customerAllocated, customerAmount) : 'not_applicable',
        vendorPaymentStatus: quotation.vendorId ? getPaymentStatus(vendorAllocated, vendorAmount) : 'not_applicable',
      };
    });

    const response: any = {
      success: true,
      quotations: quotationsWithPayments,
    };

    // if (page && limit && totalCount !== null) {
    //   response.pagination = {
    //     page,
    //     limit,
    //     totalCount,
    //     totalPages: Math.ceil(totalCount / limit),
    //   };
    // }

    res.status(200).json(response);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch my quotations', error: (err as Error).message });
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

    res.status(200).json({
      success: true,
      quotation: {
        ...quotation.toObject(),
        pricingSummary: getPricingSummary(quotation),
      }
    });
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

    res.status(200).json({
      success: true,
      quotations: quotations.map((quotation) => ({
        ...quotation.toObject(),
        pricingSummary: getPricingSummary(quotation),
      }))
    });
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
      filter.bookingDate = {};
      if (startDate) filter.bookingDate.$gte = new Date(startDate as string);
      if (endDate) filter.bookingDate.$lte = new Date(endDate as string);
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
        quotations: quotations.map((quotation) => ({
          ...quotation.toObject(),
          pricingSummary: getPricingSummary(quotation),
        })),
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
      filter.bookingDate = {};
      if (startDate) filter.bookingDate.$gte = new Date(startDate as string);
      if (endDate) filter.bookingDate.$lte = new Date(endDate as string);

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
        quotations: quotations.map((quotation) => ({
          ...quotation.toObject(),
          pricingSummary: getPricingSummary(quotation),
        })),
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
      filter.bookingDate = {};
      if (startDate) filter.bookingDate.$gte = new Date(startDate as string);
      if (endDate) filter.bookingDate.$lte = new Date(endDate as string);

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
        quotations: quotations.map((quotation) => ({
          ...quotation.toObject(),
          pricingSummary: getPricingSummary(quotation),
        })),
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
      filter.bookingDate = {};
      if (startDate) filter.bookingDate.$gte = new Date(startDate as string);
      if (endDate) filter.bookingDate.$lte = new Date(endDate as string);

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
        quotations: quotations.map((quotation) => ({
          ...quotation.toObject(),
          pricingSummary: getPricingSummary(quotation),
        })),
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
