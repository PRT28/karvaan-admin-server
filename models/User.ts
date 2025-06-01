import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  mobile: string;
  phoneCode: number;
  roleId: Types.ObjectId; 
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
  phoneCode: {
    type: Number,
    required: true,
  },
  roleId: {
    type: Schema.Types.ObjectId,
    ref: 'Role',
    required: true,
  },
}, {
  timestamps: true,
});

const User = mongoose.model<IUser>('User', userSchema);
export default User;
