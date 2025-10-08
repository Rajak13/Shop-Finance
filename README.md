# Shabnam Collections Transaction Management System

A comprehensive transaction management system for Shabnam Collections, a kurti shop in Dharan, Nepal. Built with Next.js, TypeScript, MongoDB, and Tailwind CSS.

## Features

- 🔐 Secure authentication system
- 📊 Purchase and sales transaction management
- 📈 Business analytics and reporting
- 📱 **Mobile-optimized responsive design**
- 🌙 Light/dark theme support
- 📦 Inventory management with stock tracking
- 📋 Export functionality for reports
- 📲 **Progressive Web App (PWA) support**
- 🔄 **Pull-to-refresh functionality**
- 👆 **Touch-friendly interactions**
- 📴 **Offline functionality with fallback data**

## Tech Stack

- **Frontend:** Next.js 15.5.4, React 19, TypeScript
- **Styling:** Tailwind CSS 4
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** Custom session-based authentication
- **Charts:** Recharts for analytics visualization
- **Icons:** Lucide React

## Prerequisites

- Node.js 18+ 
- MongoDB (local or cloud instance)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd shabnam-transactions
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Update the environment variables in `.env.local`:
```env
MONGODB_URI=mongodb://localhost:27017/shabnam-transactions
MONGODB_DB=shabnam-transactions
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
SESSION_SECRET=your-session-secret-here
NODE_ENV=development
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Default Login Credentials

- **Email:** admin@gmail.com
- **Password:** shabnam123@

## Project Structure

```
shabnam-transactions/
├── app/                    # Next.js app directory
├── lib/                    # Utility functions and configurations
│   ├── config.ts          # Environment configuration
│   ├── constants.ts       # Application constants
│   └── utils.ts           # Helper utilities
├── types/                  # TypeScript type definitions
│   └── index.ts           # Main type definitions
├── .env.example           # Environment variables template
└── .env.local            # Local environment variables (not committed)
```

## Mobile & PWA Features

### Mobile Optimizations
- **Touch-friendly UI**: All interactive elements meet minimum 44px touch target requirements
- **Mobile-first responsive design**: Optimized layouts for all screen sizes
- **Bottom navigation**: Easy thumb-friendly navigation on mobile devices
- **Pull-to-refresh**: Swipe down to refresh data on mobile
- **Swipeable interactions**: Swipe gestures for enhanced mobile UX
- **Safe area support**: Proper handling of device notches and home indicators

### Progressive Web App (PWA)
- **Installable**: Add to home screen on mobile devices
- **Offline support**: Basic functionality works without internet connection
- **Service worker**: Caches resources for faster loading
- **App manifest**: Native app-like experience
- **Background sync**: Sync data when connection is restored

### Fallback System
The application includes a robust fallback system for development:
- **In-memory data store**: Works without database connection
- **Automatic fallback**: Seamlessly switches to fallback when database is unavailable
- **Development notices**: Clear indicators when running in fallback mode

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `MONGODB_DB` | Database name | No (defaults to shabnam-transactions) |
| `NEXTAUTH_SECRET` | Secret for authentication | Yes |
| `NEXTAUTH_URL` | Application URL | No (defaults to localhost:3000) |
| `SESSION_SECRET` | Secret for session management | Yes |
| `NODE_ENV` | Environment (development/production) | No |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is private and proprietary to Shabnam Collections.