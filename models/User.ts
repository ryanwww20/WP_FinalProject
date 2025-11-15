import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IUser extends Document {
  userId: string;
  name: string;
  email: string;
  image?: string;
  provider?: string;
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


