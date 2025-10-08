import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/database';
import { APIResponse } from '../../../../types';

/**
 * Test MongoDB Atlas connection endpoint
 */
export async function GET() {
  try {
    console.log('Testing MongoDB Atlas connection...');
    
    // Test connection
    await connectToDatabase();
    
    return NextResponse.json<APIResponse>({
      success: true,
      data: {
        message: 'Successfully connected to MongoDB Atlas!',
        database: process.env.MONGODB_DB || 'FINANCE-MANAGEMENT',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Connection test failed:', error);
    
    let errorMessage = 'Unknown connection error';
    let errorCode = 'CONNECTION_ERROR';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      if (error.message.includes('authentication failed')) {
        errorCode = 'AUTH_ERROR';
        errorMessage = 'MongoDB authentication failed. Please check your credentials.';
      } else if (error.message.includes('ENOTFOUND')) {
        errorCode = 'NETWORK_ERROR';
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.message.includes('MONGODB_URI')) {
        errorCode = 'CONFIG_ERROR';
        errorMessage = 'MongoDB URI is not configured properly.';
      }
    }
    
    return NextResponse.json<APIResponse>({
      success: false,
      error: {
        code: errorCode,
        message: errorMessage,
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}