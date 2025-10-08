import { NextResponse } from 'next/server';
import setupDatabase from '../../../../scripts/setup-database';
import { APIResponse } from '../../../../types';

/**
 * Database setup endpoint
 * This endpoint initializes the MongoDB Atlas database and collections
 */
export async function POST() {
  try {
    const result = await setupDatabase();
    
    if (result.success) {
      return NextResponse.json<APIResponse>({
        success: true,
        data: {
          message: result.message,
          collections: result.collections,
          adminUser: result.adminUser
        }
      });
    } else {
      return NextResponse.json<APIResponse>({
        success: false,
        error: {
          code: 'SETUP_FAILED',
          message: result.error || 'Database setup failed'
        }
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Database setup API error:', error);
    
    return NextResponse.json<APIResponse>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An internal error occurred during database setup'
      }
    }, { status: 500 });
  }
}