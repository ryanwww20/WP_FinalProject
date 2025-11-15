import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IUser extends Document {
  userId: string;
  name: string;
  email: string;
  image?: string;
  provider?: string;
  status?: {
    current: 'studying' | 'busy' | 'offline';
    lastUpdated?: Date;
  };
  schedule?: {
    courses: Array<{
      id: string;
      name: string;
      dayOfWeek: number; // 1-6 (Monday-Saturday)
      timeSlot: string; // "0", "1", "2", ..., "9", "A", "B", "C", "D"
      location?: string;
      teacher?: string;
      color: string; // Tailwind color class
    }>;
  };
  studyStats?: {
    today: number; // minutes
    thisWeek: number; // minutes
    weekly: {
      monday: number;
      tuesday: number;
      wednesday: number;
      thursday: number;
      friday: number;
      saturday: number;
      sunday: number;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    userId: {
      type: String,
      required: [true, 'Please provide a userId'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide a name'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      lowercase: true,
      // NOT unique - same email can exist with different providers
    },
    image: {
      type: String,
    },
    provider: {
      type: String,
      default: 'credentials',
      required: true,
    },
    status: {
      current: {
        type: String,
        enum: ['studying', 'busy', 'offline'],
        default: 'offline',
      },
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
    },
    schedule: {
      courses: [
        {
          id: {
            type: String,
            required: true,
          },
          name: {
            type: String,
            required: true,
          },
          dayOfWeek: {
            type: Number,
            required: true,
            min: 1,
            max: 6, // Monday-Saturday
          },
          timeSlot: {
            type: String,
            required: true,
            enum: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D'],
          },
          location: {
            type: String,
          },
          teacher: {
            type: String,
          },
          color: {
            type: String,
            required: true,
          },
        },
      ],
    },
    studyStats: {
      today: {
        type: Number,
        default: 0, // minutes
      },
      thisWeek: {
        type: Number,
        default: 0, // minutes
      },
      weekly: {
        monday: { type: Number, default: 0 },
        tuesday: { type: Number, default: 0 },
        wednesday: { type: Number, default: 0 },
        thursday: { type: Number, default: 0 },
        friday: { type: Number, default: 0 },
        saturday: { type: Number, default: 0 },
        sunday: { type: Number, default: 0 },
      },
    },
  },
  {
    timestamps: true,
  }
);

// Create compound unique index on email + provider
// This ensures email+provider combination is unique (not email alone)
UserSchema.index({ email: 1, provider: 1 }, { unique: true });

// Prevent model recompilation during hot reload
const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;


