// Environment variables are loaded via --require dotenv/config in package.json
// If MONGODB_URI is not set, provide helpful error message
if (!process.env.MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI environment variable is not set!');
  console.error('   Please create a .env.local file with your MONGODB_URI');
  console.error('   Example: MONGODB_URI=mongodb+srv://...');
  process.exit(1);
}

import mongoose from 'mongoose';
import connectDB from '../lib/mongodb';
import User from '../models/User';

/**
 * MongoDB Database Inspector
 * This script helps you check connection status and inspect your database
 */

async function inspectDatabase() {
  try {
    console.log('🔍 MongoDB Database Inspector\n');
    console.log('=' .repeat(50));

    // 1. Test Connection
    console.log('\n1️⃣ Testing MongoDB Connection...');
    await connectDB();
    const connection = mongoose.connection;
    
    if (connection.readyState === 1) {
      console.log('✅ MongoDB Connected Successfully!');
      console.log(`   Host: ${connection.host}`);
      console.log(`   Port: ${connection.port}`);
      console.log(`   Database: ${connection.name}`);
      console.log(`   Ready State: ${connection.readyState} (1 = connected)`);
    } else {
      console.log('❌ MongoDB Connection Failed');
      console.log(`   Ready State: ${connection.readyState}`);
      return;
    }

    // 2. List All Databases
    console.log('\n2️⃣ Listing All Databases...');
    if (!connection.db) {
      console.log('❌ Database not available');
      return;
    }
    const adminDb = connection.db.admin();
    const dbList = await adminDb.listDatabases();
    console.log(`   Found ${dbList.databases.length} database(s):`);
    dbList.databases.forEach((db: any) => {
      console.log(`   - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });

    // 3. Get Current Database Info
    const currentDb = connection.db;
    console.log(`\n3️⃣ Current Database: ${currentDb.databaseName}`);
    
    // 4. List All Collections
    console.log('\n4️⃣ Listing All Collections...');
    const collections = await currentDb.listCollections().toArray();
    console.log(`   Found ${collections.length} collection(s):`);
    collections.forEach((collection: any) => {
      console.log(`   - ${collection.name}`);
    });

    // 5. Inspect User Collection (if exists)
    console.log('\n5️⃣ Inspecting User Collection...');
    const userCount = await User.countDocuments();
    console.log(`   Total Users: ${userCount}`);

    if (userCount > 0) {
      // Get sample user
      const sampleUser = await User.findOne().lean();
      console.log('\n   Sample User Document:');
      console.log(JSON.stringify(sampleUser, null, 2));

      // Get all users (limited to 5)
      console.log('\n   All Users (showing first 5):');
      const users = await User.find().limit(5).lean();
      users.forEach((user: any, index: number) => {
        console.log(`   ${index + 1}. ${user.name} (${user.email}) - Provider: ${user.provider || 'N/A'}`);
      });
    } else {
      console.log('   ⚠️  No users found in database');
    }

    // 6. Show User Schema Structure
    console.log('\n6️⃣ User Schema Structure:');
    const userSchema = User.schema;
    const paths = userSchema.paths;
    console.log('   Fields:');
    Object.keys(paths).forEach((field) => {
      const path = paths[field];
      const required = path.isRequired ? ' (required)' : '';
      const unique = path.options.unique ? ' (unique)' : '';
      const defaultVal = path.options.default !== undefined ? ` (default: ${path.options.default})` : '';
      console.log(`   - ${field}: ${path.instance}${required}${unique}${defaultVal}`);
    });

    // 7. Database Statistics
    console.log('\n7️⃣ Database Statistics:');
    const stats = await currentDb.stats();
    console.log(`   Collections: ${stats.collections}`);
    console.log(`   Data Size: ${(stats.dataSize / 1024).toFixed(2)} KB`);
    console.log(`   Storage Size: ${(stats.storageSize / 1024).toFixed(2)} KB`);
    console.log(`   Indexes: ${stats.indexes}`);
    console.log(`   Index Size: ${(stats.indexSize / 1024).toFixed(2)} KB`);

    // 8. Connection Info
    console.log('\n8️⃣ Connection Information:');
    const connectionState = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };
    console.log(`   State: ${connectionState[connection.readyState as keyof typeof connectionState]}`);
    console.log(`   Models: ${Object.keys(connection.models).join(', ')}`);

    console.log('\n' + '='.repeat(50));
    console.log('✅ Inspection Complete!\n');

  } catch (error: any) {
    console.error('\n❌ Error inspecting database:');
    console.error(error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed.');
    process.exit(0);
  }
}

// Run the inspection
inspectDatabase();

