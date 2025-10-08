import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/database';
import { seedAdminUser } from '../../../../lib/seed-admin';
import User from '../../../../lib/models/User';
import { APIResponse } from '../../../../types';

/**
 * Simple database setup that works with existing collections
 */
export async function POST() {
  try {
    console.log('🚀 Starting simple database setup...');
    
    // 1. Connect to database
    console.log('📡 Connecting to MongoDB Atlas...');
    await connectToDatabase();
    console.log('✅ Connected to MongoDB Atlas!');
    
    // 2. Create admin user
    console.log('👤 Setting up admin user...');
    await seedAdminUser();
    console.log('✅ Admin user created/verified');
    
    // 3. Verify admin user
    const adminUser = await User.findByEmail('admin@gmail.com');
    
    // 4. Get collection info
    const collections = await User.db.db?.listCollections().toArray() || [];
    
    console.log('🎉 Simple setup completed successfully!');
    
    return NextResponse.json<APIResponse>({
      success: true,
      data: {
        message: 'Database setup completed successfully',
        database: 'FINANCE-MANAGEMENT',
        collections: collections.map(c => c.name),
        adminUser: adminUser ? {
          email: adminUser.email,
          name: adminUser.name,
          role: adminUser.role,
          createdAt: adminUser.createdAt
        } : null
      }
    });

  } catch (error) {
    console.error('❌ Simple setup failed:', error);
    
    return NextResponse.json<APIResponse>({
      success: false,
      error: {
        code: 'SETUP_FAILED',
        message: error instanceof Error ? error.message : 'Setup failed'
      }
    }, { status: 500 });
  }
}