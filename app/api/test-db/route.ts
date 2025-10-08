import { NextResponse } from 'next/server';
import connectToDatabase from '../../../lib/database';
import { shouldUseFallback } from '../../../lib/fallback-data';

export async function GET() {
  try {
    const result = {
      timestamp: new Date().toISOString(),
      mongoUri: process.env.MONGODB_URI ? 'Set' : 'Not set',
      shouldUseFallback: shouldUseFallback(),
      connectionTest: 'Not tested'
    };

    if (shouldUseFallback()) {
      result.connectionTest = 'Using fallback data (no MongoDB URI)';
    } else {
      try {
        await connectToDatabase();
        result.connectionTest = 'Database connection successful';
      } catch (error) {
        result.connectionTest = `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    }

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}