import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IGroupMessage extends Document {
  groupId: mongoose.Types.ObjectId;
  userId: string; // userId (not ObjectId, to match User model)
  content: string;
  messageType: 'text' | 'system'; // system messages are auto-generated
  createdAt: Date;
  updatedAt: Date;
}

const GroupMessageSchema: Schema<IGroupMessage> = new Schema(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      required: [true, 'Please provide a group ID'],
    },
    userId: {
      type: String,
      required: [true, 'Please provide a user ID'],
      trim: true,
      lowercase: true,
    },
    content: {
      type: String,
      required: [true, 'Please provide message content'],
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    messageType: {
      type: String,
      enum: ['text', 'system'],
      default: 'text',
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for efficient queries
GroupMessageSchema.index({ groupId: 1, createdAt: -1 }); // for fetching messages in reverse chronological order
GroupMessageSchema.index({ userId: 1 });

// Prevent model recompilation during hot reload
const GroupMessage: Model<IGroupMessage> =
  mongoose.models.GroupMessage || mongoose.model<IGroupMessage>('GroupMessage', GroupMessageSchema);

export default GroupMessage;

