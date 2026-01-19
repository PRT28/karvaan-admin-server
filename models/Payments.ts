import mongoose, { Schema, model, Document } from 'mongoose';

export type PartyType = 'customer' | 'vendor';
export type PaymentAmountType = 'selling' | 'cost';
export type PaymentEntryType = 'credit' | 'debit';

export interface IPaymentDocument {
  originalName: string;
  fileName: string;
  url: string;
  key: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
}

export interface IPaymentAllocation {
  quotationId: mongoose.Types.ObjectId;
  amount: number;
  amountType: PaymentAmountType;
  appliedAt: Date;
}

export interface IPayments extends Document {
  party: PartyType;
  isDeleted: boolean;
  partyId: mongoose.Types.ObjectId;
  businessId: mongoose.Types.ObjectId;
  bankId: mongoose.Types.ObjectId;
  amount: number;
  entryType: PaymentEntryType;
  status: 'pending' | 'approved' | 'denied';
  paymentDate: Date;
  documents: IPaymentDocument[];
  internalNotes: string;
  allocations: IPaymentAllocation[];
  unallocatedAmount: number;
}

const paymentSchema = new Schema<IPayments>({
  party: {
    type: String,
    enum: ['customer', 'vendor'],
    required: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  partyId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  businessId: {
    type: Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
    index: true
  },
  bankId: {
    type: Schema.Types.ObjectId,
    ref: 'Bank',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  entryType: {
    type: String,
    enum: ['credit', 'debit'],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'denied'],
    default: 'pending',
  },
  paymentDate: {
    type: Date,
    default: Date.now,
  },
  documents: {
    type: [{
      originalName: { type: String, required: true },
      fileName: { type: String, required: true },
      url: { type: String, required: true },
      key: { type: String, required: true },
      size: { type: Number, required: true },
      mimeType: { type: String, required: true },
      uploadedAt: { type: Date, default: Date.now },
    }],
    default: [],
  },
  internalNotes: { type: String },
  allocations: {
    type: [{
      quotationId: { type: Schema.Types.ObjectId, ref: 'Quotation', required: true },
      amount: { type: Number, required: true },
      amountType: { type: String, enum: ['selling', 'cost'], required: true },
      appliedAt: { type: Date, default: Date.now },
    }],
    default: [],
    validate: {
      validator: function(allocations: IPaymentAllocation[]) {
        if (!allocations || allocations.length === 0) return true;
        const expected = this.party === 'vendor' ? 'cost' : 'selling';
        return allocations.every(allocation => allocation.amountType === expected);
      },
      message: 'Allocation amountType must match payment party'
    }
  },
  unallocatedAmount: {
    type: Number,
    default: function(this: IPayments) {
      return this.amount;
    }
  },
}, {
  timestamps: true,
});

paymentSchema.index({ businessId: 1, party: 1, partyId: 1 });
paymentSchema.index({ businessId: 1, paymentDate: -1 });
paymentSchema.index({ businessId: 1, status: 1 });

paymentSchema.pre('validate', function(next) {
  if (this.unallocatedAmount === undefined || this.unallocatedAmount === null) {
    this.unallocatedAmount = this.amount;
  }
  next();
});

const Payments = model<IPayments>('Payments', paymentSchema);

export default Payments;
