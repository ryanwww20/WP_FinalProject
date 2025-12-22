import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IGroupMember extends Document {
  groupId: mongoose.Types.ObjectId;
  userId: string; // userId (not ObjectId, to match User model)
  role: 'owner' | 'admin' | 'member';
  joinedAt: Date;
  lastActiveAt: Date;
  
  // ============================================================================
  // IMPORTANT: Stats are stored per-user in User.studyStats (not here!)
  // Groups fetch user stats for ranking purposes.
  // This avoids redundant data (same stats duplicated across multiple groups).
  // ============================================================================
  
  // Location for map feature
  location?: {
    lat: number;
    lng: number;
    address?: string;
    // Additional study location information
    placeName?: string; // 在哪裡讀書（地點名稱）
    placeId?: string; // Google Places ID
    placeTypes?: string[]; // 地標類型（book_store, cafe, library）
    studyUntil?: Date; // 預計讀到幾點
    crowdedness?: 'empty' | 'quiet' | 'moderate' | 'busy' | 'very-busy'; // 店內人是否壅擠
    hasOutlet?: boolean; // 是否有插座
    hasWifi?: boolean; // 是否有網路
    updatedAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const GroupMemberSchema: Schema<IGroupMember> = new Schema(
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
    role: {
      type: String,
      enum: ['owner', 'admin', 'member'],
      default: 'member',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
    location: {
      lat: {
        type: Number,
        required: false,
      },
      lng: {
        type: Number,
        required: false,
      },
      address: {
        type: String,
        required: false,
      },
      placeName: {
        type: String,
        required: false,
      },
      placeId: {
        type: String,
        required: false,
      },
      placeTypes: {
        type: [String],
        required: false,
      },
      studyUntil: {
        type: Date,
        required: false,
      },
      crowdedness: {
        type: String,
        enum: ['empty', 'quiet', 'moderate', 'busy', 'very-busy'],
        required: false,
      },
      hasOutlet: {
        type: Boolean,
        required: false,
      },
      hasWifi: {
        type: Boolean,
        required: false,
      },
      updatedAt: {
        type: Date,
        default: Date.now,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Create compound unique index to prevent duplicate memberships
GroupMemberSchema.index({ groupId: 1, userId: 1 }, { unique: true });

// Create indexes for efficient queries
GroupMemberSchema.index({ userId: 1 });
GroupMemberSchema.index({ groupId: 1, role: 1 });

// Prevent model recompilation during hot reload
const GroupMember: Model<IGroupMember> =
  mongoose.models.GroupMember || mongoose.model<IGroupMember>('GroupMember', GroupMemberSchema);

export default GroupMember;

