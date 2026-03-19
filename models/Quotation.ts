import mongoose, { Document, Schema } from 'mongoose';

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
export type QuotationStatus = 'confirmed' | 'cancelled' | 'rescheduled';

export type ServiceStatus = 'pending' | 'denied' | 'draft' | 'approved';

export interface FlightFormFields {
  pnr?: string;
  samePnrForAllSegments?: boolean;
  tripType?: 'one way' | 'round trip' | 'multi city';
  trips?: FlightTrip[];
  segments?: FlightSegment[];
  rulesAndConditions?: string;
  rulesTemplateId?: string;
  internalNotes?: string;
}

export interface FlightTrip {
  title?: string;
  notes?: string;
  segments: FlightSegment[];
}

export interface FlightBagInfo {
  pieces?: number;
  weight?: number;
}

export interface FlightSegmentPreview {
  airline?: string;
  airlineLogo?: string;
  flightNumber?: string;
  originAirportCode?: string;
  destinationAirportCode?: string;
  originCity?: string;
  destinationCity?: string;
  std?: string;
  sta?: string;
  duration?: string;
}

export interface FlightSegment {
  pnr?: string;
  from?: string;
  to?: string;
  flightNumber?: string;
  travelDate?: Date | string;
  cabinClass?: 'Economy' | 'Premium economy' | 'Business' | 'First class';
  cabinBaggage?: FlightBagInfo;
  checkInBaggage?: FlightBagInfo;
  preview?: FlightSegmentPreview;
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

export interface PriceInfo {
  advancedPricing: boolean;
  costPrice?: PriceInfoCurrencyValue;
  vendorInvoiceBase?: PriceInfoCurrencyValue;
  additionalVendorInvoiceBase?: PriceInfoCurrencyValue;
  vendorIncentiveReceived?: PriceInfoCurrencyValue;
  additionalVendorIncentiveReceived?: PriceInfoCurrencyValue;
  commissionPayout?: PriceInfoCurrencyValue;
  additionalCommissionPayout?: PriceInfoCurrencyValue;
  refundReceived?: PriceInfoCurrencyValue;
  vendorIncentiveChargeback?: PriceInfoCurrencyValue;
  commissionPayoutChargeback?: PriceInfoCurrencyValue;
  additionalCostPrice?: PriceInfoCurrencyValue;
  notes?: string;
}

export interface PriceInfoCurrencyValue {
  amount?: number;
  currency: string;
  exchangeRate?: number;
  notes?: string;
}

export interface QuotationPricingSummary {
  status: QuotationStatus;
  advancedPricing: boolean;
  oldCostPrice: number;
  newCostPrice: number;
  oldSellingPrice: number;
  newSellingPrice: number;
  oldNet: number;
  newNet: number;
  oldNetPercentage: number;
  newNetPercentage: number;
  vendorPayableAmount: number;
  customerReceivableAmount: number;
  journalCommissionAmount: number;
  formulaLabel: string;
  customerBreakdown: QuotationPricingCustomerBreakdownEntry[];
}

export interface QuotationPricingCustomerBreakdownEntry {
  customerId: string;
  oldSellingPrice: number;
  newSellingPrice: number;
}

export interface CustomerPricingEntry {
  customerId: mongoose.Types.ObjectId;
  sellingPrice?: number;
  oldSellingPrice?: number;
  newSellingPrice?: number;
  refundPaid?: number;
}

export interface IQuotation extends Document {
  customId: string;
  quotationType: QuotationType;
  channel: string;
  businessId: mongoose.Types.ObjectId;
  formFields: Map<String, unknown>,
  priceInfo?: PriceInfo;
  customerPricing?: CustomerPricingEntry[];
  totalAmount: number;
  status: QuotationStatus;
  createdAt: Date;
  updatedAt: Date;
  bookingDate: Date;
  newBookingDate?: Date;
  newTravelDate?: Date;
  cancellationDate?: Date;
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
  vendorVoucherDocuments: IQuotationDocument[];
  vendorInvoiceDocuments: IQuotationDocument[];
}

const REQUIRED_FORM_FIELDS_BY_TYPE: Record<string, string[]> = {
  flight: ['tripType'],
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

  const plainFields = toPlainObject(formFields);
  if (quotationType === 'flight') {
    const tripType = String(plainFields.tripType ?? '');
    const trips = Array.isArray(plainFields.trips) ? plainFields.trips : [];
    const segments = Array.isArray(plainFields.segments) ? plainFields.segments : [];
    const missingKeys: string[] = [];
    const requiredSegmentFields = ['flightNumber', 'travelDate', 'cabinClass'] as const;

    const collectMissingSegmentFields = (segmentList: unknown[], basePath: string) => {
      segmentList.forEach((segmentValue, segmentIndex) => {
        const segment = toPlainObject(segmentValue);
        requiredSegmentFields.forEach((field) => {
          if (!hasMeaningfulValue(segment[field])) {
            missingKeys.push(`${basePath}.${segmentIndex}.${field}`);
          }
        });
      });
    };

    if (!hasMeaningfulValue(plainFields.tripType)) missingKeys.push('tripType');
    if (tripType === 'multi city') {
      if (trips.length === 0) {
        missingKeys.push('trips');
      } else {
        trips.forEach((tripValue, tripIndex) => {
          const trip = toPlainObject(tripValue);
          const tripSegments = Array.isArray(trip.segments) ? trip.segments : [];
          if (tripSegments.length === 0) {
            missingKeys.push(`trips.${tripIndex}.segments`);
            return;
          }
          collectMissingSegmentFields(tripSegments, `trips.${tripIndex}.segments`);
        });
      }
    } else if (segments.length === 0) {
      missingKeys.push('segments');
    } else {
      collectMissingSegmentFields(segments, 'segments');
    }
    return missingKeys;
  }

  const requiredKeys = REQUIRED_FORM_FIELDS_BY_TYPE[quotationType] ?? [];
  if (requiredKeys.length === 0) return [];

  return requiredKeys.filter((key) => !hasMeaningfulValue(plainFields[key]));
};

const isFiniteNumber = (value: unknown): boolean => {
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value === 'string' && value.trim() !== '') {
    return Number.isFinite(Number(value));
  }
  return false;
};

const isValidDateValue = (value: unknown): boolean => {
  if (value === undefined || value === null || value === '') return false;
  const parsedDate = value instanceof Date ? value : new Date(String(value));
  return !Number.isNaN(parsedDate.getTime());
};

const isNonNegativeNumberLike = (value: unknown): boolean => {
  if (!isFiniteNumber(value)) return false;
  return Number(value) >= 0;
};

export const getPriceInfoCurrencyAmount = (value: unknown): number => {
  if (value && typeof value === 'object' && 'amount' in (value as Record<string, unknown>)) {
    const parsedAmount = Number((value as Record<string, unknown>).amount);
    return Number.isFinite(parsedAmount) ? parsedAmount : 0;
  }
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
};

export const getFormFieldsValidationError = (
  quotationType?: string,
  formFields?: unknown
): string | null => {
  if (!quotationType || !formFields) return null;

  const plainFields = toPlainObject(formFields);

  if (quotationType !== 'flight') return null;

  const tripType = plainFields.tripType;
  const allowedTripTypes = ['one way', 'round trip', 'multi city'];

  const samePnrForAllSegments = plainFields.samePnrForAllSegments;
  

  if (hasMeaningfulValue(plainFields.pnr)) {
    const pnr = String(plainFields.pnr).trim();
    if (!/^[A-Z0-9]{6}$/.test(pnr)) {
      return 'formFields.pnr must be a 6 character uppercase alphanumeric code';
    }
  }

  const sharedPnr = plainFields.pnr ? String(plainFields.pnr).trim() : undefined;
  const validateSegmentList = (segmentList: unknown[], basePath: string): string | null => {
    for (let segmentIndex = 0; segmentIndex < segmentList.length; segmentIndex += 1) {
      const segment = toPlainObject(segmentList[segmentIndex]);
      const path = `${basePath}.${segmentIndex}`;

      if (hasMeaningfulValue(segment.flightNumber)) {
        const flightNumber = String(segment.flightNumber).trim();
        if (!/^[A-Z0-9]{3,4}$/.test(flightNumber)) {
          return `${path}.flightNumber must be a 3 to 4 character uppercase alphanumeric code`;
        }
      }

      if (hasMeaningfulValue(segment.travelDate) && !isValidDateValue(segment.travelDate)) {
        return `${path}.travelDate must be a valid date`;
      }

      if (hasMeaningfulValue(segment.cabinClass)) {
        const cabinClass = String(segment.cabinClass);
        const allowedCabinClasses = ['Economy', 'Premium economy', 'Business', 'First class'];
        if (!allowedCabinClasses.includes(cabinClass)) {
          return `${path}.cabinClass must be one of: Economy, Premium economy, Business, First class`;
        }
      }

      const pnrValue = hasMeaningfulValue(segment.pnr)
        ? String(segment.pnr).trim()
        : sharedPnr;
      if (pnrValue !== undefined && pnrValue !== '' && !/^[A-Z0-9]{6}$/.test(pnrValue)) {
        return `${path}.pnr must be a 6 character uppercase alphanumeric code`;
      }

      if (samePnrForAllSegments === true && sharedPnr && pnrValue && pnrValue !== sharedPnr) {
        return `${path}.pnr must match formFields.pnr when samePnrForAllSegments is enabled`;
      }

      const baggageFields: Array<{ key: 'cabinBaggage' | 'checkInBaggage'; label: string }> = [
        { key: 'cabinBaggage', label: 'cabinBaggage' },
        { key: 'checkInBaggage', label: 'checkInBaggage' },
      ];

      for (const baggageField of baggageFields) {
        const baggage = toPlainObject(segment[baggageField.key]);
        if (segment[baggageField.key] === undefined) continue;

        if (baggage.pieces !== undefined && !isNonNegativeNumberLike(baggage.pieces)) {
          return `${path}.${baggageField.label}.pieces must be a non-negative number`;
        }

        if (baggage.weight !== undefined && !isNonNegativeNumberLike(baggage.weight)) {
          return `${path}.${baggageField.label}.weight must be a non-negative number`;
        }
      }

      const preview = toPlainObject(segment.preview);
      if (segment.preview !== undefined && hasMeaningfulValue(preview.duration)) {
        const duration = String(preview.duration).trim();
        if (!/^\d{1,2}\s*h\s*\d{1,2}\s*m$/.test(duration)) {
          return `${path}.preview.duration must be in the format "XX h XX m"`;
        }
      }

      if (segment.preview !== undefined) {
        const previewTimeFields = ['std', 'sta'];
        for (const previewTimeField of previewTimeFields) {
          const value = preview[previewTimeField];
          if (hasMeaningfulValue(value) && !/^\d{2}:\d{2}$/.test(String(value).trim())) {
            return `${path}.preview.${previewTimeField} must be in 24 hour HH:mm format`;
          }
        }

        const previewFlightNumber = preview.flightNumber;
        if (hasMeaningfulValue(previewFlightNumber) && !/^[A-Z0-9]{3,4}$/.test(String(previewFlightNumber).trim())) {
          return `${path}.preview.flightNumber must be a 3 to 4 character uppercase alphanumeric code`;
        }
      }
    }

    return null;
  };

  if (tripType === 'multi city') {
    const trips = plainFields.trips;
    if (trips === undefined) return null;
    if (!Array.isArray(trips)) return 'formFields.trips must be an array';

    for (let tripIndex = 0; tripIndex < trips.length; tripIndex += 1) {
      const trip = toPlainObject(trips[tripIndex]);
      const tripPath = `formFields.trips.${tripIndex}`;
      if (trip.segments !== undefined && !Array.isArray(trip.segments)) {
        return `${tripPath}.segments must be an array`;
      }
      const tripSegments = Array.isArray(trip.segments) ? trip.segments : [];
      const segmentError = validateSegmentList(tripSegments, `${tripPath}.segments`);
      if (segmentError) return segmentError;
    }

    return null;
  }

  const segments = plainFields.segments;
  if (segments === undefined) return null;
  if (!Array.isArray(segments)) return 'formFields.segments must be an array';

  return validateSegmentList(segments, 'formFields.segments');
};

export const getPriceInfoValidationError = (priceInfo?: unknown): string | null => {
  if (!priceInfo) return null;

  const plainPriceInfo = toPlainObject(priceInfo);
  const { advancedPricing } = plainPriceInfo;

  if (advancedPricing !== undefined && typeof advancedPricing !== 'boolean') {
    return 'priceInfo.advancedPricing must be a boolean';
  }

  const numericFields = [
    'costPrice',
    'vendorInvoiceBase',
    'additionalVendorInvoiceBase',
    'vendorIncentiveReceived',
    'commissionPayout',
    'refundReceived',
    'vendorIncentiveChargeback',
    'commissionPayoutChargeback',
    'additionalCostPrice',
    'additionalVendorIncentiveReceived',
    'additionalCommissionPayout',
  ];

  for (const field of numericFields) {
    const value = plainPriceInfo[field];
    if (value !== undefined) {
      const plainCurrencyValue = toPlainObject(value);
      const hasAnyPriceValue =
        hasMeaningfulValue(plainCurrencyValue.amount) ||
        hasMeaningfulValue(plainCurrencyValue.currency) ||
        hasMeaningfulValue(plainCurrencyValue.exchangeRate) ||
        hasMeaningfulValue(plainCurrencyValue.notes);

      if (!hasAnyPriceValue) {
        continue;
      }

      if (!hasMeaningfulValue(plainCurrencyValue.currency) || typeof plainCurrencyValue.currency !== 'string') {
        return `priceInfo.${field}.currency is required`;
      }
      if (
        hasMeaningfulValue(plainCurrencyValue.amount) &&
        !isFiniteNumber(plainCurrencyValue.amount)
      ) {
        return `priceInfo.${field}.amount must be a valid number`;
      }
      if (
        hasMeaningfulValue(plainCurrencyValue.exchangeRate) &&
        !isFiniteNumber(plainCurrencyValue.exchangeRate)
      ) {
        return `priceInfo.${field}.exchangeRate must be a valid number`;
      }
    }
  }

  return null;
};

export const getQuotationPricingSummary = (
  status: QuotationStatus = 'confirmed',
  rawPriceInfo?: unknown,
  rawCustomerPricing?: unknown
): QuotationPricingSummary => {
  const priceInfo = toPlainObject(rawPriceInfo);
  const advancedPricing = priceInfo.advancedPricing === true;

  const costPrice = getPriceInfoCurrencyAmount(priceInfo.costPrice);
  const vendorInvoiceBase = getPriceInfoCurrencyAmount(priceInfo.vendorInvoiceBase);
  const additionalVendorInvoiceBase = getPriceInfoCurrencyAmount(priceInfo.additionalVendorInvoiceBase);
  const vendorIncentiveReceived = getPriceInfoCurrencyAmount(priceInfo.vendorIncentiveReceived);
  const additionalVendorIncentiveReceived = getPriceInfoCurrencyAmount(priceInfo.additionalVendorIncentiveReceived);
  const commissionPayout = getPriceInfoCurrencyAmount(priceInfo.commissionPayout);
  const additionalCommissionPayout = getPriceInfoCurrencyAmount(priceInfo.additionalCommissionPayout);
  const refundReceived = getPriceInfoCurrencyAmount(priceInfo.refundReceived);
  const vendorIncentiveChargeback = getPriceInfoCurrencyAmount(priceInfo.vendorIncentiveChargeback);
  const commissionPayoutChargeback = getPriceInfoCurrencyAmount(priceInfo.commissionPayoutChargeback);
  const additionalCostPrice = getPriceInfoCurrencyAmount(priceInfo.additionalCostPrice);
  const customerPricingEntries = Array.isArray(rawCustomerPricing) ? rawCustomerPricing : [];
  const customerBreakdown = customerPricingEntries.map((item, index) => {
    const plainItem = toPlainObject(item);
    const entrySellingPrice = getPriceInfoCurrencyAmount(plainItem.sellingPrice);
    const entryOldSellingPrice = getPriceInfoCurrencyAmount(plainItem.oldSellingPrice);
    const entryNewSellingPrice = getPriceInfoCurrencyAmount(plainItem.newSellingPrice);
    const entryRefundPaid = getPriceInfoCurrencyAmount(plainItem.refundPaid);

    let oldCustomerSellingPrice = entrySellingPrice;
    let newCustomerSellingPrice = entrySellingPrice;

    if (status === 'rescheduled') {
      oldCustomerSellingPrice = entryOldSellingPrice;
      newCustomerSellingPrice = entryNewSellingPrice;
    }

    if (status === 'cancelled') {
      oldCustomerSellingPrice = entrySellingPrice;
      newCustomerSellingPrice = entrySellingPrice - entryRefundPaid;
    }

    return {
      customerId: plainItem.customerId ? String(plainItem.customerId) : `customer-${index + 1}`,
      oldSellingPrice: oldCustomerSellingPrice,
      newSellingPrice: newCustomerSellingPrice,
    };
  });
  const oldSellingPrice = customerBreakdown.reduce((sum, item) => sum + item.oldSellingPrice, 0);
  const newSellingPrice = customerBreakdown.reduce((sum, item) => sum + item.newSellingPrice, 0);

  let oldCostPrice = costPrice;
  let newCostPrice = costPrice;
  let vendorPayableAmount = costPrice;
  let customerReceivableAmount = newSellingPrice;
  let journalCommissionAmount = 0;
  let formulaLabel = 'Net = Selling Price - Cost Price';

  if (status === 'confirmed') {
    if (advancedPricing) {
      oldCostPrice = vendorInvoiceBase - vendorIncentiveReceived + commissionPayout;
      newCostPrice = oldCostPrice;
      vendorPayableAmount = vendorInvoiceBase - vendorIncentiveReceived;
      customerReceivableAmount = newSellingPrice;
      journalCommissionAmount = commissionPayout;
      formulaLabel = 'Cost Price = Vendor Invoice (Base) - Vendor Incentive Received + Commission Payout';
    } else {
      vendorPayableAmount = costPrice;
      customerReceivableAmount = newSellingPrice;
    }
  }

  if (status === 'rescheduled') {
    oldCostPrice = advancedPricing
      ? vendorInvoiceBase - vendorIncentiveReceived + commissionPayout
      : costPrice;

    newCostPrice = advancedPricing
      ? oldCostPrice + additionalVendorInvoiceBase - additionalVendorIncentiveReceived + additionalCommissionPayout
      : costPrice + additionalCostPrice;

    vendorPayableAmount = advancedPricing
      ? (vendorInvoiceBase - vendorIncentiveReceived) +
        (additionalVendorInvoiceBase - additionalVendorIncentiveReceived)
      : costPrice + additionalCostPrice;
    customerReceivableAmount = newSellingPrice;
    journalCommissionAmount = advancedPricing
      ? commissionPayout + additionalCommissionPayout
      : 0;
    formulaLabel = advancedPricing
      ? 'Cost Price = Vendor Invoice (Base) + Additional Vendor Invoice (Base) - Vendor Incentives + Commission Payouts'
      : 'Cost Price = Cost Price + Additional Cost Price';
  }

  if (status === 'cancelled') {
    oldCostPrice = advancedPricing
      ? vendorInvoiceBase - vendorIncentiveReceived + commissionPayout
      : costPrice;

    newCostPrice = advancedPricing
      ? (vendorInvoiceBase - refundReceived) -
        (vendorIncentiveReceived - vendorIncentiveChargeback) +
        (commissionPayout - commissionPayoutChargeback)
      : costPrice - refundReceived;

    vendorPayableAmount = advancedPricing
      ? (vendorInvoiceBase - refundReceived) -
        (vendorIncentiveReceived - vendorIncentiveChargeback)
      : costPrice - refundReceived;
    customerReceivableAmount = newSellingPrice;
    journalCommissionAmount = advancedPricing
      ? commissionPayout - commissionPayoutChargeback
      : 0;
    formulaLabel = advancedPricing
      ? 'New Cost Price = (Vendor Invoice (Base) - Refund Received) - (Vendor Incentive Received - Vendor Incentive Chargeback) + (Commission Payout - Commission Payout Chargeback)'
      : 'New Cost Price = Cost Price - Refund Received';
  }

  const oldNet = oldSellingPrice - oldCostPrice;
  const newNet = newSellingPrice - newCostPrice;
  const oldNetPercentage = oldSellingPrice > 0 ? (oldNet / oldSellingPrice) * 100 : 0;
  const newNetPercentage = newSellingPrice > 0 ? (newNet / newSellingPrice) * 100 : 0;
  return {
    status,
    advancedPricing,
    oldCostPrice,
    newCostPrice,
    oldSellingPrice,
    newSellingPrice,
    oldNet,
    newNet,
    oldNetPercentage,
    newNetPercentage,
    vendorPayableAmount,
    customerReceivableAmount,
    journalCommissionAmount,
    formulaLabel,
    customerBreakdown,
  };
};

export const getCustomerPricingValidationError = (
  customerIds?: unknown,
  status: QuotationStatus = 'confirmed',
  customerPricing?: unknown
): string | null => {
  const normalizedCustomerIds = (Array.isArray(customerIds) ? customerIds : customerIds ? [customerIds] : [])
    .map((customerId) => String(customerId))
    .filter(Boolean);

  if (normalizedCustomerIds.length === 0) return null;

  if (customerPricing === undefined || customerPricing === null) return null;
  if (!Array.isArray(customerPricing)) return 'customerPricing must be an array';
  if (customerPricing.length === 0) return null;

  const pricingMap = new Map<string, true>();
  for (const item of customerPricing) {
    const plainItem = toPlainObject(item);
    const customerId = plainItem.customerId ? String(plainItem.customerId) : '';
    if (!customerId) return 'customerPricing.customerId is required for each entry';

    if (status === 'confirmed') {
      if (!isFiniteNumber(plainItem.sellingPrice)) {
        return `customerPricing.sellingPrice must be a valid number for customer ${customerId}`;
      }
    }

    if (status === 'rescheduled') {
      if (!isFiniteNumber(plainItem.oldSellingPrice)) {
        return `customerPricing.oldSellingPrice must be a valid number for customer ${customerId}`;
      }
      if (!isFiniteNumber(plainItem.newSellingPrice)) {
        return `customerPricing.newSellingPrice must be a valid number for customer ${customerId}`;
      }
    }

    if (status === 'cancelled') {
      if (!isFiniteNumber(plainItem.sellingPrice)) {
        return `customerPricing.sellingPrice must be a valid number for customer ${customerId}`;
      }
      if (!isFiniteNumber(plainItem.refundPaid)) {
        return `customerPricing.refundPaid must be a valid number for customer ${customerId}`;
      }
    }

    if (pricingMap.has(customerId)) {
      return `Duplicate customerPricing entry found for customer ${customerId}`;
    }
    pricingMap.set(customerId, true);
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
    channel: {
      type: String,
      required: false,
      trim: true,
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
          return getFormFieldsValidationError(this.quotationType, value) === null;
        },
        message: 'Invalid formFields data'
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
      enum: [ 'confirmed', 'cancelled', 'rescheduled'],
      default: 'confirmed',
    },
    bookingDate: { type: Date, required: false },
    newBookingDate: { type: Date, required: false },
    newTravelDate: { type: Date, required: false },
    cancellationDate: { type: Date, required: false },
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
        sellingPrice: { type: Number, required: false },
        oldSellingPrice: { type: Number, required: false },
        newSellingPrice: { type: Number, required: false },
        refundPaid: { type: Number, required: false }
      }],
      default: [],
      validate: {
        validator: function (this: IQuotation, value: unknown) {
          return getCustomerPricingValidationError(this.customerId, this.status, value) === null;
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
    vendorVoucherDocuments: {
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
        message: 'Maximum 3 vendor voucher documents are allowed per quotation'
      }
    },
    vendorInvoiceDocuments: {
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
        message: 'Maximum 3 vendor invoice documents are allowed per quotation'
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
