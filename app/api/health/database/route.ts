import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/database';
import { shouldUseFallback, enableFallback, disableFallback } from '../../../../lib/fallback-data';
import mongoose from 'mongoose';

export async function GET() {
  try {
    const status = {
      database: 'unknown',
      fallback: shouldUseFallback(),
      mongooseState: mongoose.connection.readyState,
      timestamp: new Date().toISOString()
    };

    // Try to connect to database
    try {
      await connectToDatabase();
      status.database = 'connected';
      disableFallback(); // Disable fallback if database is working
    } catch (error) {
      console.error('Database health check failed:', error);
      status.database = 'failed';
      enableFallback(); // Enable fallback if database fails
    }

    return NextResponse.json({
      success: true,
      status,
      message: status.database === 'connected' 
        ? 'Database connection healthy' 
        : 'Using fallback data due to database connection issues'
    });

  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'HEALTH_CHECK_FAILED',
        message: 'Health check failed'
      }
    }, { status: 500 });
  }
}

// Force database reconnection
export async function POST() {
  try {
    // Close existing connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }

    // Reset fallback state
    disableFallback();

    // Try to reconnect
    await connectToDatabase();

    return NextResponse.json({
      success: true,
      message: 'Database reconnection successful'
    });

  } catch (error) {
    console.error('Database reconnection failed:', error);
    enableFallback();

    return NextResponse.json({
      success: false,
      error: {
        code: 'RECONNECTION_FAILED',
        message: 'Database reconnection failed, using fallback data'
      }
    }, { status: 500 });
  }
}