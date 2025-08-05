import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  mobile: string;
  agentId: string | null;
  phoneCode: number;
  roleId: Types.ObjectId; 
  superAdmin: boolean;
}

const userSchema = new Schema<IUser>({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  mobile: {
    type: String,
    required: true,
  },
  agentId: {
    type: String,
    required: false,
  },
  phoneCode: {
    type: Number,
    required: true,
  },
  roleId: {
    type: Schema.Types.ObjectId,
    ref: 'Role',
    required: true,
  },
  superAdmin: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

const User = mongoose.model<IUser>('User', userSchema);
export default User;
