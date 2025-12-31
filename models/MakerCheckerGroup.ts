import mongoose, { Schema, model, Document } from 'mongoose';

export type MakerCheckerGroupType = 'booking' | 'finance';

export interface IMakerCheckerGroup extends Document {
  name: string;
  status: boolean;
  makers: mongoose.Types.ObjectId[];
  checkers: mongoose.Types.ObjectId[];
  businessId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  type: MakerCheckerGroupType
}

const makerCheckerGroupSchema = new Schema<IMakerCheckerGroup>({
  name: { type: String, required: true },
  status: { type: Boolean, default: true },
  makers: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
  checkers: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
  type: {
    type: String,
    enum: ['booking', 'finance'],
    required: true,
  },
  businessId: {
    type: Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
    index: true
  },
}, {
  timestamps: true,
});

const MakerCheckerGroup = model<IMakerCheckerGroup>('MakerCheckerGroup', makerCheckerGroupSchema);

export default MakerCheckerGroup;
