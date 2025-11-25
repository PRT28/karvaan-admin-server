import mongoose, { Document, Schema } from 'mongoose';
import Business from './Business';
import Counter from './Counter';

export type ChannelType = 'B2B' | 'B2C';
export type QuotationType = 'flight' | 'train' | 'hotel' | 'activity';
export type QuotationStatus = 'draft' | 'confirmed' | 'cancelled';

export interface IQuotation extends Document {
  customId: string; // Custom ID like "KVN-001", "SYS-002"
  quotationType: QuotationType;
  channel: ChannelType;
  partyId: mongoose.Types.ObjectId;
  partyModel: 'Customer' | 'Vendor';
  businessId: mongoose.Types.ObjectId;
  formFields: Map<String, Object>,
  totalAmount: number;
  status: QuotationStatus;
  createdAt: Date;
  updatedAt: Date;
}

const QuotationSchema = new Schema<IQuotation>(
  {
    customId: {
      type: String,
      unique: true,
      index: true,
      // Will be auto-generated in pre-save hook
    },
    quotationType: {
      type: String,
      enum: ['flight', 'train', 'hotel', 'activity'],
      required: true,
    },
    channel: {
      type: String,
      enum: ['B2B', 'B2C'],
      required: true,
    },
    partyId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'partyModel',
    },
    partyModel: {
      type: String,
      required: true,
      enum: ['Customer', 'Vendor'],
    },
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      index: true
    },
    formFields: {
      type: Map,
      required: true
    },
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['draft', 'confirmed', 'cancelled'],
      default: 'draft',
    },
  },
  { timestamps: true }
);

// Indexes for better performance
QuotationSchema.index({ businessId: 1, createdAt: -1 });
QuotationSchema.index({ businessId: 1, status: 1 });
QuotationSchema.index({ businessId: 1, quotationType: 1 });
QuotationSchema.index({ businessId: 1, channel: 1 });

// Pre-save hook to generate custom ID
QuotationSchema.pre('save', async function(next) {
  // Only generate customId for new documents
  if (this.isNew && !this.customId) {
    try {
      // Get the business to fetch the prefix
      const business = await Business.findById(this.businessId);
      if (!business) {
        throw new Error('Business not found');
      }

      // Get the next quotation number for this business
      const nextNumber = await Counter.getNextQuotationNumber(this.businessId.toString());

      // Format the number with leading zeros (3 digits)
      const formattedNumber = nextNumber.toString().padStart(3, '0');

      // Generate the custom ID
      this.customId = `OS-${formattedNumber}`;

      next();
    } catch (error) {
      next(error as Error);
    }
  } else {
    next();
  }
});

// Static method to find quotations by business
QuotationSchema.statics.findByBusiness = function(businessId: string) {
  return this.find({ businessId });
};

// Static method to find quotation by custom ID
QuotationSchema.statics.findByCustomId = function(customId: string) {
  return this.findOne({ customId });
};

export default mongoose.model<IQuotation>('Quotation', QuotationSchema);

