// Environment variables are loaded via --require dotenv/config in package.json
// If MONGODB_URI is not set, provide helpful error message
if (!process.env.MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI environment variable is not set!');
  console.error('   Please create a .env.local file with your MONGODB_URI');
  console.error('   Example: MONGODB_URI=mongodb://localhost:27017/wp_finalproject');
  process.exit(1);
}

import mongoose from 'mongoose';
import connectDB from '../lib/mongodb';
import User from '../models/User';

/**
 * Database Cleanup Script
 * This script removes all data from the database
 * WARNING: This will delete all data permanently!
 */

async function cleanupDatabase() {
  try {
    console.log('🧹 Database Cleanup Script\n');
    console.log('⚠️  WARNING: This will delete ALL data from your database!');
    console.log('='.repeat(50));

    // Connect to database
    console.log('\n1️⃣ Connecting to MongoDB...');
    await connectDB();
    const connection = mongoose.connection;
    
    if (connection.readyState !== 1) {
      console.log('❌ MongoDB Connection Failed');
      console.log(`   Ready State: ${connection.readyState}`);
      return;
    }

    console.log('✅ Connected to MongoDB');
    console.log(`   Database: ${connection.name}`);

    if (!connection.db) {
      console.log('❌ Database not available');
      return;
    }

    const currentDb = connection.db;

    // Helper function to filter out system collections
    const isSystemCollection = (name: string): boolean => {
      return name.startsWith('system.') || 
             name.startsWith('_') || 
             name === 'fs.chunks' || 
             name === 'fs.files';
    };

    // List all collections and their document counts
    console.log('\n2️⃣ Scanning database for collections...');
    const allCollections = await currentDb.listCollections().toArray();
    
    // Filter out system collections
    const collections = allCollections.filter((col: any) => !isSystemCollection(col.name));
    
    if (collections.length === 0) {
      console.log('   ℹ️  No user collections found. Database is already empty.');
      await mongoose.connection.close();
      console.log('\n🔌 Database connection closed.');
      process.exit(0);
    }

    console.log(`   Found ${collections.length} user collection(s):`);
    
    const collectionInfo: Array<{ name: string; count: number }> = [];
    
    for (const collection of collections) {
      const count = await currentDb.collection(collection.name).countDocuments();
      collectionInfo.push({ name: collection.name, count });
      console.log(`   - ${collection.name}: ${count} document(s)`);
    }

    const totalDocuments = collectionInfo.reduce((sum, col) => sum + col.count, 0);
    
    if (totalDocuments === 0) {
      console.log('\n   ℹ️  All collections are empty. Nothing to clean up.');
      await mongoose.connection.close();
      console.log('\n🔌 Database connection closed.');
      process.exit(0);
    }

    console.log(`\n   Total documents to delete: ${totalDocuments}`);

    // Confirmation prompt
    console.log('\n3️⃣ Confirmation Required:');
    console.log('   This will permanently delete all data from:');
    collectionInfo.forEach(({ name, count }) => {
      if (count > 0) {
        console.log(`   - ${name} (${count} document(s))`);
      }
    });
    
    // Check for --yes flag to skip confirmation
    const skipConfirmation = process.argv.includes('--yes') || process.argv.includes('-y');
    
    if (!skipConfirmation) {
      console.log('\n   Type "yes" to confirm deletion, or press Ctrl+C to cancel:');
      
      // Read from stdin
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const answer = await new Promise<string>((resolve) => {
        rl.question('   > ', resolve);
      });
      rl.close();

      if (answer.toLowerCase() !== 'yes') {
        console.log('\n❌ Cleanup cancelled.');
        await mongoose.connection.close();
        process.exit(0);
      }
    } else {
      console.log('\n   ⚠️  Auto-confirming (--yes flag detected)');
    }

    // Delete all documents from each collection
    console.log('\n4️⃣ Deleting data...');
    
    let deletedCount = 0;
    // Delete from all collections (not just those with count > 0) to handle race conditions
    for (const { name } of collectionInfo) {
      try {
        const result = await currentDb.collection(name).deleteMany({});
        deletedCount += result.deletedCount;
        if (result.deletedCount > 0) {
          console.log(`   ✅ Deleted ${result.deletedCount} document(s) from ${name}`);
        }
      } catch (error: any) {
        console.log(`   ⚠️  Error deleting from ${name}: ${error.message}`);
      }
    }

    console.log(`\n   Total documents deleted: ${deletedCount}`);

    // Re-scan all collections to catch any that might have been created during execution
    console.log('\n5️⃣ Verifying cleanup...');
    const allCollectionsAfter = await currentDb.listCollections().toArray();
    const userCollectionsAfter = allCollectionsAfter.filter((col: any) => !isSystemCollection(col.name));
    
    let remainingCount = 0;
    const remainingCollections: string[] = [];
    
    for (const collection of userCollectionsAfter) {
      const count = await currentDb.collection(collection.name).countDocuments();
      if (count > 0) {
        remainingCount += count;
        remainingCollections.push(collection.name);
        console.log(`   ⚠️  ${collection.name} still has ${count} document(s)`);
      }
    }

    if (remainingCount === 0) {
      console.log('   ✅ All collections are now empty');
    } else {
      console.log(`   ⚠️  Warning: ${remainingCount} document(s) still remain in ${remainingCollections.length} collection(s)`);
      console.log('   💡 Tip: Run the script again to clean up any remaining data');
    }

    // Get final database stats
    console.log('\n6️⃣ Final Database Statistics:');
    const stats = await currentDb.stats();
    console.log(`   Collections: ${stats.collections}`);
    console.log(`   Data Size: ${(stats.dataSize / 1024).toFixed(2)} KB`);
    console.log(`   Storage Size: ${(stats.storageSize / 1024).toFixed(2)} KB`);
    console.log(`   Indexes: ${stats.indexes} (indexes are preserved)`);
    console.log(`   Index Size: ${(stats.indexSize / 1024).toFixed(2)} KB`);

    console.log('\n' + '='.repeat(50));
    console.log('✅ Database cleanup completed!');
    console.log('   Note: Collections and indexes are preserved, only documents were deleted.');
    console.log('   To drop collections entirely, use MongoDB shell or add --drop-collections flag.\n');

  } catch (error: any) {
    console.error('\n❌ Error during cleanup:');
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

// Run the cleanup
cleanupDatabase();

