import mongoose, { Schema, model, Document } from 'mongoose';
import Team from './Team';

export type Status = 'Pending' | 'Completed' | 'On Hold' |'In Progress';

export interface ILogs extends Document {
    activity: string,
    userId: Schema.Types.ObjectId,
    businessId: mongoose.Types.ObjectId,
    dateTime: Date,
    status: Status,
    assignedBy: Schema.Types.ObjectId
    priority: 'Low' | 'Medium' | 'High'
    dueDate: Date,
    category: string,
    subCategory: string,
}

const logSchema = new Schema<ILogs>({
    activity: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    businessId: {
        type: Schema.Types.ObjectId,
        ref: 'Business',
        required: true,
        index: true
    },
    dateTime: {type: Date, required: true, default: new Date()},
    status: {type: String, enum: ['Pending', 'Completed', 'On Hold', 'In Progress'], default: 'Pending'},
    assignedBy: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    priority: {type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium'},
    dueDate: {type: Date, required: true, default: new Date()},
    category: { type: String, required: true },
    subCategory: { type: String, required: true },
})

// Indexes for better performance
logSchema.index({ businessId: 1, dateTime: -1 });
logSchema.index({ businessId: 1, status: 1 });
logSchema.index({ businessId: 1, userId: 1 });

// Static method to find logs by business
logSchema.statics.findByBusiness = function(businessId: string) {
    return this.find({ businessId });
};

const Logs = model<ILogs>('Logs', logSchema);

console.log('Team model:', Team.modelName);

export default Logs;