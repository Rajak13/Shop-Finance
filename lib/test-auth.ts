/**
 * Test utility for authentication system
 * This file can be used to manually test the auth functionality
 */

import { seedAdminUser } from './seed-admin';
import User from './models/User';
import connectToDatabase from './database';

export async function testAuthSystem() {
  try {
    console.log('🔧 Testing authentication system...');
    
    // 1. Test database connection
    console.log('📡 Connecting to database...');
    await connectToDatabase();
    console.log('✅ Database connected successfully');
    
    // 2. Test admin user creation
    console.log('👤 Creating admin user...');
    await seedAdminUser();
    console.log('✅ Admin user created/verified');
    
    // 3. Test user lookup
    console.log('🔍 Testing user lookup...');
    const user = await User.findByEmail('admin@gmail.com');
    if (!user) {
      throw new Error('Admin user not found after creation');
    }
    console.log('✅ User lookup successful');
    
    // 4. Test password comparison
    console.log('🔐 Testing password validation...');
    const isValidPassword = await user.comparePassword('shabnam123@');
    if (!isValidPassword) {
      throw new Error('Password validation failed');
    }
    console.log('✅ Password validation successful');
    
    // 5. Test invalid password
    console.log('❌ Testing invalid password...');
    const isInvalidPassword = await user.comparePassword('wrongpassword');
    if (isInvalidPassword) {
      throw new Error('Invalid password was accepted');
    }
    console.log('✅ Invalid password correctly rejected');
    
    console.log('🎉 All authentication tests passed!');
    
    return {
      success: true,
      message: 'Authentication system is working correctly'
    };
    
  } catch (error) {
    console.error('❌ Authentication test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Export for potential use in API routes or scripts
export default testAuthSystem;