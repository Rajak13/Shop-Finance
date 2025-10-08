import connectToDatabase from './database';
import User from './models/User';

/**
 * Seeds the admin user if it doesn't exist
 * This ensures the admin@gmail.com user is available for login
 */
export async function seedAdminUser() {
  try {
    await connectToDatabase();

    // Check if admin user already exists
    const existingAdmin = await User.findByEmail('admin@gmail.com');
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      return existingAdmin;
    }

    // Create admin user with the specified credentials
    const adminUser = new User({
      email: 'admin@gmail.com',
      password: 'shabnam123@', // This will be hashed by the pre-save middleware
      name: 'Admin User',
      role: 'admin'
    });

    await adminUser.save();
    console.log('Admin user created successfully');
    
    return adminUser;
  } catch (error) {
    console.error('Error seeding admin user:', error);
    throw error;
  }
}

/**
 * Utility function to run the seed operation
 * Can be called from API routes or during app initialization
 */
export async function ensureAdminExists() {
  try {
    await seedAdminUser();
  } catch (error) {
    console.error('Failed to ensure admin user exists:', error);
    // Don't throw error to prevent app from crashing
    // The login will handle the case where admin doesn't exist
  }
}