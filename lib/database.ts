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
      console.warn('MONGODB_URI is not defined. Using fallback local MongoDB.');
      // Fallback to local MongoDB for development
      const fallbackUri = 'mongodb://localhost:27017/shabnam-transactions';
      
      try {
        const db = await mongoose.connect(fallbackUri, {
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 3000,
          socketTimeoutMS: 45000,
          bufferCommands: true, // Enable buffering for local development
        });
        
        connection.isConnected = db.connections[0].readyState;
        console.log('Connected to local MongoDB successfully');
        return;
      } catch (localError) {
        console.error('Local MongoDB connection also failed:', localError);
        throw new Error('No database connection available. Please configure MONGODB_URI or start local MongoDB.');
      }
    }

    // Connect to MongoDB with optimized settings for production
    const db = await mongoose.connect(mongoUri, {
      // Connection pool settings
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 30000, // Increased timeout for Atlas
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferCommands: true, // Enable buffering to handle connection delays
      retryWrites: true, // Enable retryable writes
      w: 'majority', // Write concern
      // Remove ssl and authSource as they're handled by the connection string
    });

    connection.isConnected = db.connections[0].readyState;
    console.log('Connected to MongoDB successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED')) {
        throw new Error('Unable to connect to MongoDB. Please ensure MongoDB is running.');
      } else if (error.message.includes('authentication failed')) {
        throw new Error('MongoDB authentication failed. Please check your credentials.');
      } else if (error.message.includes('IP whitelist') || error.message.includes('not authorized')) {
        throw new Error('IP address not whitelisted. Please add your IP to MongoDB Atlas whitelist.');
      } else if (error.message.includes('SSL') || error.message.includes('TLS')) {
        throw new Error('SSL/TLS connection error. Please check your MongoDB Atlas configuration.');
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