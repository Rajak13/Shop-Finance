# Vercel Deployment Guide

## Environment Variables for Vercel

When deploying to Vercel, you need to set the following environment variables in your Vercel dashboard:

### Required Environment Variables

1. **Database Configuration**
   ```
   MONGODB_URI=mongodb+srv://rajakansari833_db_user:6rp1LYbREHH9e09x@cluster0.zumkpy2.mongodb.net/FINANCE-MANAGEMENT?retryWrites=true&w=majority&appName=Cluster0
   MONGODB_DB=FINANCE-MANAGEMENT
   ```

2. **Authentication Secrets**
   ```
   NEXTAUTH_SECRET=your-production-secret-key-here
   NEXTAUTH_URL=https://your-vercel-domain.vercel.app
   SESSION_SECRET=your-production-session-secret-here
   ```

3. **Application Configuration**
   ```
   NODE_ENV=production
   ```

## How to Set Environment Variables in Vercel

### Method 1: Vercel Dashboard
1. Go to your project in the Vercel dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable with the following settings:
   - **Name**: Variable name (e.g., `MONGODB_URI`)
   - **Value**: Variable value
   - **Environment**: Select `Production`, `Preview`, and `Development`

### Method 2: Vercel CLI
```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Set environment variables
vercel env add MONGODB_URI
vercel env add MONGODB_DB
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL
vercel env add SESSION_SECRET
vercel env add NODE_ENV
```

## Environment Variables Details

### 1. MONGODB_URI
- **Value**: `mongodb+srv://rajakansari833_db_user:6rp1LYbREHH9e09x@cluster0.zumkpy2.mongodb.net/FINANCE-MANAGEMENT?retryWrites=true&w=majority&appName=Cluster0`
- **Description**: MongoDB Atlas connection string
- **Required for**: Database connectivity

### 2. MONGODB_DB
- **Value**: `FINANCE-MANAGEMENT`
- **Description**: Database name
- **Required for**: Database operations

### 3. NEXTAUTH_SECRET
- **Value**: Generate a secure random string (32+ characters)
- **Example**: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6`
- **Description**: Secret key for NextAuth.js
- **Required for**: Authentication security
- **Generate with**: `openssl rand -base64 32`

### 4. NEXTAUTH_URL
- **Value**: `https://your-vercel-domain.vercel.app`
- **Description**: Your production domain URL
- **Required for**: Authentication redirects
- **Note**: Replace with your actual Vercel domain

### 5. SESSION_SECRET
- **Value**: Generate a secure random string (32+ characters)
- **Example**: `z6y5x4w3v2u1t0s9r8q7p6o5n4m3l2k1j0i9h8g7f6e5d4c3b2a1`
- **Description**: Secret key for session management
- **Required for**: Session security
- **Generate with**: `openssl rand -base64 32`

### 6. NODE_ENV
- **Value**: `production`
- **Description**: Application environment
- **Required for**: Production optimizations

## Security Best Practices

### 1. Generate Strong Secrets
```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate SESSION_SECRET
openssl rand -base64 32
```

### 2. MongoDB Atlas Security
- Ensure your MongoDB Atlas cluster allows connections from Vercel
- Add `0.0.0.0/0` to IP whitelist for Vercel deployments
- Or use MongoDB Atlas's Vercel integration

### 3. Environment-Specific URLs
- **Development**: `http://localhost:3000`
- **Production**: `https://your-domain.vercel.app`

## Deployment Steps

1. **Prepare Environment Variables**
   ```bash
   # Copy your environment variables
   cp .env.local .env.production
   # Edit .env.production with production values
   ```

2. **Set Variables in Vercel**
   - Use Vercel dashboard or CLI to set all variables
   - Ensure all environments (Production, Preview, Development) are selected

3. **Deploy**
   ```bash
   # Deploy to Vercel
   vercel --prod
   ```

4. **Verify Deployment**
   - Check that all environment variables are set
   - Test database connectivity
   - Verify authentication works

## Troubleshooting

### Build Errors
- Ensure all environment variables are set
- Check that MongoDB URI is accessible from Vercel
- Verify secrets are properly generated

### Database Connection Issues
- Add `0.0.0.0/0` to MongoDB Atlas IP whitelist
- Check MongoDB URI format
- Ensure database user has proper permissions

### Authentication Issues
- Verify NEXTAUTH_URL matches your domain
- Check that secrets are properly set
- Ensure SESSION_SECRET is different from NEXTAUTH_SECRET

## Example Vercel Configuration

Create a `vercel.json` file in your project root:

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "env": {
    "MONGODB_URI": "@mongodb-uri",
    "MONGODB_DB": "@mongodb-db",
    "NEXTAUTH_SECRET": "@nextauth-secret",
    "NEXTAUTH_URL": "@nextauth-url",
    "SESSION_SECRET": "@session-secret",
    "NODE_ENV": "production"
  }
}
```

## Post-Deployment Checklist

- [ ] All environment variables are set
- [ ] Database connection works
- [ ] Authentication system works
- [ ] All pages load correctly
- [ ] API routes respond properly
- [ ] Theme switching works
- [ ] Mobile responsiveness is maintained

## Support

If you encounter issues during deployment:
1. Check Vercel deployment logs
2. Verify all environment variables are set correctly
3. Test database connectivity
4. Check MongoDB Atlas network access settings