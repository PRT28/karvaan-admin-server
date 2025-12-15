import mongoose, { Schema, model, Document } from 'mongoose';
import Team from './Team';

export type Status = 'Pending' | 'Completed' | 'On Hold' |'In Progress';

interface ITaskLog {
    heading: string,
    description: string,
    logBy: string,
    logDate: Date
}

export interface ILogs extends Document {
    activity: string,
    userId: Schema.Types.ObjectId,
    businessId: mongoose.Types.ObjectId,
    dateTime: Date,
    status: Status,
    assignedBy: Schema.Types.ObjectId
    priority: 'Low' | 'Medium' | 'High',
    taskType: 'Documents' | 'Finance' | 'Follow up' | 'Feedback' | 'General',
    dueDate: Date,
    category: string,
    subCategory: string,
    customId?: string,
    bookingId: Schema.Types.ObjectId,
    assignedTo: Array<Schema.Types.ObjectId>,
    isCompleted: boolean,
    logs: Array<ITaskLog>,
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
    assignedTo: { type: [Schema.Types.ObjectId], ref: 'Team', required: true },
    priority: {type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium'},
    taskType: {type: String, enum: ['Documents', 'Finance', 'Follow up', 'Feedback', 'General'], default: 'General'},
    dueDate: {type: Date, required: true, default: new Date()},
    category: { type: String, required: true },
    subCategory: { type: String, required: true },
    customId: {
        type: String,
        index: true,
    },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking' },
    logs: [{
        heading: { type: String, required: true },
        description: { type: String, required: true },
        logBy: { type: String, required: true },
        logDate: { type: Date, required: true, default: Date.now }
    }]
})

// Indexes for better performance
logSchema.index({ businessId: 1, dateTime: -1 });
logSchema.index({ businessId: 1, status: 1 });
logSchema.index({ businessId: 1, userId: 1 });
logSchema.index({ businessId: 1, bookingId: 1 });
logSchema.index({ businessId: 1, customId: 1 }, { unique: true, sparse: true });

// Static method to find logs by business
logSchema.statics.findByBusiness = function(businessId: string) {
    return this.find({ businessId });
};

const Logs = model<ILogs>('Logs', logSchema);

console.log('Team model:', Team.modelName);

export default Logs;
