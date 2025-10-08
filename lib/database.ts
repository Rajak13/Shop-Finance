import mongoose from 'mongoose';

interface ConnectionObject {
  isConnected?: number;
}

const connection: ConnectionObject = {};

async function connectToDatabase(): Promise<void> {
  // Check if we have a connection to the database or if it's currently connecting
  if (connection.isConnected) {
    console.log('Already connected to database');
    return;
  }

  // Check if mongoose is already connected
  if (mongoose.connection.readyState === 1) {
    connection.isConnected = 1;
    console.log('Using existing mongoose connection');
    return;
  }

  try {
    // Get the MongoDB URI from environment variables
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.warn('MONGODB_URI is not defined. Database operations will use fallback data.');
      throw new Error('MONGODB_URI not configured');
    }

    // Connect to MongoDB with optimized settings for production
    const db = await mongoose.connect(mongoUri, {
      // Connection pool settings
      maxPoolSize: 10, // Connection pool size
      serverSelectionTimeoutMS: 5000, // How long to try selecting a server
      socketTimeoutMS: 45000, // How long a send or receive on a socket can take
      connectTimeoutMS: 10000, // How long to wait for initial connection
      bufferCommands: false, // Disable mongoose buffering
      retryWrites: true, // Enable retryable writes
      w: 'majority', // Write concern
    });

    connection.isConnected = db.connections[0].readyState;
    console.log('Connected to MongoDB successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
    
    // Provide more specific error messages and always throw to trigger fallback
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED')) {
        throw new Error('Unable to connect to MongoDB. Please ensure MongoDB is running.');
      } else if (error.message.includes('authentication failed')) {
        throw new Error('MongoDB authentication failed. Please check your credentials.');
      } else if (error.message.includes('IP whitelist') || error.message.includes('not authorized') || error.message.includes('not whitelisted')) {
        throw new Error('IP address not whitelisted. Please add your IP to MongoDB Atlas whitelist.');
      } else if (error.message.includes('SSL') || error.message.includes('TLS') || error.message.includes('tlsv1 alert internal error')) {
        throw new Error('SSL/TLS connection error. Please check your MongoDB Atlas configuration.');
      } else if (error.message.includes('MongoServerSelectionError')) {
        throw new Error('Could not connect to MongoDB Atlas. Please check your connection string and network access.');
      }
    }
    
    throw error;
  }
}

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (error) => {
  console.error('Mongoose connection error:', error);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB');
  connection.isConnected = 0;
});

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
});

export default connectToDatabase;