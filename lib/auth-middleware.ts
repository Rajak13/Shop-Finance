import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectToDatabase from './database';
import User from './models/User';
import { APIResponse } from '../types';
import { Types } from 'mongoose';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    _id: string;
    email: string;
    name: string;
    role: string;
  };
}

export interface AuthMiddlewareOptions {
  requireAuth?: boolean;
  allowedRoles?: string[];
}

/**
 * Authentication middleware for API routes
 * Validates JWT token from cookies and attaches user to request
 */
export function withAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
  options: AuthMiddlewareOptions = { requireAuth: true }
) {
  return async (request: NextRequest) => {
    try {
      // Get token from cookies
      const token = request.cookies.get('auth-token')?.value;

      if (!token) {
        if (options.requireAuth) {
          return NextResponse.json<APIResponse>({
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication required'
            }
          }, { status: 401 });
        }
        // If auth is not required, continue without user
        return handler(request as AuthenticatedRequest);
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
        if (options.requireAuth) {
          return NextResponse.json<APIResponse>({
            success: false,
            error: {
              code: 'INVALID_TOKEN',
              message: 'Invalid or expired authentication token'
            }
          }, { status: 401 });
        }
        // If auth is not required, continue without user
        return handler(request as AuthenticatedRequest);
      }

      let user;
      
      try {
        // Connect to database and fetch user
        await connectToDatabase();
        user = await User.findById(decoded.userId).select('-password');
      } catch (dbError) {
        console.error('Database connection failed in auth middleware:', dbError);
        // If database fails, we can't validate the user, so reject the request
        if (options.requireAuth) {
          return NextResponse.json<APIResponse>({
            success: false,
            error: {
              code: 'DATABASE_ERROR',
              message: 'Authentication service temporarily unavailable'
            }
          }, { status: 503 });
        }
        // If auth is not required, continue without user
        return handler(request as AuthenticatedRequest);
      }

      if (!user) {
        if (options.requireAuth) {
          return NextResponse.json<APIResponse>({
            success: false,
            error: {
              code: 'USER_NOT_FOUND',
              message: 'User not found'
            }
          }, { status: 401 });
        }
        // If auth is not required, continue without user
        return handler(request as AuthenticatedRequest);
      }

      // Check role permissions if specified
      if (options.allowedRoles && !options.allowedRoles.includes(user.role)) {
        return NextResponse.json<APIResponse>({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions'
          }
        }, { status: 403 });
      }

      // Attach user to request
      const authenticatedRequest = request as AuthenticatedRequest;
      authenticatedRequest.user = {
        _id: (user._id as Types.ObjectId).toString(),
        email: user.email,
        name: user.name,
        role: user.role
      };

      return handler(authenticatedRequest);

    } catch (error) {
      console.error('Auth middleware error:', error);

      return NextResponse.json<APIResponse>({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An internal error occurred during authentication'
        }
      }, { status: 500 });
    }
  };
}

/**
 * Utility function to extract user from request in authenticated routes
 */
export function getAuthenticatedUser(request: AuthenticatedRequest) {
  if (!request.user) {
    throw new Error('User not authenticated');
  }
  return request.user;
}

/**
 * Middleware specifically for admin-only routes
 */
export function withAdminAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return withAuth(handler, {
    requireAuth: true,
    allowedRoles: ['admin']
  });
}

/**
 * Middleware for optional authentication (user may or may not be logged in)
 */
export function withOptionalAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return withAuth(handler, {
    requireAuth: false
  });
}