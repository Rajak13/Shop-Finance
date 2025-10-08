#!/usr/bin/env node

/**
 * Database Connection Test Script
 * Run this to test your MongoDB connection before deployment
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  console.log('🔍 Testing MongoDB connection...\n');
  
  const mongoUri = process.env.MONGODB_URI;
  
  if (!mongoUri) {
    console.error('❌ MONGODB_URI not found in environment variables');
    console.log('Please check your .env.local file');
    process.exit(1);
  }
  
  console.log('📋 Connection Details:');
  console.log(`URI: ${mongoUri.replace(/:[^:@]*@/, ':****@')}`);
  console.log(`Database: ${process.env.MONGODB_DB || 'Not specified'}\n`);
  
  try {
    console.log('🔄 Attempting to connect...');
    
    await mongoose.connect(mongoUri, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 20000,
      connectTimeoutMS: 10000,
      bufferCommands: false,
      bufferMaxEntries: 0,
      retryWrites: true,
      w: 'majority',
    });
    
    console.log('✅ Successfully connected to MongoDB!');
    console.log(`📊 Connection state: ${mongoose.connection.readyState}`);
    console.log(`🏠 Database name: ${mongoose.connection.db.databaseName}`);
    
    // Test a simple operation
    console.log('\n🧪 Testing database operations...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📁 Found ${collections.length} collections`);
    
    if (collections.length > 0) {
      console.log('Collections:');
      collections.forEach(col => console.log(`  - ${col.name}`));
    }
    
    console.log('\n🎉 Database connection test successful!');
    
  } catch (error) {
    console.error('\n❌ Database connection failed:');
    console.error(`Error: ${error.message}`);
    
    if (error.message.includes('IP whitelist') || error.message.includes('not authorized')) {
      console.log('\n💡 Solution: Add 0.0.0.0/0 to MongoDB Atlas Network Access');
    } else if (error.message.includes('authentication failed')) {
      console.log('\n💡 Solution: Check your username and password in the connection string');
    } else if (error.message.includes('SSL') || error.message.includes('TLS')) {
      console.log('\n💡 Solution: Check your MongoDB Atlas SSL configuration');
    }
    
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Connection closed');
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n\n⏹️  Process interrupted');
  await mongoose.connection.close();
  process.exit(0);
});

// Run the test
testConnection().catch(console.error);