import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { APIResponse } from '../../../../types';

export async function POST() {
  try {
    // Clear the authentication cookie
    const cookieStore = await cookies();
    cookieStore.delete('auth-token');

    return NextResponse.json<APIResponse>({
      success: true
    });

  } catch (error) {
    console.error('Logout error:', error);
    
    return NextResponse.json<APIResponse>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An internal error occurred during logout'
      }
    }, { status: 500 });
  }
}