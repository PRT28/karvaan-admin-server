import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Payments, { PartyType, PaymentAmountType } from '../models/Payments';
import Customer from '../models/Customer';
import Vendor from '../models/Vendors';
import Quotation, { IQuotation } from '../models/Quotation';
import { UploadedDocument, uploadMultipleToS3 } from '../utils/s3';

type LedgerEntryType = 'opening' | 'quotation' | 'payment';

type LedgerEntry = {
  type: LedgerEntryType;
  entryType: 'credit' | 'debit';
  date: Date;
  data?: Record<string, any>;
  amount: number;
  referenceId?: mongoose.Types.ObjectId;
  notes?: string;
  allocations?: any[];
  customId?: string;
  paymentStatus?: 'none' | 'partial' | 'paid';
  allocatedAmount?: number;
  outstandingAmount?: number;
  closingBalance?: { amount: number; balanceType: 'credit' | 'debit' };
};

const toObjectId = (value: unknown) => {
  if (value instanceof mongoose.Types.ObjectId) return value;
  if (value === null || value === undefined) return null;
  const stringValue = String(value);
  if (!mongoose.isValidObjectId(stringValue)) return null;
  return new mongoose.Types.ObjectId(stringValue);
};

const toObjectIdStrict = (value: unknown) => {
  const result = toObjectId(value);
  if (!result) {
    throw new Error('Invalid ObjectId');
  }
  return result;
};

const getBusinessId = (req: Request) =>
  toObjectId(req.user?.businessId || req.user?.businessInfo?.businessId || req.user?._id);

const requireBusinessId = (req: Request, res: Response) => {
  const businessId = req.user?.businessInfo?.businessId;
  if (!businessId) {
    res.status(401).json({ message: 'Unauthorized user' });
    return null;
  }
  return businessId;
};

const getQuotationAmountForParty = (quotation: IQuotation, party: PartyType) => {
  const baseAmount = Number(quotation.totalAmount ?? 0);
  if (party !== 'Vendor') return baseAmount;

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

const buildAllocationPayload = (
  allocations: string | undefined,
  party: PartyType
) => {
  const alloc: Array<{ quotationId: string; amount: number }> = JSON.parse(allocations || '[]');
  if (!alloc || alloc.length === 0) return [];
  const amountType: PaymentAmountType = party === 'Vendor' ? 'cost' : 'selling';
 
  return alloc.map((allocation) => ({
    quotationId: new mongoose.Types.ObjectId(allocation.quotationId),
    amount: Number(allocation.amount),
    amountType,
    appliedAt: new Date(),
  }));
};

const sumAllocationAmount = (allocations: Array<{ amount: number }>) =>
  allocations.reduce((total, allocation) => total + Number(allocation.amount || 0), 0);

const computeClosingBalance = (totalDebit: number, totalCredit: number) => {
  const balance = totalDebit - totalCredit;
  if (balance >= 0) {
    return { amount: balance, balanceType: 'debit' as const };
  }
  return { amount: Math.abs(balance), balanceType: 'credit' as const };
};

const appendPaymentEntriesForLedger = (entries: LedgerEntry[], payment: any) => {
  const paymentAllocations = Array.isArray(payment.allocations) ? payment.allocations : [];
  const paymentAmount = Number(payment.amount || 0);
  if (paymentAllocations.length > 0) {
    const allocatedTotal = sumAllocationAmount(paymentAllocations);
    paymentAllocations.forEach((allocation: any) => {
      const allocationAmount = Number(allocation?.amount || 0);
      if (!Number.isFinite(allocationAmount) || allocationAmount <= 0) return;
      const appliedAt = allocation?.appliedAt ? new Date(allocation.appliedAt) : null;
      entries.push({
        type: 'payment',
        entryType: payment.entryType,
        data: { payment, allocation },
        date: appliedAt || payment.paymentDate || payment.createdAt,
        amount: allocationAmount,
        referenceId: toObjectIdStrict(payment._id),
        customId: payment.customId,
        notes: payment.internalNotes,
        allocations: [allocation],
      });
    });

    const unallocatedAmount = Number.isFinite(Number(payment.unallocatedAmount))
      ? Number(payment.unallocatedAmount || 0)
      : paymentAmount - allocatedTotal;
    const remaining = Math.max(0, unallocatedAmount);
    if (remaining > 0) {
      entries.push({
        type: 'payment',
        entryType: payment.entryType,
        data: payment,
        date: payment.paymentDate || payment.createdAt,
        amount: remaining,
        referenceId: toObjectIdStrict(payment._id),
        customId: payment.customId,
        notes: payment.internalNotes,
        allocations: [],
      });
    }
    return;
  }

  entries.push({
    type: 'payment',
    entryType: payment.entryType,
    data: payment,
    date: payment.paymentDate || payment.createdAt,
    amount: paymentAmount,
    referenceId: toObjectIdStrict(payment._id),
    customId: payment.customId,
    notes: payment.internalNotes,
    allocations: payment.allocations,
  });
};

const getPaymentMatch = (businessId: mongoose.Types.ObjectId, party: PartyType, partyId: mongoose.Types.ObjectId) => ({
  businessId,
  party,
  partyId,
  isDeleted: { $ne: true }
});

const validatePartyQuotationLinks = async (
  party: PartyType,
  partyId: mongoose.Types.ObjectId,
  businessId: mongoose.Types.ObjectId,
  allocations: Array<{ quotationId: mongoose.Types.ObjectId }>
) => {
  if (allocations.length === 0) return;
  const quotationIds = allocations.map((allocation) => allocation.quotationId);
  const filter: any = {
    _id: { $in: quotationIds },
    businessId,
    isDeleted: { $ne: true },
  };
  if (party === 'Customer') {
    filter.customerId = partyId;
  } else {
    filter.vendorId = partyId;
  }
  const matched = await Quotation.find(filter).select('_id');
  if (matched.length !== quotationIds.length) {
    throw new Error('One or more quotations do not belong to the selected party.');
  }
};

const getUnsettledQuotations = async (
  businessId: mongoose.Types.ObjectId,
  party: PartyType,
  partyId: mongoose.Types.ObjectId
) => {
  const quotationFilter: any = { businessId, isDeleted: { $ne: true } };
  if (party === 'Customer') {
    quotationFilter.customerId = partyId;
  } else {
    quotationFilter.vendorId = partyId;
  }

  const quotations = await Quotation.find(quotationFilter).sort({ createdAt: -1 });
  if (quotations.length === 0) return [];

  const allocationTotals = await Payments.aggregate([
    { $match: getPaymentMatch(businessId, party, partyId) },
    { $unwind: '$allocations' },
    { $group: { _id: '$allocations.quotationId', totalAllocated: { $sum: '$allocations.amount' } } }
  ]);

  const allocationMap = new Map<string, number>();
  allocationTotals.forEach((item) => {
    allocationMap.set(String(item._id), Number(item.totalAllocated || 0));
  });

  return quotations
    .map((quotation) => {
      const quotationAmount = getQuotationAmountForParty(quotation, party);
      const allocated = allocationMap.get(String(quotation._id)) || 0;
      const outstanding = quotationAmount - allocated;
      return {
        quotation,
        totalAmount: quotationAmount,
        allocatedAmount: allocated,
        outstandingAmount: outstanding,
      };
    })
    .filter((entry) => entry.outstandingAmount > 0);
};

export const listCustomerClosingBalances = async (req: Request, res: Response) => {
  try {
    const businessId = req.user?.businessInfo?.businessId;
    if (!businessId) return;
    const customers = await Customer
                              .find({ businessId, isDeleted: { $ne: true } })
                              .populate({
                                path: 'ownerId',
                                select: 'name email phone',
                              })
                              .sort({ createdAt: -1 });

    const quotationTotals = await Quotation.aggregate([
      { $match: { businessId: normalizeObjectId(businessId), isDeleted: { $ne: true }, customerId: { $ne: null } } },
      { $group: { _id: '$customerId', totalAmount: { $sum: '$totalAmount' } } }
    ]);

    const paymentTotals = await Payments.aggregate([
      { $match: { businessId: normalizeObjectId(businessId), party: 'Customer', isDeleted: { $ne: true } } },
      { $group: { _id: { partyId: '$partyId', entryType: '$entryType' }, totalAmount: { $sum: '$amount' } } }
    ]);

    const quotationMap = new Map<string, number>();
    quotationTotals.forEach((item) => quotationMap.set(String(item._id), Number(item.totalAmount || 0)));

    const paymentMap = new Map<string, { debit: number; credit: number }>();
    paymentTotals.forEach((item) => {
      const partyKey = String(item._id.partyId);
      const entryType = item._id.entryType as 'credit' | 'debit';
      const current = paymentMap.get(partyKey) || { debit: 0, credit: 0 };
      current[entryType] += Number(item.totalAmount || 0);
      paymentMap.set(partyKey, current);
    });

    const results = customers.map((customer) => {
      const openingAmount = Number(customer.openingBalance || 0);
      const openingDebit = customer.balanceType === 'debit' ? openingAmount : 0;
      const openingCredit = customer.balanceType === 'credit' ? openingAmount : 0;

      const quotationAmount = quotationMap.get(String(customer._id)) || 0;
      const payments = paymentMap.get(String(customer._id)) || { debit: 0, credit: 0 };

      const totalDebit = openingDebit + quotationAmount + payments.debit;
      const totalCredit = openingCredit + payments.credit;
      const closing = computeClosingBalance(totalDebit, totalCredit);

      return {
        customer,
        totalDebit,
        totalCredit,
        closingBalance: closing,
      };
    });

    res.status(200).json({ customers: results });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
    res.status(500).json({ error: 'Failed to fetch customer closing balances', message: errorMessage });
  }
};

export const listVendorClosingBalances = async (req: Request, res: Response) => {
  try {
    const businessId = req.user?.businessInfo?.businessId;
    if (!businessId) return;
    const vendors = await Vendor
                            .find({ businessId, isDeleted: { $ne: true } })
                            .sort({ createdAt: -1 });

    const quotationTotals = await Quotation.aggregate([
      { $match: { businessId: normalizeObjectId(businessId), isDeleted: { $ne: true }, vendorId: { $ne: null } } },
      { $group: { _id: '$vendorId', totalAmount: { $sum: '$totalAmount' } } }
    ]);

    const paymentTotals = await Payments.aggregate([
      { $match: { businessId: normalizeObjectId(businessId), party: 'Vendor', isDeleted: { $ne: true } } },
      { $group: { _id: { partyId: '$partyId', entryType: '$entryType' }, totalAmount: { $sum: '$amount' } } }
    ]);

    console.log(paymentTotals, 'Payment Totals');
    console.log(quotationTotals, 'Quotation Totals');

    const quotationMap = new Map<string, number>();
    quotationTotals.forEach((item) => quotationMap.set(String(item._id), Number(item.totalAmount || 0)));

    const paymentMap = new Map<string, { debit: number; credit: number }>();
    paymentTotals.forEach((item) => {
      const partyKey = String(item._id.partyId);
      const entryType = item._id.entryType as 'credit' | 'debit';
      const current = paymentMap.get(partyKey) || { debit: 0, credit: 0 };
      current[entryType] += Number(item.totalAmount || 0);
      paymentMap.set(partyKey, current);
    });

    const results = vendors.map((vendor) => {
      const openingAmount = Number(vendor.openingBalance || 0);
      const openingDebit = vendor.balanceType === 'debit' ? openingAmount : 0;
      const openingCredit = vendor.balanceType === 'credit' ? openingAmount : 0;

      const quotationAmount = quotationMap.get(String(vendor._id)) || 0;
      const payments = paymentMap.get(String(vendor._id)) || { debit: 0, credit: 0 };

      const totalDebit = openingDebit + payments.debit;
      const totalCredit = openingCredit + quotationAmount + payments.credit;
      const closing = computeClosingBalance(totalDebit, totalCredit);

      return {
        vendor,
        totalDebit,
        totalCredit,
        closingBalance: closing,
      };
    });

    res.status(200).json({ vendors: results });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
    res.status(500).json({ error: 'Failed to fetch vendor closing balances', message: errorMessage });
  }
};

const normalizeObjectId = (value: unknown) => {
  if (!value) return value;
  if (value instanceof mongoose.Types.ObjectId) return value;
  if (mongoose.isValidObjectId(String(value))) {
    return new mongoose.Types.ObjectId(String(value));
  }
  return value;
};


export const getCustomerLedger = async (req: Request, res: Response) => {
  try {
    const businessId = req.user?.businessInfo?.businessId;
    if (!businessId) return;
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({ message: 'Invalid customer ID' });
      return;
    }

    const customer = await Customer.findOne({ _id: id, businessId, isDeleted: { $ne: true } });
    if (!customer) {
      res.status(404).json({ message: 'Customer not found' });
      return;
    }

    const quotations = await Quotation.find({
      businessId,
      customerId: customer._id,
      isDeleted: { $ne: true }
    }).sort({ createdAt: 1 });

    const quotationIds = quotations
          .map((quotation) => quotation?._id)
          .filter((id) => mongoose.isValidObjectId(String(id)))
          .map((id) => new mongoose.Types.ObjectId(String(id)));

    console.log(quotationIds, 'Quotation IDs')

    const paymentBaseMatch: any = { isDeleted: { $ne: true } };

    if (businessId) {
      paymentBaseMatch.businessId = normalizeObjectId(businessId);
    }

    const allocationTotals = await Payments.aggregate([
      { $match: { ...paymentBaseMatch, party: 'Customer' } },
      { $unwind: '$allocations' },
      { $match: { 'allocations.quotationId': { $in: quotationIds } } },
      { $group: { _id: '$allocations.quotationId', totalAllocated: { $sum: '$allocations.amount' } } }
    ]);

    console.log(businessId, allocationTotals);


    const allocationMap = new Map<string, number>();
    allocationTotals.forEach((item) => {
      allocationMap.set(String(item._id), Number(item.totalAllocated || 0));
    });

    const payments = await Payments.
      find(getPaymentMatch(businessId, 'Customer', toObjectIdStrict(customer._id)))
      .populate('bankId')
      .populate({ path: "partyId", select: "name companyName"})
      .populate({ path: 'allocations.quotationId', select: 'customId' })
      .sort({ paymentDate: -1 });

    const entries: LedgerEntry[] = [];

    if (customer.openingBalance && customer.balanceType) {
      entries.push({
        type: 'opening',
        entryType: customer.balanceType,
        date: customer.createdAt || new Date(),
        amount: Number(customer.openingBalance),
      });
    }

    quotations.forEach((quotation) => {
      entries.push({
        type: 'quotation',
        entryType: 'debit',
        date: quotation.createdAt || new Date(),
        data: quotation,
        amount: getQuotationAmountForParty(quotation, 'Customer'),
        referenceId: toObjectIdStrict(quotation._id),
        customId: quotation.customId,
        notes: quotation.remarks,
        paymentStatus: (() => {
          const totalAmount = getQuotationAmountForParty(quotation, 'Customer');
          const allocated = allocationMap.get(String(quotation._id)) || 0;
          if (totalAmount <= 0 || allocated <= 0) return 'none';
          if (allocated >= totalAmount) return 'paid';
          return 'partial';
        })(),
        allocatedAmount: allocationMap.get(String(quotation._id)) || 0,
        outstandingAmount: (() => {
          const totalAmount = getQuotationAmountForParty(quotation, 'Customer');
          const allocated = allocationMap.get(String(quotation._id)) || 0;
          return totalAmount - allocated;
        })(),
      });
    });

    payments.forEach((payment) => {
      appendPaymentEntriesForLedger(entries, payment);
    });

    const totals = entries.reduce(
      (acc, entry) => {
        acc[entry.entryType] += entry.amount;
        return acc;
      },
      { debit: 0, credit: 0 }
    );

    const closing = computeClosingBalance(totals.debit, totals.credit);

    const sortedEntries = entries
      .slice()
      .sort((a, b) => {
        if (a.type === 'opening' && b.type !== 'opening') return -1;
        if (b.type === 'opening' && a.type !== 'opening') return 1;
        return a.date.getTime() - b.date.getTime();
      });

    let runningDebit = 0;
    let runningCredit = 0;
    sortedEntries.forEach((entry) => {
      if (entry.entryType === 'debit') {
        runningDebit += entry.amount;
      } else {
        runningCredit += entry.amount;
      }
      entry.closingBalance = computeClosingBalance(runningDebit, runningCredit);
    });

    res.status(200).json({
      party: { type: 'Customer', id: customer._id, name: customer.name },
      openingBalance: {
        amount: Number(customer.openingBalance || 0),
        balanceType: customer.balanceType || null,
      },
      entries: sortedEntries.reverse(),
      totals,
      closingBalance: closing,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
    res.status(500).json({ error: 'Failed to fetch customer ledger', message: errorMessage });
  }
};

export const getVendorLedger = async (req: Request, res: Response) => {
  try {
    const businessId = requireBusinessId(req, res);
    if (!businessId) return;
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({ message: 'Invalid vendor ID' });
      return;
    }

    const vendor = await Vendor.findOne({ _id: id, businessId, isDeleted: { $ne: true } });
    if (!vendor) {
      res.status(404).json({ message: 'Vendor not found' });
      return;
    }

    const quotations = await Quotation.find({
      businessId,
      vendorId: vendor._id,
      isDeleted: { $ne: true },
    }).sort({ createdAt: 1 });

     const quotationIds = quotations
          .map((quotation) => quotation?._id)
          .filter((id) => mongoose.isValidObjectId(String(id)))
          .map((id) => new mongoose.Types.ObjectId(String(id)));

    console.log(quotationIds, 'Quotation IDs')

    const paymentBaseMatch: any = { isDeleted: { $ne: true } };

    if (businessId) {
      paymentBaseMatch.businessId = normalizeObjectId(businessId);
    }

    const allocationTotals = await Payments.aggregate([
      { $match: { ...paymentBaseMatch, party: 'Vendor' } },
      { $unwind: '$allocations' },
      { $match: { 'allocations.quotationId': { $in: quotationIds } } },
      { $group: { _id: '$allocations.quotationId', totalAllocated: { $sum: '$allocations.amount' } } }
    ]);

    const allocationMap = new Map<string, number>();
    allocationTotals.forEach((item) => {
      allocationMap.set(String(item._id), Number(item.totalAllocated || 0));
    });

    const payments = await Payments
        .find(getPaymentMatch(businessId, 'Vendor', toObjectIdStrict(vendor._id)))
        .populate('bankId')
        .populate({ path: "partyId", select: "name companyName"})
        .populate({ path: 'allocations.quotationId', select: 'customId' })
        .sort({ paymentDate: -1 });

    const entries: LedgerEntry[] = [];

    if (vendor.openingBalance && vendor.balanceType) {
      entries.push({
        type: 'opening',
        entryType: vendor.balanceType,
        date: vendor.createdAt || new Date(),
        amount: Number(vendor.openingBalance),
      });
    }

    quotations.forEach((quotation) => {
      entries.push({
        type: 'quotation',
        entryType: 'debit',
        date: quotation.createdAt || new Date(),
        data: quotation,
        amount: getQuotationAmountForParty(quotation, 'Vendor'),
        referenceId: toObjectIdStrict(quotation._id),
        customId: quotation.customId,
        notes: quotation.remarks,
        paymentStatus: (() => {
          const totalAmount = getQuotationAmountForParty(quotation, 'Vendor');
          const allocated = allocationMap.get(String(quotation._id)) || 0;
          if (totalAmount <= 0 || allocated <= 0) return 'none';
          if (allocated >= totalAmount) return 'paid';
          return 'partial';
        })(),
        allocatedAmount: allocationMap.get(String(quotation._id)) || 0,
        outstandingAmount: (() => {
          const totalAmount = getQuotationAmountForParty(quotation, 'Vendor');
          const allocated = allocationMap.get(String(quotation._id)) || 0;
          return totalAmount - allocated;
        })(),
      });
    });

    payments.forEach((payment) => {
      appendPaymentEntriesForLedger(entries, payment);
    });

    const totals = entries.reduce(
      (acc, entry) => {
        acc[entry.entryType] += entry.amount;
        return acc;
      },
      { debit: 0, credit: 0 }
    );

    const closing = computeClosingBalance(totals.debit, totals.credit);

    const sortedEntries = entries
      .slice()
      .sort((a, b) => {
        if (a.type === 'opening' && b.type !== 'opening') return -1;
        if (b.type === 'opening' && a.type !== 'opening') return 1;
        return a.date.getTime() - b.date.getTime();
      });

    let runningDebit = 0;
    let runningCredit = 0;
    sortedEntries.forEach((entry) => {
      if (entry.entryType === 'debit') {
        runningDebit += entry.amount;
      } else {
        runningCredit += entry.amount;
      }
      entry.closingBalance = computeClosingBalance(runningDebit, runningCredit);
    });

    res.status(200).json({
      party: { type: 'vendor', id: vendor._id, name: vendor.companyName },
      openingBalance: {
        amount: Number(vendor.openingBalance || 0),
        balanceType: vendor.balanceType || null,
      },
      entries: sortedEntries.reverse(),
      totals,
      closingBalance: closing,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
    res.status(500).json({ error: 'Failed to fetch vendor ledger', message: errorMessage });
  }
};

export const getCustomerUnsettledQuotations = async (req: Request, res: Response) => {
  try {
    const businessId = requireBusinessId(req, res);
    if (!businessId) return;
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({ message: 'Invalid customer ID' });
      return;
    }
    const unsettled = await getUnsettledQuotations(businessId, 'Customer', new mongoose.Types.ObjectId(id));
    res.status(200).json({ quotations: unsettled });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
    res.status(500).json({ error: 'Failed to fetch unsettled customer quotations', message: errorMessage });
  }
};

export const getVendorUnsettledQuotations = async (req: Request, res: Response) => {
  try {
    const businessId = requireBusinessId(req, res);
    if (!businessId) return;
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({ message: 'Invalid vendor ID' });
      return;
    }
    const unsettled = await getUnsettledQuotations(businessId, 'Vendor', new mongoose.Types.ObjectId(id));
    res.status(200).json({ quotations: unsettled });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
    res.status(500).json({ error: 'Failed to fetch unsettled vendor quotations', message: errorMessage });
  }
};

export const getCustomerUnallocatedPayments = async (req: Request, res: Response) => {
  try {
    const businessId = requireBusinessId(req, res);
    if (!businessId) return;
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({ message: 'Invalid customer ID' });
      return;
    }

    const payments = await Payments.find({
      businessId,
      party: 'Customer',
      partyId: new mongoose.Types.ObjectId(id),
      isDeleted: { $ne: true },
      unallocatedAmount: { $gt: 0 },
    })
      .populate('bankId')
      .sort({ paymentDate: -1, createdAt: -1 });

    res.status(200).json({ payments });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
    res.status(500).json({ error: 'Failed to fetch unallocated customer payments', message: errorMessage });
  }
};

export const getVendorUnallocatedPayments = async (req: Request, res: Response) => {
  try {
    const businessId = requireBusinessId(req, res);
    if (!businessId) return;
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({ message: 'Invalid vendor ID' });
      return;
    }

    const payments = await Payments.find({
      businessId,
      party: 'Vendor',
      partyId: new mongoose.Types.ObjectId(id),
      isDeleted: { $ne: true },
      unallocatedAmount: { $gt: 0 },
    })
      .populate('bankId')
      .sort({ paymentDate: -1, createdAt: -1 });

    res.status(200).json({ payments });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
    res.status(500).json({ error: 'Failed to fetch unallocated vendor payments', message: errorMessage });
  }
};

const allocatePaymentToQuotation = async (
  req: Request,
  res: Response,
  party: PartyType
) => {
  try {
    const businessId = requireBusinessId(req, res);
    if (!businessId) return;
    const { paymentId } = req.params;
    const { quotationId, amount } = req.body;

    if (!mongoose.isValidObjectId(paymentId)) {
      res.status(400).json({ message: 'Invalid payment ID' });
      return;
    }

    if (!quotationId || !mongoose.isValidObjectId(quotationId)) {
      res.status(400).json({ message: 'Valid quotationId is required' });
      return;
    }

    const allocationAmount = Number(amount);
    if (!Number.isFinite(allocationAmount) || allocationAmount <= 0) {
      res.status(400).json({ message: 'Allocation amount must be greater than 0' });
      return;
    }

    const payment = await Payments.findOne({
      _id: paymentId,
      businessId,
      party,
      isDeleted: { $ne: true },
    });

    if (!payment) {
      res.status(404).json({ message: 'Payment not found' });
      return;
    }

    const unallocatedAmount = Number(payment.unallocatedAmount || 0);
    if (allocationAmount > unallocatedAmount) {
      res.status(400).json({ message: 'Allocation amount exceeds unallocated amount' });
      return;
    }

    const allocationPayload = buildAllocationPayload(
      JSON.stringify([{ quotationId, amount: allocationAmount }]),
      party
    );

    await validatePartyQuotationLinks(
      party,
      payment.partyId,
      businessId,
      allocationPayload
    );

    payment.allocations = [...(payment.allocations || []), ...allocationPayload];
    payment.unallocatedAmount = unallocatedAmount - allocationAmount;

    await payment.save();

    res.status(200).json({ payment });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
    res.status(500).json({ error: 'Failed to allocate payment', message: errorMessage });
  }
};

export const allocateCustomerPaymentToQuotation = async (req: Request, res: Response) =>
  allocatePaymentToQuotation(req, res, 'Customer');

export const allocateVendorPaymentToQuotation = async (req: Request, res: Response) =>
  allocatePaymentToQuotation(req, res, 'Vendor');

const allocatePaymentsToQuotation = async (
  req: Request,
  res: Response,
  party: PartyType
) => {
  const businessId = requireBusinessId(req, res);
  if (!businessId) return;
  const { quotationId } = req.params;
  const { allocations } = req.body;

  if (!quotationId || !mongoose.isValidObjectId(quotationId)) {
    res.status(400).json({ message: 'Valid quotationId is required' });
    return;
  }

  if (!Array.isArray(allocations) || allocations.length === 0) {
    res.status(400).json({ message: 'Allocations are required' });
    return;
  }

  const uniquePaymentIds = new Set<string>();
  for (const allocation of allocations) {
    if (!allocation?.paymentId || !mongoose.isValidObjectId(allocation.paymentId)) {
      res.status(400).json({ message: 'Valid paymentId is required for each allocation' });
      return;
    }
    const allocationAmount = Number(allocation.amount);
    if (!Number.isFinite(allocationAmount) || allocationAmount <= 0) {
      res.status(400).json({ message: 'Allocation amount must be greater than 0' });
      return;
    }
    uniquePaymentIds.add(String(allocation.paymentId));
  }

  if (uniquePaymentIds.size !== allocations.length) {
    res.status(400).json({ message: 'Duplicate paymentId entries are not allowed' });
    return;
  }

  const session = await mongoose.startSession();
  try {
    let updatedPayments: any[] = [];

    await session.withTransaction(async () => {
      const quotation = await Quotation.findOne({
        _id: quotationId,
        businessId,
        isDeleted: { $ne: true },
      })
        .select('customerId vendorId')
        .session(session);

      if (!quotation) {
        throw new Error('Quotation not found');
      }

      const expectedPartyId = party === 'Customer' ? quotation.customerId : quotation.vendorId;
      if (!expectedPartyId) {
        throw new Error('Quotation is missing customer or vendor');
      }

      const paymentIds = allocations.map((allocation: any) => allocation.paymentId);
      const payments = await Payments.find({
        _id: { $in: paymentIds },
        businessId,
        party,
        isDeleted: { $ne: true },
      }).session(session);

      if (payments.length !== allocations.length) {
        throw new Error('One or more payments not found');
      }

      const paymentMap = new Map<string, typeof payments[number]>();
      payments.forEach((payment) => {
        paymentMap.set(String(payment._id), payment);
      });

      for (const allocation of allocations) {
        const payment = paymentMap.get(String(allocation.paymentId));
        if (!payment) {
          throw new Error('Payment not found');
        }
        if (String(payment.partyId) !== String(expectedPartyId)) {
          throw new Error('Payment party does not match quotation party');
        }
        const allocationAmount = Number(allocation.amount);
        const unallocatedAmount = Number(payment.unallocatedAmount || 0);
        if (allocationAmount > unallocatedAmount) {
          throw new Error('Allocation amount exceeds unallocated amount');
        }
      }

      updatedPayments = [];
      for (const allocation of allocations) {
        const payment = paymentMap.get(String(allocation.paymentId));
        if (!payment) continue;

        const allocationAmount = Number(allocation.amount);
        const allocationPayload = buildAllocationPayload(
          JSON.stringify([{ quotationId, amount: allocationAmount }]),
          party
        );

        payment.allocations = [...(payment.allocations || []), ...allocationPayload];
        payment.unallocatedAmount = Number(payment.unallocatedAmount || 0) - allocationAmount;

        await payment.save({ session });
        updatedPayments.push(payment);
      }
    });

    res.status(200).json({ payments: updatedPayments });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Something went wrong';
    if (message === 'Quotation not found') {
      res.status(404).json({ message });
      return;
    }
    if (message === 'One or more payments not found' || message === 'Payment not found') {
      res.status(404).json({ message });
      return;
    }
    if (
      message === 'Quotation is missing customer or vendor' ||
      message === 'Payment party does not match quotation party' ||
      message === 'Allocation amount exceeds unallocated amount'
    ) {
      res.status(400).json({ message });
      return;
    }
    res.status(500).json({ error: 'Failed to allocate payments', message });
  } finally {
    session.endSession();
  }
};

export const allocateCustomerPaymentsToQuotation = async (req: Request, res: Response) =>
  allocatePaymentsToQuotation(req, res, 'Customer');

export const allocateVendorPaymentsToQuotation = async (req: Request, res: Response) =>
  allocatePaymentsToQuotation(req, res, 'Vendor');

export const createCustomerPayment = async (req: Request, res: Response) => {
  try {
    const businessId = requireBusinessId(req, res);
    if (!businessId) return;
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({ message: 'Invalid customer ID' });
      return;
    }

    const { 
      bankId,
      amount,
      entryType,
      paymentDate,
      status,
      internalNotes,
      allocations,
      customId,
      paymentType,
      paymentBreakdown,
      amountCurrency,
      amountRoe,
      amountNotes,
      bankCharges,
      bankChargesRoe,
      bankChargesCurrency,
      bankChargesNotes,
      cashback,
      cashbackRoe,
      cashbackCurrency,
      cashbackNotes,
    } = req.body;
    if (!bankId || (!mongoose.isValidObjectId(bankId) && bankId !== 'cash')) {
      res.status(400).json({ message: 'Valid bankId is required' });
      return;
    }

    const allocationPayload = buildAllocationPayload(allocations, 'Customer');
    const allocationTotal = sumAllocationAmount(allocationPayload);
    if (allocationTotal > Number(amount)) {
      res.status(400).json({ message: 'Allocation total exceeds payment amount' });
      return;
    }

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
          `payments/${req.user?.businessInfo?.businessId}`
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

    await validatePartyQuotationLinks(
      'Customer',
      new mongoose.Types.ObjectId(id),
      businessId,
      allocationPayload
    );

    const payment = await Payments.create({
      party: 'Customer',
      partyId: new mongoose.Types.ObjectId(id),
      businessId,
      bankId: bankId === 'cash' ? null : bankId,
      amount: Number(amount),
      entryType,
      status,
      paymentDate,
      paymentType,
      documents: uploadedDocuments,
      internalNotes,
      customId,
      allocations: allocationPayload,
      unallocatedAmount: Number(amount) - allocationTotal,
      paymentBreakdown,
      amountCurrency,
      amountRoe,
      amountNotes,
      bankCharges,
      bankChargesRoe,
      bankChargesCurrency,
      bankChargesNotes,
      cashback,
      cashbackRoe,
      cashbackCurrency,
      cashbackNotes,
    });

    res.status(201).json({ payment });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
    res.status(500).json({ error: 'Failed to create customer payment', message: errorMessage });
  }
};

export const createVendorPayment = async (req: Request, res: Response) => {
  try {
    const businessId = requireBusinessId(req, res);
    if (!businessId) return;
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({ message: 'Invalid vendor ID' });
      return;
    }

    const { 
      bankId,
      amount,
      entryType,
      paymentDate,
      status,
      internalNotes,
      allocations,
      customId,
      paymentType,
      paymentBreakdown,
      amountCurrency,
      amountRoe,
      amountNotes,
      bankCharges,
      bankChargesRoe,
      bankChargesCurrency,
      bankChargesNotes,
      cashback,
      cashbackRoe,
      cashbackCurrency,
      cashbackNotes,
    } = req.body;
    if (!bankId || (!mongoose.isValidObjectId(bankId) && bankId !== 'cash')) {
      res.status(400).json({ message: 'Valid bankId is required' });
      return;
    }

    const allocationPayload = buildAllocationPayload(allocations, 'Vendor');
    const allocationTotal = sumAllocationAmount(allocationPayload);
    if (allocationTotal > Number(amount)) {
      res.status(400).json({ message: 'Allocation total exceeds payment amount' });
      return;
    }

    await validatePartyQuotationLinks(
      'Vendor',
      new mongoose.Types.ObjectId(id),
      businessId,
      allocationPayload
    );

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
          `payments/${req.user?.businessInfo?.businessId}`
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

    const payment = await Payments.create({
      party: 'Vendor',
      partyId: new mongoose.Types.ObjectId(id),
      businessId,
      bankId: bankId === 'cash' ? null : bankId,
      amount: Number(amount),
      entryType,
      documents: uploadedDocuments,
      status,
      paymentDate,
      paymentType,
      customId,
      internalNotes,
      allocations: allocationPayload,
      unallocatedAmount: Number(amount) - allocationTotal,
      paymentBreakdown,
      amountCurrency,
      amountRoe,
      amountNotes,
      bankCharges,
      bankChargesRoe,
      bankChargesCurrency,
      bankChargesNotes,
      cashback,
      cashbackRoe,
      cashbackCurrency,
      cashbackNotes,
    });

    res.status(201).json({ payment });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
    res.status(500).json({ error: 'Failed to create vendor payment', message: errorMessage });
  }
};

export const createPaymentForQuotation = async (req: Request, res: Response) => {
  try {
    const businessId = requireBusinessId(req, res);
    if (!businessId) return;
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({ message: 'Invalid quotation ID' });
      return;
    }

    const quotation = await Quotation.findOne({ _id: id, businessId, isDeleted: { $ne: true } });
    if (!quotation) {
      res.status(404).json({ message: 'Quotation not found' });
      return;
    }

    const { bankId, amount, entryType, paymentDate, status, internalNotes, allocationAmount, party } = req.body;
    if (!bankId || !mongoose.isValidObjectId(bankId)) {
      res.status(400).json({ message: 'Valid bankId is required' });
      return;
    }

    let resolvedParty: PartyType | null = null;
    let resolvedPartyId: mongoose.Types.ObjectId | null = null;

    if (quotation.customerId && quotation.vendorId) {
      if (!party || !['Customer', 'Vendor'].includes(party)) {
        res.status(400).json({ message: 'party is required when quotation has both customer and vendor' });
        return;
      }
      resolvedParty = party;
    } else if (quotation.customerId) {
      resolvedParty = 'Customer';
    } else if (quotation.vendorId) {
      resolvedParty = 'Vendor';
    }

    if (!resolvedParty) {
      res.status(400).json({ message: 'Quotation is missing customer or vendor' });
      return;
    }

    resolvedPartyId = resolvedParty === 'Customer'
      ? new mongoose.Types.ObjectId(quotation.customerId)
      : new mongoose.Types.ObjectId(quotation.vendorId);

    const allocationTotal = Number(allocationAmount ?? amount);
    if (allocationTotal > Number(amount)) {
      res.status(400).json({ message: 'Allocation total exceeds payment amount' });
      return;
    }

    const allocationPayload = buildAllocationPayload(
      JSON.stringify([{ quotationId: id, amount: allocationTotal }]),
      resolvedParty
    );

    await validatePartyQuotationLinks(resolvedParty, resolvedPartyId, businessId, allocationPayload);

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
          `payments/${req.user?.businessInfo?.businessId}`
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

    const payment = await Payments.create({
      party: resolvedParty,
      partyId: resolvedPartyId,
      businessId,
      bankId,
      amount: Number(amount),
      entryType,
      documents: uploadedDocuments,
      status,
      paymentDate,
      internalNotes,
      allocations: allocationPayload,
      unallocatedAmount: Number(amount) - allocationTotal,
    });

    res.status(201).json({ payment });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
    res.status(500).json({ error: 'Failed to create quotation payment', message: errorMessage });
  }
};

export const getQuotationLedger = async (req: Request, res: Response) => {
  try {
    const businessId = requireBusinessId(req, res);
    if (!businessId) return;
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({ message: 'Invalid quotation ID' });
      return;
    }

    const quotation = await Quotation.findOne({ _id: id, businessId, isDeleted: { $ne: true } });
    if (!quotation) {
      res.status(404).json({ message: 'Quotation not found' });
      return;
    }

    const party: PartyType | null = quotation.customerId ? 'Customer' : quotation.vendorId ? 'Vendor' : null;
    if (!party) {
      res.status(400).json({ message: 'Quotation is missing customer or vendor' });
      return;
    }

    const payments = await Payments.aggregate([
      { $match: { businessId, party, isDeleted: { $ne: true } } },
      { $unwind: '$allocations' },
      { $match: { 'allocations.quotationId': quotation._id } },
      {
        $project: {
          _id: 1,
          partyId: 1,
          amount: 1,
          entryType: 1,
          paymentDate: 1,
          internalNotes: 1,
          allocationAmount: '$allocations.amount',
          amountType: '$allocations.amountType',
        }
      },
      { $sort: { paymentDate: -1 } }
    ]);

    const totalAllocated = payments.reduce((total, payment) => total + Number(payment.allocationAmount || 0), 0);
    const quotationAmount = getQuotationAmountForParty(quotation, party);

    res.status(200).json({
      quotation,
      party,
      totalAmount: quotationAmount,
      totalAllocated,
      outstandingAmount: quotationAmount - totalAllocated,
      payments,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
    res.status(500).json({ error: 'Failed to fetch quotation ledger', message: errorMessage });
  }
};

export const updatePayment = async (req: Request, res: Response) => {
  try {
    const businessId = requireBusinessId(req, res);
    if (!businessId) return;
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({ message: 'Invalid payment ID' });
      return;
    }

    const payment = await Payments.findOne({ _id: id, businessId, isDeleted: { $ne: true } });
    if (!payment) {
      res.status(404).json({ message: 'Payment not found' });
      return;
    }

    const { bankId, amount, entryType, paymentDate, status, internalNotes, allocations, paymentType } = req.body;
    if (bankId && !mongoose.isValidObjectId(bankId)) {
      res.status(400).json({ message: 'Valid bankId is required' });
      return;
    }

    const nextAmount = amount !== undefined ? Number(amount) : payment.amount;
    const allocationPayload = allocations ? buildAllocationPayload(allocations, payment.party) : payment.allocations;
    const allocationTotal = sumAllocationAmount(allocationPayload || []);

    if (allocationTotal > nextAmount) {
      res.status(400).json({ message: 'Allocation total exceeds payment amount' });
      return;
    }

    await validatePartyQuotationLinks(payment.party, payment.partyId, businessId, allocationPayload || []);

    payment.bankId = bankId ? new mongoose.Types.ObjectId(bankId) : payment.bankId;
    payment.amount = nextAmount;
    payment.entryType = entryType || payment.entryType;
    payment.status = status || payment.status;
    payment.paymentDate = paymentDate || payment.paymentDate;
    payment.internalNotes = internalNotes !== undefined ? internalNotes : payment.internalNotes;
    payment.allocations = allocationPayload || [];
    payment.unallocatedAmount = nextAmount - allocationTotal;
    payment.paymentType = paymentType || payment.paymentType;

    await payment.save();
    res.status(200).json({ payment });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
    res.status(500).json({ error: 'Failed to update payment', message: errorMessage });
  }
};

export const deletePayment = async (req: Request, res: Response) => {
  try {
    const businessId = requireBusinessId(req, res);
    if (!businessId) return;
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({ message: 'Invalid payment ID' });
      return;
    }

    const payment = await Payments.findOneAndUpdate(
      { _id: id, businessId, isDeleted: { $ne: true } },
      { isDeleted: true },
      { new: true }
    );

    if (!payment) {
      res.status(404).json({ message: 'Payment not found' });
      return;
    }

    res.status(200).json({ message: 'Payment deleted successfully' });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
    res.status(500).json({ error: 'Failed to delete payment', message: errorMessage });
  }
};

export const listPayments = async (req: Request, res: Response) => {
  try {
    const businessId = requireBusinessId(req, res);
    if (!businessId) return;
    const { party, partyId, status, isDeleted, startDate, endDate } = req.query;

    const filter: any = { businessId };
    if (party && (party === 'Customer' || party === 'Vendor')) {
      filter.party = party;
    }
    if (partyId && mongoose.isValidObjectId(String(partyId))) {
      filter.partyId = new mongoose.Types.ObjectId(String(partyId));
    }
    if (status && ['pending', 'approved', 'denied'].includes(String(status))) {
      filter.status = status;
    }
    if (isDeleted !== undefined) {
      filter.isDeleted = String(isDeleted) === 'true';
    } else {
      filter.isDeleted = { $ne: true };
    }
    if (startDate || endDate) {
      filter.paymentDate = {};
      if (startDate) {
        filter.paymentDate.$gte = new Date(String(startDate));
      }
      if (endDate) {
        filter.paymentDate.$lte = new Date(String(endDate));
      }
    }

    const payments = await Payments.find(filter)
      .populate("bankId")
      .populate({ path: "allocations.quotationId", select: "customId quotationType" })
      .populate({ path: "partyId", select: "name companyName"})
      .sort({ paymentDate: -1, createdAt: -1 });

    res.status(200).json({ payments });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
    res.status(500).json({ error: 'Failed to fetch payments', message: errorMessage });
  }
};
