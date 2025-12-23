import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ITodo extends Document {
  _id: mongoose.Types.ObjectId;
  userId: string;
  title: string;
  dueDate: Date;
  completed: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TodoSchema: Schema<ITodo> = new Schema(
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
    dueDate: {
      type: Date,
      required: [true, 'Please provide a due date'],
    },
    completed: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Create index on userId and dueDate for efficient queries
TodoSchema.index({ userId: 1, dueDate: 1 });

// Prevent model recompilation during hot reload
const Todo: Model<ITodo> =
  mongoose.models.Todo || mongoose.model<ITodo>('Todo', TodoSchema);

export default Todo;















