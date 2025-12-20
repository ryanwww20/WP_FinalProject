/**
 * Database Migration Script for Vercel Deployment
 * 
 * This script ensures all existing documents are compatible with the new schema.
 * Run this BEFORE deploying to Vercel to avoid runtime errors.
 * 
 * Usage:
 *   npm run migrate-db
 */

import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define MONGODB_URI in .env.local');
}

// TypeScript type assertion: we've verified MONGODB_URI is defined above
// Use non-null assertion since we've already checked it's not undefined
const mongoUri = MONGODB_URI as string;

interface MigrationStats {
  collection: string;
  documentsChecked: number;
  documentsUpdated: number;
  indexesCreated: number;
  errors: number;
}

async function migrateDatabase() {
  const stats: MigrationStats[] = [];
  
  try {
    console.log('🚀 Starting database migration...\n');
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected successfully!\n');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Failed to get database instance from MongoDB connection');
    }

    // ========================================================================
    // 1. MIGRATE USERS COLLECTION
    // ========================================================================
    console.log('📝 Migrating Users collection...');
    const usersCollection = db.collection('users');
    
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    // Get Monday of current week
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    const weekStart = monday.toISOString().split('T')[0];

    const allUsers = await usersCollection.find({}).toArray();
    let usersUpdated = 0;

    for (const user of allUsers) {
      const updates: any = {};
      const unsets: any = {};

      // Add missing status fields
      if (!user.status) {
        updates['status.current'] = 'offline';
        updates['status.lastUpdated'] = now;
      }

      // Add missing schedule fields
      if (!user.schedule) {
        updates['schedule.courses'] = [];
      }

      // Add missing studyStats fields
      if (!user.studyStats) {
        updates['studyStats.totalStudyTime'] = 0;
        updates['studyStats.todayStats.date'] = today;
        updates['studyStats.todayStats.seconds'] = 0;
        updates['studyStats.weeklyStats.weekStart'] = weekStart;
        updates['studyStats.weeklyStats.totalSeconds'] = 0;
        updates['studyStats.weeklyStats.daily.monday'] = 0;
        updates['studyStats.weeklyStats.daily.tuesday'] = 0;
        updates['studyStats.weeklyStats.daily.wednesday'] = 0;
        updates['studyStats.weeklyStats.daily.thursday'] = 0;
        updates['studyStats.weeklyStats.daily.friday'] = 0;
        updates['studyStats.weeklyStats.daily.saturday'] = 0;
        updates['studyStats.weeklyStats.daily.sunday'] = 0;
        updates['studyStats.monthlyStats.month'] = currentMonth;
        updates['studyStats.monthlyStats.year'] = currentYear;
        updates['studyStats.monthlyStats.seconds'] = 0;
      } else {
        // Ensure all studyStats sub-fields exist
        if (user.studyStats.totalStudyTime === undefined) {
          updates['studyStats.totalStudyTime'] = 0;
        }
        if (!user.studyStats.todayStats) {
          updates['studyStats.todayStats.date'] = today;
          updates['studyStats.todayStats.seconds'] = 0;
        }
        if (!user.studyStats.weeklyStats) {
          updates['studyStats.weeklyStats.weekStart'] = weekStart;
          updates['studyStats.weeklyStats.totalSeconds'] = 0;
          updates['studyStats.weeklyStats.daily.monday'] = 0;
          updates['studyStats.weeklyStats.daily.tuesday'] = 0;
          updates['studyStats.weeklyStats.daily.wednesday'] = 0;
          updates['studyStats.weeklyStats.daily.thursday'] = 0;
          updates['studyStats.weeklyStats.daily.friday'] = 0;
          updates['studyStats.weeklyStats.daily.saturday'] = 0;
          updates['studyStats.weeklyStats.daily.sunday'] = 0;
        }
        if (!user.studyStats.monthlyStats) {
          updates['studyStats.monthlyStats.month'] = currentMonth;
          updates['studyStats.monthlyStats.year'] = currentYear;
          updates['studyStats.monthlyStats.seconds'] = 0;
        }
      }

      // Add missing focusSession fields
      if (!user.focusSession) {
        updates['focusSession.isActive'] = false;
      }

      // Remove obsolete fields (add any old fields you want to remove)
      // Example: Remove old pomodoro fields that are no longer used
      if (user.studyStats?.pomodoroCount !== undefined) {
        unsets['studyStats.pomodoroCount'] = '';
      }
      if (user.studyStats?.todayStats?.pomodoros !== undefined) {
        unsets['studyStats.todayStats.pomodoros'] = '';
      }
      if (user.studyStats?.monthlyStats?.pomodoros !== undefined) {
        unsets['studyStats.monthlyStats.pomodoros'] = '';
      }
      if (user.focusSession?.sessionType !== undefined) {
        unsets['focusSession.sessionType'] = '';
      }

      // Apply updates if needed
      if (Object.keys(updates).length > 0 || Object.keys(unsets).length > 0) {
        const updateDoc: any = {};
        if (Object.keys(updates).length > 0) {
          updateDoc.$set = updates;
        }
        if (Object.keys(unsets).length > 0) {
          updateDoc.$unset = unsets;
        }

        await usersCollection.updateOne(
          { _id: user._id },
          updateDoc
        );
        usersUpdated++;
      }
    }

    // Create indexes for Users
    console.log('  Creating indexes for Users...');
    await usersCollection.createIndex({ email: 1, provider: 1 }, { unique: true, background: true });
    await usersCollection.createIndex({ 'focusSession.isActive': 1 }, { background: true });
    
    stats.push({
      collection: 'users',
      documentsChecked: allUsers.length,
      documentsUpdated: usersUpdated,
      indexesCreated: 2,
      errors: 0,
    });
    console.log(`  ✅ Users: ${usersUpdated}/${allUsers.length} documents updated\n`);

    // ========================================================================
    // 2. MIGRATE GROUPS COLLECTION
    // ========================================================================
    console.log('📝 Migrating Groups collection...');
    const groupsCollection = db.collection('groups');
    
    const allGroups = await groupsCollection.find({}).toArray();
    let groupsUpdated = 0;

    for (const group of allGroups) {
      const updates: any = {};

      // Add missing fields with defaults
      if (group.visibility === undefined) {
        updates['visibility'] = 'private';
      }
      if (group.requireApproval === undefined) {
        updates['requireApproval'] = false;
      }
      if (group.memberCount === undefined) {
        // Count actual members
        const memberCount = await db.collection('groupmembers').countDocuments({
          groupId: group._id
        });
        updates['memberCount'] = memberCount;
      }

      if (Object.keys(updates).length > 0) {
        await groupsCollection.updateOne(
          { _id: group._id },
          { $set: updates }
        );
        groupsUpdated++;
      }
    }

    // Create indexes for Groups
    console.log('  Creating indexes for Groups...');
    await groupsCollection.createIndex({ name: 1 }, { unique: true, background: true });
    await groupsCollection.createIndex({ ownerId: 1 }, { background: true });
    await groupsCollection.createIndex({ visibility: 1 }, { background: true });
    
    stats.push({
      collection: 'groups',
      documentsChecked: allGroups.length,
      documentsUpdated: groupsUpdated,
      indexesCreated: 3,
      errors: 0,
    });
    console.log(`  ✅ Groups: ${groupsUpdated}/${allGroups.length} documents updated\n`);

    // ========================================================================
    // 3. MIGRATE GROUPMEMBERS COLLECTION
    // ========================================================================
    console.log('📝 Migrating GroupMembers collection...');
    const groupMembersCollection = db.collection('groupmembers');
    
    const allMembers = await groupMembersCollection.find({}).toArray();
    let membersUpdated = 0;

    for (const member of allMembers) {
      const updates: any = {};

      // Add missing lastActiveAt field
      if (!member.lastActiveAt) {
        updates['lastActiveAt'] = member.joinedAt || now;
      }

      if (Object.keys(updates).length > 0) {
        await groupMembersCollection.updateOne(
          { _id: member._id },
          { $set: updates }
        );
        membersUpdated++;
      }
    }

    // Create indexes for GroupMembers
    console.log('  Creating indexes for GroupMembers...');
    await groupMembersCollection.createIndex({ groupId: 1, userId: 1 }, { unique: true, background: true });
    await groupMembersCollection.createIndex({ userId: 1 }, { background: true });
    await groupMembersCollection.createIndex({ groupId: 1, role: 1 }, { background: true });
    
    stats.push({
      collection: 'groupmembers',
      documentsChecked: allMembers.length,
      documentsUpdated: membersUpdated,
      indexesCreated: 3,
      errors: 0,
    });
    console.log(`  ✅ GroupMembers: ${membersUpdated}/${allMembers.length} documents updated\n`);

    // ========================================================================
    // 4. MIGRATE EVENTS COLLECTION
    // ========================================================================
    console.log('📝 Migrating Events collection...');
    const eventsCollection = db.collection('events');
    
    const allEvents = await eventsCollection.find({}).toArray();
    let eventsUpdated = 0;

    for (const event of allEvents) {
      const updates: any = {};

      // Add missing fields with defaults
      if (!event.notification) {
        updates['notification'] = 'No Notification';
      }
      if (!event.location) {
        updates['location'] = 'No Location';
      }

      if (Object.keys(updates).length > 0) {
        await eventsCollection.updateOne(
          { _id: event._id },
          { $set: updates }
        );
        eventsUpdated++;
      }
    }

    // Create indexes for Events
    console.log('  Creating indexes for Events...');
    await eventsCollection.createIndex({ userId: 1, startTime: 1 }, { background: true });
    
    stats.push({
      collection: 'events',
      documentsChecked: allEvents.length,
      documentsUpdated: eventsUpdated,
      indexesCreated: 1,
      errors: 0,
    });
    console.log(`  ✅ Events: ${eventsUpdated}/${allEvents.length} documents updated\n`);

    // ========================================================================
    // 5. MIGRATE TODOS COLLECTION
    // ========================================================================
    console.log('📝 Migrating Todos collection...');
    const todosCollection = db.collection('todos');
    
    const allTodos = await todosCollection.find({}).toArray();
    let todosUpdated = 0;

    for (const todo of allTodos) {
      const updates: any = {};

      // Add missing fields with defaults
      if (todo.completed === undefined) {
        updates['completed'] = false;
      }

      if (Object.keys(updates).length > 0) {
        await todosCollection.updateOne(
          { _id: todo._id },
          { $set: updates }
        );
        todosUpdated++;
      }
    }

    // Create indexes for Todos
    console.log('  Creating indexes for Todos...');
    await todosCollection.createIndex({ userId: 1, dueDate: 1 }, { background: true });
    
    stats.push({
      collection: 'todos',
      documentsChecked: allTodos.length,
      documentsUpdated: todosUpdated,
      indexesCreated: 1,
      errors: 0,
    });
    console.log(`  ✅ Todos: ${todosUpdated}/${allTodos.length} documents updated\n`);

    // ========================================================================
    // PRINT SUMMARY
    // ========================================================================
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    
    let totalDocs = 0;
    let totalUpdated = 0;
    let totalIndexes = 0;

    for (const stat of stats) {
      console.log(`\n${stat.collection.toUpperCase()}:`);
      console.log(`  Documents checked: ${stat.documentsChecked}`);
      console.log(`  Documents updated: ${stat.documentsUpdated}`);
      console.log(`  Indexes created: ${stat.indexesCreated}`);
      console.log(`  Errors: ${stat.errors}`);
      
      totalDocs += stat.documentsChecked;
      totalUpdated += stat.documentsUpdated;
      totalIndexes += stat.indexesCreated;
    }

    console.log('\n' + '='.repeat(60));
    console.log('TOTALS:');
    console.log(`  Total documents: ${totalDocs}`);
    console.log(`  Total updated: ${totalUpdated}`);
    console.log(`  Total indexes: ${totalIndexes}`);
    console.log('='.repeat(60));

    console.log('\n✨ Migration completed successfully!');
    console.log('🚀 You can now safely deploy to Vercel.');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB\n');
  }
}

// Run the migration
migrateDatabase()
  .then(() => {
    console.log('✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });

