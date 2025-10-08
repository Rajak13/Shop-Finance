import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectToDatabase from '../../../../lib/database';
import User from '../../../../lib/models/User';
import { fallbackUserOps, shouldUseFallback } from '../../../../lib/fallback-data';
import { APIResponse } from '../../../../types';

interface SessionResponse extends APIResponse {
  authenticated?: boolean;
  user?: Record<string, unknown>;
}

export async function GET() {
  try {
    // Get token from cookies with error handling
    let cookieStore;
    let token;
    
    try {
      cookieStore = await cookies();
      token = cookieStore.get('auth-token')?.value;
    } catch (cookieError) {
      console.error('Cookie access error:', cookieError);
      return NextResponse.json<SessionResponse>({
        success: true,
        authenticated: false
      });
    }

    if (!token) {
      return NextResponse.json<SessionResponse>({
        success: true,
        authenticated: false
      });
    }

    // Verify JWT token
    const sessionSecret = process.env.SESSION_SECRET;
    if (!sessionSecret) {
      throw new Error('SESSION_SECRET is not configured');
    }

    let decoded: jwt.JwtPayload;
    try {
      decoded = jwt.verify(token, sessionSecret) as jwt.JwtPayload;
    } catch {
      // Token is invalid or expired
      return NextResponse.json<SessionResponse>({
        success: true,
        authenticated: false
      });
    }

    let user;
    
    // Try database connection, fallback to in-memory data if needed
    if (shouldUseFallback()) {
      console.log('Using fallback data for session validation');
      user = fallbackUserOps.findById(decoded.userId);
      if (user) {
        // Remove password from response
        const { password, ...userWithoutPassword } = user;
        user = userWithoutPassword;
      }
    } else {
      try {
        // Check if this is a fallback user token
        if (decoded.isFallback) {
          throw new Error('Fallback user token, use fallback data');
        }
        
        // Connect to database and fetch user
        await connectToDatabase();
        
        // Validate ObjectId format
        if (typeof decoded.userId === 'string' && decoded.userId.length === 24 && /^[0-9a-fA-F]{24}$/.test(decoded.userId)) {
          const dbUser = await User.findById(decoded.userId).select('-password');
          user = dbUser?.toJSON();
        } else {
          // Invalid ObjectId format, use fallback
          throw new Error('Invalid user ID format');
        }
      } catch (dbError) {
        console.error('Database connection failed, using fallback:', dbError);
        user = fallbackUserOps.findById(decoded.userId);
        if (user) {
          const { password, ...userWithoutPassword } = user;
          user = userWithoutPassword;
        }
      }
    }

    if (!user) {
      // User no longer exists
      return NextResponse.json<SessionResponse>({
        success: true,
        authenticated: false
      });
    }

    return NextResponse.json<SessionResponse>({
      success: true,
      authenticated: true,
      user
    });

  } catch (error) {
    console.error('Session validation error:', error);
    
    return NextResponse.json<SessionResponse>({
      success: false,
      authenticated: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An internal error occurred during session validation'
      }
    }, { status: 500 });
  }
}