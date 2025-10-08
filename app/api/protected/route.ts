import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest, getAuthenticatedUser } from '../../../lib/auth-middleware';
import { APIResponse } from '../../../types';

/**
 * Example protected route that demonstrates authentication middleware usage
 */
async function handler(request: AuthenticatedRequest) {
  try {
    // Get the authenticated user
    const user = getAuthenticatedUser(request);
    
    return NextResponse.json<APIResponse>({
      success: true,
      data: {
        message: 'This is a protected route',
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Protected route error:', error);
    
    return NextResponse.json<APIResponse>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An internal error occurred'
      }
    }, { status: 500 });
  }
}

// Export the handler wrapped with authentication middleware
export const GET = withAuth(handler);
export const POST = withAuth(handler);