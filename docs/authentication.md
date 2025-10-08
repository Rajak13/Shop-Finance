# Authentication System Documentation

## Overview

The authentication system provides secure login/logout functionality with JWT-based session management for the Shabnam Collections transaction management system.

## Features

- ✅ Secure login with email/password validation
- ✅ JWT-based session management with HTTP-only cookies
- ✅ Session validation and user context
- ✅ Logout with session cleanup
- ✅ Authentication middleware for protecting API routes
- ✅ Admin user seeding utility
- ✅ Role-based access control

## API Endpoints

### Authentication Endpoints

#### POST `/api/auth/login`
Authenticates user with email and password.

**Request Body:**
```json
{
  "email": "admin@gmail.com",
  "password": "shabnam123@"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "_id": "...",
    "email": "admin@gmail.com",
    "name": "Admin User",
    "role": "admin",
    "createdAt": "...",
    "updatedAt": "..."
  },
  "token": "jwt-token-here"
}
```

#### POST `/api/auth/logout`
Logs out the current user and clears the session cookie.

**Response:**
```json
{
  "success": true
}
```

#### GET `/api/auth/session`
Validates the current session and returns user information.

**Response:**
```json
{
  "success": true,
  "authenticated": true,
  "user": {
    "_id": "...",
    "email": "admin@gmail.com",
    "name": "Admin User",
    "role": "admin",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

#### POST `/api/auth/init`
Initializes the admin user in the database (development utility).

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Admin user initialized successfully",
    "userExists": true
  }
}
```

## Authentication Middleware

### Basic Usage

```typescript
import { withAuth, AuthenticatedRequest } from '../../../lib/auth-middleware';

async function handler(request: AuthenticatedRequest) {
  // Access authenticated user
  const user = request.user;
  
  return NextResponse.json({
    success: true,
    data: { message: `Hello ${user.name}` }
  });
}

export const GET = withAuth(handler);
```

### Admin-Only Routes

```typescript
import { withAdminAuth, AuthenticatedRequest } from '../../../lib/auth-middleware';

async function adminHandler(request: AuthenticatedRequest) {
  // Only admin users can access this
  return NextResponse.json({
    success: true,
    data: { message: 'Admin only content' }
  });
}

export const GET = withAdminAuth(adminHandler);
```

### Optional Authentication

```typescript
import { withOptionalAuth, AuthenticatedRequest } from '../../../lib/auth-middleware';

async function optionalHandler(request: AuthenticatedRequest) {
  // User may or may not be authenticated
  if (request.user) {
    return NextResponse.json({
      success: true,
      data: { message: `Hello ${request.user.name}` }
    });
  } else {
    return NextResponse.json({
      success: true,
      data: { message: 'Hello anonymous user' }
    });
  }
}

export const GET = withOptionalAuth(optionalHandler);
```

## Environment Variables

Make sure these environment variables are set:

```env
# Session Configuration
SESSION_SECRET=your-session-secret-here-change-in-production

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/shabnam-transactions
```

## Admin Credentials

The system is configured to accept only the following admin credentials:
- **Email:** `admin@gmail.com`
- **Password:** `shabnam123@`

## Security Features

1. **Password Hashing:** Passwords are hashed using bcrypt with 12 salt rounds
2. **JWT Tokens:** Secure JWT tokens with 7-day expiration
3. **HTTP-Only Cookies:** Session tokens stored in secure HTTP-only cookies
4. **Input Validation:** Server-side validation for all authentication inputs
5. **Error Handling:** Secure error messages that don't leak sensitive information

## Testing

Use the test utility to verify the authentication system:

```typescript
import { testAuthSystem } from '../lib/test-auth';

// Run authentication tests
const result = await testAuthSystem();
console.log(result);
```

## Usage in Frontend

### Login Example

```typescript
const login = async (email: string, password: string) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  
  const data = await response.json();
  
  if (data.success) {
    // User is now logged in
    // Cookie is automatically set
    return data.user;
  } else {
    throw new Error(data.error.message);
  }
};
```

### Session Check Example

```typescript
const checkSession = async () => {
  const response = await fetch('/api/auth/session');
  const data = await response.json();
  
  return data.authenticated ? data.user : null;
};
```

### Logout Example

```typescript
const logout = async () => {
  const response = await fetch('/api/auth/logout', {
    method: 'POST',
  });
  
  const data = await response.json();
  
  if (data.success) {
    // User is now logged out
    // Cookie is automatically cleared
    return true;
  } else {
    throw new Error(data.error.message);
  }
};
```

## Error Codes

- `VALIDATION_ERROR`: Invalid input data
- `INVALID_CREDENTIALS`: Wrong email or password
- `UNAUTHORIZED`: Authentication required
- `INVALID_TOKEN`: JWT token is invalid or expired
- `USER_NOT_FOUND`: User doesn't exist
- `FORBIDDEN`: Insufficient permissions
- `INTERNAL_ERROR`: Server error
- `INITIALIZATION_ERROR`: Failed to initialize admin user