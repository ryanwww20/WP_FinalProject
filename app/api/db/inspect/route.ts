import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function GET() {
  try {
    // Connect to database
    const connection = await connectDB();
    
    if (connection.readyState !== 1) {
      return NextResponse.json(
        { error: 'MongoDB connection failed', readyState: connection.readyState },
        { status: 500 }
      );
    }

    const currentDb = connection.db;
    
    // Gather database information
    const info = {
      connection: {
        status: 'connected',
        host: connection.host,
        port: connection.port,
        database: connection.name,
        readyState: connection.readyState,
      },
      databases: [] as any[],
      collections: [] as any[],
      userCollection: {
        count: 0,
        sample: null as any,
        all: [] as any[],
      },
      schema: {
        fields: [] as any[],
      },
      statistics: {} as any,
    };

    // List all databases
    try {
      const adminDb = connection.db.admin();
      const dbList = await adminDb.listDatabases();
      info.databases = dbList.databases.map((db: any) => ({
        name: db.name,
        sizeMB: (db.sizeOnDisk / 1024 / 1024).toFixed(2),
      }));
    } catch (error) {
      console.error('Error listing databases:', error);
    }

    // List all collections
    try {
      const collections = await currentDb.listCollections().toArray();
      info.collections = collections.map((col: any) => ({
        name: col.name,
        type: col.type,
      }));
    } catch (error) {
      console.error('Error listing collections:', error);
    }

    // Get User collection info
    try {
      info.userCollection.count = await User.countDocuments();
      
      if (info.userCollection.count > 0) {
        info.userCollection.sample = await User.findOne().lean();
        info.userCollection.all = await User.find().limit(10).lean();
      }
    } catch (error) {
      console.error('Error getting user collection:', error);
    }

    // Get schema structure
    try {
      const userSchema = User.schema;
      const paths = userSchema.paths;
      info.schema.fields = Object.keys(paths).map((field) => {
        const path = paths[field];
        return {
          name: field,
          type: path.instance,
          required: path.isRequired || false,
          unique: path.options.unique || false,
          default: path.options.default,
        };
      });
    } catch (error) {
      console.error('Error getting schema:', error);
    }

    // Get database statistics
    try {
      const stats = await currentDb.stats();
      info.statistics = {
        collections: stats.collections,
        dataSizeKB: (stats.dataSize / 1024).toFixed(2),
        storageSizeKB: (stats.storageSize / 1024).toFixed(2),
        indexes: stats.indexes,
        indexSizeKB: (stats.indexSize / 1024).toFixed(2),
      };
    } catch (error) {
      console.error('Error getting statistics:', error);
    }

    return NextResponse.json(info, { status: 200 });
  } catch (error: any) {
    console.error('Database inspection error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to inspect database', 
        message: error.message,
        connection: {
          status: 'error',
        }
      },
      { status: 500 }
    );
  }
}

