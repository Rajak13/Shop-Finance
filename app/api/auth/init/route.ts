import { NextResponse } from 'next/server';
import { seedAdminUser } from '../../../../lib/seed-admin';
import { APIResponse } from '../../../../types';

/**
 * Initialize admin user endpoint
 * This can be called to ensure the admin user exists in the database
 */
export async function POST() {
  try {
    const adminUser = await seedAdminUser();
    
    return NextResponse.json<APIResponse>({
      success: true,
      data: {
        message: 'Admin user initialized successfully',
        userExists: !!adminUser
      }
    });

  } catch (error) {
    console.error('Admin initialization error:', error);
    
    return NextResponse.json<APIResponse>({
      success: false,
      error: {
        code: 'INITIALIZATION_ERROR',
        message: 'Failed to initialize admin user'
      }
    }, { status: 500 });
  }
}