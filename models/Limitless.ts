import mongoose, { Document, Schema } from 'mongoose';

export type LimitlessStatus = 'confirmed' | 'cancelled';

export type ServiceStatus = 'pending' | 'denied' | 'draft' | 'approved';

export interface ILimitlessDocument {
  originalName: string;
  fileName: string;
  url: string;
  key: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
}

export interface ILimitless extends Document {
  customId: string;
  businessId: mongoose.Types.ObjectId;
  totalAmount: number;
  roe: number;
  currency: string;
  status: LimitlessStatus;
  createdAt: Date;
  updatedAt: Date;
  limitlessDestinations: string[];
  limitlessTitle: string;
  description: string;
  primaryOwner: mongoose.Types.ObjectId;
  secondaryOwner: Array<mongoose.Types.ObjectId>;
  travelDate: Date;
  bookingDate: Date;
  customerId: mongoose.Types.ObjectId;
  adultTravelers: Array<mongoose.Types.ObjectId>;
  childTravelers: Array<{ id: mongoose.Types.ObjectId, age: number }>;
  adultNumber: number;
  childNumber: number;
  remarks: string;
  isDeleted: boolean;
  serviceStatus: string;
  documents: ILimitlessDocument[];
}

const LimitlessSchema = new Schema<ILimitless>(
  {
    customId: {
      type: String,
      index: true,
      // Will be auto-generated in pre-save hook
    },
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: false,
      index: true
    },
    totalAmount: { type: Number },
    roe: { type: Number },
    currency: { type: String },
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
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: false },
    adultTravelers: { type: [Schema.Types.ObjectId], ref: 'Traveller', required: false },
    childTravelers: { type: [{
      id: { type: Schema.Types.ObjectId, ref: 'Traveller', required: false },
      age: { type: Number, required: false },
    }], required: false },
    adultNumber: { type: Number, required: false },
    childNumber: { type: Number, required: false },
    limitlessDestinations: { type: [String], required: false },
    limitlessTitle: { type: String, required: false },
    description: { type: String, required: false },
    bookingDate: { type: Date, required: false },
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
LimitlessSchema.index({ businessId: 1, createdAt: -1 });
LimitlessSchema.index({ businessId: 1, status: 1 });
LimitlessSchema.index({ businessId: 1, channel: 1 });
LimitlessSchema.index({ businessId: 1, customerId: 1 });
LimitlessSchema.index({ businessId: 1, vendorId: 1 });
LimitlessSchema.index({ businessId: 1, adultTravelers: 1 });
LimitlessSchema.index({ businessId: 1, childTravelers: 1 });
LimitlessSchema.index({ businessId: 1, customId: 1 }, { unique: true, sparse: true });

// Static method to find quotations by business
LimitlessSchema.statics.findByBusiness = function(businessId: string) {
  return this.find({ businessId });
};

// Static method to find quotation by custom ID
LimitlessSchema.statics.findByCustomId = function(customId: string) {
  return this.findOne({ customId });
};

export default mongoose.model<ILimitless>('Limitless', LimitlessSchema);
