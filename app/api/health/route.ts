import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      message: 'API is working',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json({
      success: false,
      error: 'Health check failed'
    }, { status: 500 });
  }
}