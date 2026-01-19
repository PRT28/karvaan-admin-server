import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Payments, { PartyType, PaymentAmountType } from '../models/Payments';
import Customer from '../models/Customer';
import Vendor from '../models/Vendors';
import Quotation, { IQuotation } from '../models/Quotation';

type LedgerEntryType = 'opening' | 'quotation' | 'payment';

const getBusinessId = (req: Request) => req.user?.businessId || req.user?._id;

const getQuotationAmountForParty = (quotation: IQuotation, party: PartyType) => {
  const baseAmount = Number(quotation.totalAmount ?? 0);
  if (party !== 'vendor') return baseAmount;

  const formFields: any = quotation.formFields;
  if (!formFields) return baseAmount;

  const candidateKeys = ['costAmount', 'costPrice', 'vendorCost', 'purchaseAmount'];
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
  allocations: Array<{ quotationId: string; amount: number }> | undefined,
  party: PartyType
) => {
  if (!allocations || allocations.length === 0) return [];
  const amountType: PaymentAmountType = party === 'vendor' ? 'cost' : 'selling';
  return allocations.map((allocation) => ({
    quotationId: new mongoose.Types.ObjectId(allocation.quotationId),
    amount: Number(allocation.amount),
    amountType,
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
  if (party === 'customer') {
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
  if (party === 'customer') {
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
    const businessId = getBusinessId(req);
    const customers = await Customer.find({ businessId, isDeleted: { $ne: true } }).sort({ createdAt: -1 });

    const quotationTotals = await Quotation.aggregate([
      { $match: { businessId, isDeleted: { $ne: true }, customerId: { $ne: null } } },
      { $group: { _id: '$customerId', totalAmount: { $sum: '$totalAmount' } } }
    ]);

    const paymentTotals = await Payments.aggregate([
      { $match: { businessId, party: 'customer', isDeleted: { $ne: true } } },
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
    const businessId = getBusinessId(req);
    const vendors = await Vendor.find({ businessId, isDeleted: { $ne: true } }).sort({ createdAt: -1 });

    const quotationTotals = await Quotation.aggregate([
      { $match: { businessId, isDeleted: { $ne: true }, vendorId: { $ne: null } } },
      { $group: { _id: '$vendorId', totalAmount: { $sum: '$totalAmount' } } }
    ]);

    const paymentTotals = await Payments.aggregate([
      { $match: { businessId, party: 'vendor', isDeleted: { $ne: true } } },
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

export const getCustomerLedger = async (req: Request, res: Response) => {
  try {
    const businessId = getBusinessId(req);
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
      isDeleted: { $ne: true },
    }).sort({ createdAt: -1 });

    const payments = await Payments.find(getPaymentMatch(businessId, 'customer', customer._id)).sort({ paymentDate: -1 });

    const entries: Array<{
      type: LedgerEntryType;
      entryType: 'credit' | 'debit';
      date: Date;
      amount: number;
      referenceId?: mongoose.Types.ObjectId;
      notes?: string;
      allocations?: any[];
    }> = [];

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
        amount: getQuotationAmountForParty(quotation, 'customer'),
        referenceId: quotation._id,
        notes: quotation.remarks,
      });
    });

    payments.forEach((payment) => {
      entries.push({
        type: 'payment',
        entryType: payment.entryType,
        date: payment.paymentDate || payment.createdAt,
        amount: payment.amount,
        referenceId: payment._id,
        notes: payment.internalNotes,
        allocations: payment.allocations,
      });
    });

    const totals = entries.reduce(
      (acc, entry) => {
        acc[entry.entryType] += entry.amount;
        return acc;
      },
      { debit: 0, credit: 0 }
    );

    const closing = computeClosingBalance(totals.debit, totals.credit);

    res.status(200).json({
      party: { type: 'customer', id: customer._id, name: customer.name },
      openingBalance: {
        amount: Number(customer.openingBalance || 0),
        balanceType: customer.balanceType || null,
      },
      entries,
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
    const businessId = getBusinessId(req);
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
    }).sort({ createdAt: -1 });

    const payments = await Payments.find(getPaymentMatch(businessId, 'vendor', vendor._id)).sort({ paymentDate: -1 });

    const entries: Array<{
      type: LedgerEntryType;
      entryType: 'credit' | 'debit';
      date: Date;
      amount: number;
      referenceId?: mongoose.Types.ObjectId;
      notes?: string;
      allocations?: any[];
    }> = [];

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
        entryType: 'credit',
        date: quotation.createdAt || new Date(),
        amount: getQuotationAmountForParty(quotation, 'vendor'),
        referenceId: quotation._id,
        notes: quotation.remarks,
      });
    });

    payments.forEach((payment) => {
      entries.push({
        type: 'payment',
        entryType: payment.entryType,
        date: payment.paymentDate || payment.createdAt,
        amount: payment.amount,
        referenceId: payment._id,
        notes: payment.internalNotes,
        allocations: payment.allocations,
      });
    });

    const totals = entries.reduce(
      (acc, entry) => {
        acc[entry.entryType] += entry.amount;
        return acc;
      },
      { debit: 0, credit: 0 }
    );

    const closing = computeClosingBalance(totals.debit, totals.credit);

    res.status(200).json({
      party: { type: 'vendor', id: vendor._id, name: vendor.companyName },
      openingBalance: {
        amount: Number(vendor.openingBalance || 0),
        balanceType: vendor.balanceType || null,
      },
      entries,
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
    const businessId = getBusinessId(req);
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({ message: 'Invalid customer ID' });
      return;
    }
    const unsettled = await getUnsettledQuotations(businessId, 'customer', new mongoose.Types.ObjectId(id));
    res.status(200).json({ quotations: unsettled });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
    res.status(500).json({ error: 'Failed to fetch unsettled customer quotations', message: errorMessage });
  }
};

export const getVendorUnsettledQuotations = async (req: Request, res: Response) => {
  try {
    const businessId = getBusinessId(req);
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({ message: 'Invalid vendor ID' });
      return;
    }
    const unsettled = await getUnsettledQuotations(businessId, 'vendor', new mongoose.Types.ObjectId(id));
    res.status(200).json({ quotations: unsettled });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
    res.status(500).json({ error: 'Failed to fetch unsettled vendor quotations', message: errorMessage });
  }
};

export const createCustomerPayment = async (req: Request, res: Response) => {
  try {
    const businessId = getBusinessId(req);
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({ message: 'Invalid customer ID' });
      return;
    }

    const { bankId, amount, entryType, paymentDate, status, internalNotes, allocations } = req.body;
    if (!bankId || !mongoose.isValidObjectId(bankId)) {
      res.status(400).json({ message: 'Valid bankId is required' });
      return;
    }

    const allocationPayload = buildAllocationPayload(allocations, 'customer');
    const allocationTotal = sumAllocationAmount(allocationPayload);
    if (allocationTotal > Number(amount)) {
      res.status(400).json({ message: 'Allocation total exceeds payment amount' });
      return;
    }

    await validatePartyQuotationLinks(
      'customer',
      new mongoose.Types.ObjectId(id),
      businessId,
      allocationPayload
    );

    const payment = await Payments.create({
      party: 'customer',
      partyId: new mongoose.Types.ObjectId(id),
      businessId,
      bankId,
      amount: Number(amount),
      entryType,
      status,
      paymentDate,
      internalNotes,
      allocations: allocationPayload,
      unallocatedAmount: Number(amount) - allocationTotal,
    });

    res.status(201).json({ payment });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
    res.status(500).json({ error: 'Failed to create customer payment', message: errorMessage });
  }
};

export const createVendorPayment = async (req: Request, res: Response) => {
  try {
    const businessId = getBusinessId(req);
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({ message: 'Invalid vendor ID' });
      return;
    }

    const { bankId, amount, entryType, paymentDate, status, internalNotes, allocations } = req.body;
    if (!bankId || !mongoose.isValidObjectId(bankId)) {
      res.status(400).json({ message: 'Valid bankId is required' });
      return;
    }

    const allocationPayload = buildAllocationPayload(allocations, 'vendor');
    const allocationTotal = sumAllocationAmount(allocationPayload);
    if (allocationTotal > Number(amount)) {
      res.status(400).json({ message: 'Allocation total exceeds payment amount' });
      return;
    }

    await validatePartyQuotationLinks(
      'vendor',
      new mongoose.Types.ObjectId(id),
      businessId,
      allocationPayload
    );

    const payment = await Payments.create({
      party: 'vendor',
      partyId: new mongoose.Types.ObjectId(id),
      businessId,
      bankId,
      amount: Number(amount),
      entryType,
      status,
      paymentDate,
      internalNotes,
      allocations: allocationPayload,
      unallocatedAmount: Number(amount) - allocationTotal,
    });

    res.status(201).json({ payment });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
    res.status(500).json({ error: 'Failed to create vendor payment', message: errorMessage });
  }
};

export const createPaymentForQuotation = async (req: Request, res: Response) => {
  try {
    const businessId = getBusinessId(req);
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
      if (!party || !['customer', 'vendor'].includes(party)) {
        res.status(400).json({ message: 'party is required when quotation has both customer and vendor' });
        return;
      }
      resolvedParty = party;
    } else if (quotation.customerId) {
      resolvedParty = 'customer';
    } else if (quotation.vendorId) {
      resolvedParty = 'vendor';
    }

    if (!resolvedParty) {
      res.status(400).json({ message: 'Quotation is missing customer or vendor' });
      return;
    }

    resolvedPartyId = resolvedParty === 'customer'
      ? new mongoose.Types.ObjectId(quotation.customerId)
      : new mongoose.Types.ObjectId(quotation.vendorId);

    const allocationTotal = Number(allocationAmount ?? amount);
    if (allocationTotal > Number(amount)) {
      res.status(400).json({ message: 'Allocation total exceeds payment amount' });
      return;
    }

    const allocationPayload = buildAllocationPayload(
      [{ quotationId: id, amount: allocationTotal }],
      resolvedParty
    );

    await validatePartyQuotationLinks(resolvedParty, resolvedPartyId, businessId, allocationPayload);

    const payment = await Payments.create({
      party: resolvedParty,
      partyId: resolvedPartyId,
      businessId,
      bankId,
      amount: Number(amount),
      entryType,
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
    const businessId = getBusinessId(req);
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

    const party: PartyType | null = quotation.customerId ? 'customer' : quotation.vendorId ? 'vendor' : null;
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
    const businessId = getBusinessId(req);
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

    const { bankId, amount, entryType, paymentDate, status, internalNotes, allocations } = req.body;
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

    await payment.save();
    res.status(200).json({ payment });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
    res.status(500).json({ error: 'Failed to update payment', message: errorMessage });
  }
};

export const deletePayment = async (req: Request, res: Response) => {
  try {
    const businessId = getBusinessId(req);
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
