import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICounter extends Document {
  businessId: mongoose.Types.ObjectId;
  quotationCounter: number;
}

export interface ICounterModel extends Model<ICounter> {
  getNextQuotationNumber(businessId: string): Promise<number>;
  resetQuotationCounter(businessId: string): Promise<void>;
}

const counterSchema = new Schema<ICounter>({
  businessId: {
    type: Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
    unique: true,
    index: true
  },
  quotationCounter: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Static method to get next quotation number for a business
counterSchema.statics.getNextQuotationNumber = async function(businessId: string): Promise<number> {
  const counter = await this.findOneAndUpdate(
    { businessId },
    { $inc: { quotationCounter: 1 } },
    { 
      new: true, 
      upsert: true, // Create if doesn't exist
      setDefaultsOnInsert: true 
    }
  );
  return counter.quotationCounter;
};

// Static method to reset counter for a business (if needed)
counterSchema.statics.resetQuotationCounter = async function(businessId: string): Promise<void> {
  await this.findOneAndUpdate(
    { businessId },
    { quotationCounter: 0 },
    { upsert: true }
  );
};

const Counter = mongoose.model<ICounter, ICounterModel>('Counter', counterSchema);
export default Counter;
