import mongoose, { Document, Schema } from 'mongoose';
import Business from './Business';
import Counter from './Counter';

export const QUOTATION_TYPES = [
  'flight',
  'accomodation',
  'transportation',
  'ticket',
  'activity',
  'travel insurance',
  'visa',
  'others'
] as const;

export type QuotationType = (typeof QUOTATION_TYPES)[number];
export type QuotationStatus = 'confirmed' | 'cancelled';

export type ServiceStatus = 'pending' | 'denied' | 'draft' | 'approved';

export interface FlightFormFields {
  from: string;
  to: string;
  departureDate: Date | string;
  airline: string;
}

export interface ActivityFormFields {
  activityName: string;
  activityDate: Date | string;
  location: string;
  pax: number;
}

export interface IQuotationDocument {
  originalName: string;
  fileName: string;
  url: string;
  key: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
}

export interface PriceBreakdown {
  vendorBasePrice?: number;
  supplierIncentive?: number;
  commissionPayout?: number;
  [key: string]: number | undefined;
}

export interface PriceInfo {
  advancedPricing: boolean;
  sellingPrice: number;
  costPrice: number;
  costPriceBreakdown?: PriceBreakdown;
  cancellationBreakdown?: PriceBreakdown;
}

export interface CustomerPricingEntry {
  customerId: mongoose.Types.ObjectId;
  sellingPrice: number;
}

export interface IQuotation extends Document {
  customId: string;
  quotationType: QuotationType;
  businessId: mongoose.Types.ObjectId;
  formFields: Map<String, unknown>,
  priceInfo?: PriceInfo;
  customerPricing?: CustomerPricingEntry[];
  totalAmount: number;
  status: QuotationStatus;
  createdAt: Date;
  updatedAt: Date;
  primaryOwner: mongoose.Types.ObjectId;
  secondaryOwner: Array<mongoose.Types.ObjectId>;
  travelDate: Date;
  customerId: Array<mongoose.Types.ObjectId>;
  vendorId: mongoose.Types.ObjectId;
  adultTravelers: Array<mongoose.Types.ObjectId>;
  childTravelers: Array<{ id: mongoose.Types.ObjectId, age: number }>;
  adultNumber: number;
  childNumber: number;
  remarks: string;
  isDeleted: boolean;
  serviceStatus: string;
  documents: IQuotationDocument[];
}

const REQUIRED_FORM_FIELDS_BY_TYPE: Record<string, string[]> = {
  flight: ['from', 'to', 'departureDate', 'airline'],
  activity: ['activityName', 'activityDate', 'location', 'pax'],
};

const hasMeaningfulValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return !Number.isNaN(value);
  if (typeof value === 'boolean') return true;
  if (value instanceof Date) return !Number.isNaN(value.getTime());
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value as Record<string, unknown>).length > 0;
  return true;
};

const toPlainObject = (value: unknown): Record<string, unknown> => {
  if (!value) return {};
  if (value instanceof Map) return Object.fromEntries(value.entries());
  if (typeof value === 'object') return value as Record<string, unknown>;
  return {};
};

export const getMissingFormFieldKeys = (
  quotationType?: string,
  formFields?: unknown
): string[] => {
  if (!quotationType) return [];

  const requiredKeys = REQUIRED_FORM_FIELDS_BY_TYPE[quotationType] ?? [];
  if (requiredKeys.length === 0) return [];

  const plainFields = toPlainObject(formFields);
  return requiredKeys.filter((key) => !hasMeaningfulValue(plainFields[key]));
};

const isFiniteNumber = (value: unknown): boolean => {
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value === 'string' && value.trim() !== '') {
    return Number.isFinite(Number(value));
  }
  return false;
};

export const getPriceInfoValidationError = (priceInfo?: unknown): string | null => {
  if (!priceInfo) return null;

  const plainPriceInfo = toPlainObject(priceInfo);
  const { sellingPrice, costPrice, advancedPricing } = plainPriceInfo;

  if (!isFiniteNumber(sellingPrice)) {
    return 'priceInfo.sellingPrice must be a valid number';
  }
  if (!isFiniteNumber(costPrice)) {
    return 'priceInfo.costPrice must be a valid number';
  }

  if (advancedPricing !== undefined && typeof advancedPricing !== 'boolean') {
    return 'priceInfo.advancedPricing must be a boolean';
  }

  if (advancedPricing === true) {
    const costPriceBreakdown = plainPriceInfo.costPriceBreakdown;
    if (costPriceBreakdown !== undefined) {
      const plainBreakdown = toPlainObject(costPriceBreakdown);
      for (const [key, value] of Object.entries(plainBreakdown)) {
        if (!isFiniteNumber(value)) {
          return `priceInfo.costPriceBreakdown.${key} must be a valid number`;
        }
      }
    }

    const cancellationBreakdown = plainPriceInfo.cancellationBreakdown;
    if (cancellationBreakdown !== undefined) {
      const plainCancellation = toPlainObject(cancellationBreakdown);
      for (const [key, value] of Object.entries(plainCancellation)) {
        if (!isFiniteNumber(value)) {
          return `priceInfo.cancellationBreakdown.${key} must be a valid number`;
        }
      }
    }
  }

  return null;
};

export const getCustomerPricingValidationError = (
  customerIds?: unknown,
  customerPricing?: unknown
): string | null => {
  const normalizedCustomerIds = (Array.isArray(customerIds) ? customerIds : customerIds ? [customerIds] : [])
    .map((customerId) => String(customerId))
    .filter(Boolean);

  if (normalizedCustomerIds.length === 0) return null;

  if (!Array.isArray(customerPricing) || customerPricing.length === 0) {
    return 'customerPricing is required when customerId is provided';
  }

  const pricingMap = new Map<string, number>();
  for (const item of customerPricing) {
    const plainItem = toPlainObject(item);
    const customerId = plainItem.customerId ? String(plainItem.customerId) : '';
    if (!customerId) return 'customerPricing.customerId is required for each entry';

    const sellingPrice = plainItem.sellingPrice;
    if (!isFiniteNumber(sellingPrice)) {
      return `customerPricing.sellingPrice must be a valid number for customer ${customerId}`;
    }

    if (pricingMap.has(customerId)) {
      return `Duplicate customerPricing entry found for customer ${customerId}`;
    }
    pricingMap.set(customerId, Number(sellingPrice));
  }

  for (const customerId of normalizedCustomerIds) {
    if (!pricingMap.has(customerId)) {
      return `Missing customerPricing entry for customer ${customerId}`;
    }
  }

  return null;
};

const QuotationSchema = new Schema<IQuotation>(
  {
    customId: {
      type: String,
      index: true,
      // Will be auto-generated in pre-save hook
    },
    quotationType: {
      type: String,
      enum: QUOTATION_TYPES,
      required: false,
    },
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: false,
      index: true
    },
    formFields: {
      type: Map,
      required: false,
      validate: {
        validator: function (this: IQuotation, value: unknown) {
          if (!this.quotationType) return true;
          const missingKeys = getMissingFormFieldKeys(this.quotationType, value);
          return missingKeys.length === 0;
        },
        message: 'Missing required formFields for selected quotationType'
      }
    },
    priceInfo: {
      type: Map,
      required: false,
      validate: {
        validator: function (value: unknown) {
          return getPriceInfoValidationError(value) === null;
        },
        message: 'Invalid priceInfo data'
      }
    },
    totalAmount: { type: Number },
    status: {
      type: String,
      enum: [ 'confirmed', 'cancelled'],
      default: 'confirmed',
    },
    primaryOwner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    secondaryOwner: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
    },
    serviceStatus: {
      type: String,
      enum: ['pending', 'denied', 'draft', 'approved'],
      default: 'approved',
    },
    travelDate: { type: Date, required: false },
    customerId: { type: [Schema.Types.ObjectId], ref: 'Customer', required: false },
    customerPricing: {
      type: [{
        customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
        sellingPrice: { type: Number, required: true }
      }],
      default: [],
      validate: {
        validator: function (this: IQuotation, value: unknown) {
          return getCustomerPricingValidationError(this.customerId, value) === null;
        },
        message: 'Invalid customerPricing for selected customers'
      }
    },
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: false },
    adultTravelers: { type: [Schema.Types.ObjectId], ref: 'Traveller', required: false },
    childTravelers: { type: [{
      id: { type: Schema.Types.ObjectId, ref: 'Traveller', required: false },
      age: { type: Number, required: false },
    }], required: false },
    adultNumber: { type: Number, required: false },
    childNumber: { type: Number, required: false },
    remarks: { type: String, required: false },
    isDeleted: { type: Boolean, default: false },
    documents: {
      type: [{
        originalName: { type: String, required: false },
        fileName: { type: String, required: false },
        url: { type: String, required: false },
        key: { type: String, required: false },
        size: { type: Number, required: false },
        mimeType: { type: String, required: false },
        uploadedAt: { type: Date, default: Date.now },
      }],
      default: [],
      validate: {
        validator: function(docs: any[]) {
          return docs.length <= 3;
        },
        message: 'Maximum 3 documents are allowed per quotation'
      }
    },
  },
  { timestamps: true }
);

// Indexes for better performance
QuotationSchema.index({ businessId: 1, createdAt: -1 });
QuotationSchema.index({ businessId: 1, status: 1 });
QuotationSchema.index({ businessId: 1, quotationType: 1 });
QuotationSchema.index({ businessId: 1, channel: 1 });
QuotationSchema.index({ businessId: 1, customerId: 1 });
QuotationSchema.index({ businessId: 1, vendorId: 1 });
QuotationSchema.index({ businessId: 1, adultTravelers: 1 });
QuotationSchema.index({ businessId: 1, childTravelers: 1 });
QuotationSchema.index({ businessId: 1, customId: 1 }, { unique: true, sparse: true });

// Static method to find quotations by business
QuotationSchema.statics.findByBusiness = function(businessId: string) {
  return this.find({ businessId });
};

// Static method to find quotation by custom ID
QuotationSchema.statics.findByCustomId = function(customId: string) {
  return this.findOne({ customId });
};

export default mongoose.model<IQuotation>('Quotation', QuotationSchema);
