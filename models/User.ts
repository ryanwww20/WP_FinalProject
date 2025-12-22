import mongoose, { Document, Model, Schema } from 'mongoose';

export interface CourseMeeting {
  dayOfWeek: number;      // 1–6 (Mon–Sat)
  timeSlots: string[];    // e.g. ["1", "2"]
  location?: string;      // can override per meeting if needed
}

export interface Course {
  id: string;
  name: string;
  color: string;          // Tailwind color class
  teacher?: string;
  meetings: CourseMeeting[];
}

export interface FavoritePlace {
  placeId: string;        // Google Places ID
  name: string;           // Place name
  address: string;        // Formatted address
  lat: number;            // Latitude
  lng: number;            // Longitude
  types?: string[];       // Place types (book_store, cafe, library, etc.)
  addedAt: Date;          // When the place was favorited
}

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
    courses: Course[];
  };
  
  // ============================================================================
  // STUDY STATS: Global per-user accumulated statistics
  // These are the user's total stats across ALL activities.
  // Groups fetch these stats for ranking purposes.
  // ============================================================================
  studyStats?: {
    // All-time stats
    totalStudyTime: number; // total seconds studied (all-time)
    
    // Today's stats (with date tracking, auto-resets at midnight)
    todayStats: {
      date: string; // 'YYYY-MM-DD' format
      seconds: number; // Study time today in seconds
    };
    
    // This week's stats (with week tracking, auto-resets on new week)
    weeklyStats: {
      weekStart: string; // 'YYYY-MM-DD' format (Monday of current week)
      totalSeconds: number; // Total study time this week in seconds
      daily: {
        monday: number;    // seconds
        tuesday: number;   // seconds
        wednesday: number; // seconds
        thursday: number;  // seconds
        friday: number;    // seconds
        saturday: number;  // seconds
        sunday: number;    // seconds
      };
    };
    
    // This month's stats (with month tracking, auto-resets on new month)
    monthlyStats: {
      month: number; // 1-12
      year: number; // 2024, 2025, etc.
      seconds: number; // Total study time this month in seconds
    };
  };
  
  // ============================================================================
  // FOCUS SESSION: This is the GLOBAL per-user focus state.
  // When isActive=true, ALL groups the user belongs to will show them as "studying".
  // This is queried by /api/groups/[id]/focus-status to display real-time focus status.
  // Stats are accumulated once in studyStats above (not duplicated per-group).
  // ============================================================================
  focusSession?: {
    isActive: boolean;           // Currently in focus mode
    startedAt?: Date;            // When current session started
    targetDuration?: number;     // Target duration in minutes
  };
  googleCalendarAccessToken?: string; // Google Calendar access token
  googleCalendarRefreshToken?: string; // Google Calendar refresh token
  googleCalendarEnabled?: boolean; // Whether Google Calendar is enabled
  googleCalendarSyncToken?: string; // Calendar-level sync token
  favoritePlaces?: FavoritePlace[]; // User's favorite study places
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
          color: {
            type: String,
            required: true,
          },
          teacher: {
            type: String,
          },
          meetings: [
            {
              dayOfWeek: {
                type: Number,
                required: true,
                min: 1,
                max: 6, // Monday-Saturday
              },
              timeSlots: {
                type: [String],
                required: true,
                validate: {
                  validator: function(v: string[]) {
                    return v.length > 0 && v.every(slot => 
                      ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D'].includes(slot)
                    );
                  },
                  message: 'timeSlots must be a non-empty array of valid time slot values',
                },
              },
              location: {
                type: String,
              },
            },
          ],
        },
      ],
    },
    studyStats: {
      totalStudyTime: {
        type: Number,
        default: 0, // seconds (all-time)
        min: 0,
      },
      todayStats: {
        date: {
          type: String, // 'YYYY-MM-DD' format
          default: () => new Date().toISOString().split('T')[0],
        },
        seconds: {
          type: Number,
          default: 0,
          min: 0,
        },
      },
      weeklyStats: {
        weekStart: {
          type: String, // 'YYYY-MM-DD' format (Monday of current week)
          default: () => {
            const now = new Date();
            const dayOfWeek = now.getDay();
            const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Get Monday
            const monday = new Date(now);
            monday.setDate(now.getDate() + diff);
            return monday.toISOString().split('T')[0];
          },
        },
        totalSeconds: {
          type: Number,
          default: 0,
          min: 0,
        },
        daily: {
          monday: { type: Number, default: 0 },
          tuesday: { type: Number, default: 0 },
          wednesday: { type: Number, default: 0 },
          thursday: { type: Number, default: 0 },
          friday: { type: Number, default: 0 },
          saturday: { type: Number, default: 0 },
          sunday: { type: Number, default: 0 },
        },
      },
      monthlyStats: {
        month: {
          type: Number,
          default: () => new Date().getMonth() + 1, // 1-12
          min: 1,
          max: 12,
        },
        year: {
          type: Number,
          default: () => new Date().getFullYear(),
        },
        seconds: {
          type: Number,
          default: 0,
          min: 0,
        },
      },
    },
    focusSession: {
      isActive: {
        type: Boolean,
        default: false,
      },
      startedAt: {
        type: Date,
      },
      targetDuration: {
        type: Number, // minutes
        min: 1,
      },
    },
    googleCalendarAccessToken: {
      type: String,
    },
    googleCalendarRefreshToken: {
      type: String,
    },
    googleCalendarEnabled: {
      type: Boolean,
      default: false,
    },
    googleCalendarSyncToken: {
      type: String,
    },
    favoritePlaces: [
      {
        placeId: {
          type: String,
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        address: {
          type: String,
          required: true,
        },
        lat: {
          type: Number,
          required: true,
        },
        lng: {
          type: Number,
          required: true,
        },
        types: {
          type: [String],
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Create compound unique index on email + provider
// This ensures email+provider combination is unique (not email alone)
UserSchema.index({ email: 1, provider: 1 }, { unique: true });

// Create indexes for focus session queries
UserSchema.index({ 'focusSession.isActive': 1 }); // Find users currently in focus mode

// Prevent model recompilation during hot reload
const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;



