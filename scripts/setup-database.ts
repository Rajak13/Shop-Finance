/**
 * Database setup script for MongoDB Atlas
 * This script connects to MongoDB Atlas and initializes all necessary collections
 */

import connectToDatabase from '../lib/database';
import { seedAdminUser } from '../lib/seed-admin';
import User from '../lib/models/User';
import Transaction from '../lib/models/Transaction';
import InventoryItem from '../lib/models/InventoryItem';

async function setupDatabase() {
  try {
    console.log('🚀 Starting database setup...');
    
    // 1. Test MongoDB Atlas connection
    console.log('📡 Connecting to MongoDB Atlas...');
    await connectToDatabase();
    console.log('✅ Successfully connected to MongoDB Atlas!');
    
    // 2. Initialize collections by accessing models
    console.log('📋 Initializing collections...');
    
    // Access each model to ensure collections are created
    await User.init();
    console.log('✅ Users collection initialized');
    
    await Transaction.init();
    console.log('✅ Transactions collection initialized');
    
    await InventoryItem.init();
    console.log('✅ Inventory items collection initialized');
    
    // 3. Create admin user
    console.log('👤 Setting up admin user...');
    await seedAdminUser();
    console.log('✅ Admin user created/verified');
    
    // 4. Verify collections exist
    console.log('🔍 Verifying database setup...');
    const collections = await User.db.db?.listCollections().toArray() || [];
    console.log('📊 Available collections:', collections.map(c => c.name));
    
    // 5. Test user lookup
    const adminUser = await User.findByEmail('admin@gmail.com');
    if (adminUser) {
      console.log('✅ Admin user verified:', {
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role
      });
    }
    
    console.log('🎉 Database setup completed successfully!');
    console.log('📝 Database Name: FINANCE-MANAGEMENT');
    console.log('🏢 Collections: users, transactions, inventoryitems');
    
    return {
      success: true,
      message: 'Database setup completed successfully',
      collections: collections.map(c => c.name),
      adminUser: adminUser ? {
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role
      } : null
    };
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('authentication failed')) {
        console.error('🔐 Authentication Error: Please check your MongoDB credentials');
      } else if (error.message.includes('ENOTFOUND')) {
        console.error('🌐 Network Error: Please check your internet connection');
      } else if (error.message.includes('MongoServerError')) {
        console.error('🗄️ MongoDB Error: Please check your database configuration');
      }
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Export for use in API routes or direct execution
export default setupDatabase;

// Allow direct execution
if (require.main === module) {
  setupDatabase()
    .then((result) => {
      console.log('\n📋 Setup Result:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 Unexpected error:', error);
      process.exit(1);
    });
}