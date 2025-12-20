import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IGroup extends Document {
  name: string;
  description?: string;
  coverImage?: string;
  ownerId: string; // userId of the group owner
  visibility: 'public' | 'private'; // public: no password needed, private: password required
  password?: string; // hashed password (required for private groups)
  maxMembers?: number; // optional member limit
  requireApproval: boolean; // whether new members need admin approval
  memberCount: number; // cached count for performance
  createdAt: Date;
  updatedAt: Date;
}

const GroupSchema: Schema<IGroup> = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a group name'],
      unique: true,
      trim: true,
      maxlength: [100, 'Group name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    coverImage: {
      type: String,
    },
    ownerId: {
      type: String,
      required: [true, 'Please provide an owner ID'],
      trim: true,
      lowercase: true,
    },
    visibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'private',
    },
    password: {
      type: String, // will be hashed using bcrypt
    },
    maxMembers: {
      type: Number,
      min: [2, 'Group must allow at least 2 members'],
      max: [1000, 'Group cannot exceed 1000 members'],
    },
    requireApproval: {
      type: Boolean,
      default: false,
    },
    memberCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for efficient queries
GroupSchema.index({ ownerId: 1 });
GroupSchema.index({ visibility: 1 });
// Note: name index is already created by the unique: true constraint

// Prevent model recompilation during hot reload
const Group: Model<IGroup> =
  mongoose.models.Group || mongoose.model<IGroup>('Group', GroupSchema);

export default Group;

