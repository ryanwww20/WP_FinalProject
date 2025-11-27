import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IEvent extends Document {
  _id: mongoose.Types.ObjectId;
  userId: string;
  title: string;
  startTime: Date;
  endTime: Date;
  notification?: string; // e.g., "No Notification", "5 minutes before", etc.
  location?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema: Schema<IEvent> = new Schema(
  {
    userId: {
      type: String,
      required: [true, 'Please provide a userId'],
      trim: true,
      lowercase: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide a title'],
      trim: true,
    },
    startTime: {
      type: Date,
      required: [true, 'Please provide a start time'],
    },
    endTime: {
      type: Date,
      required: [true, 'Please provide an end time'],
    },
    notification: {
      type: String,
      default: 'No Notification',
    },
    location: {
      type: String,
      default: 'No Location',
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Create index on userId and startTime for efficient queries
EventSchema.index({ userId: 1, startTime: 1 });

// Prevent model recompilation during hot reload
const Event: Model<IEvent> =
  mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);

export default Event;

