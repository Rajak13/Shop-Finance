// Test file to verify database connection and models
// This file can be run to test the database setup
import connectToDatabase from './database';
import { User, Transaction, InventoryItem } from './models';

async function testDatabaseConnection() {
  try {
    console.log('Testing database connection...');
    await connectToDatabase();
    console.log('✅ Database connection successful');
    
    // Test User model
    console.log('\nTesting User model...');
    const testUser = new User({
      email: 'admin@gmail.com',
      password: 'shabnam123@',
      name: 'Admin User',
      role: 'admin'
    });
    
    // Validate without saving
    await testUser.validate();
    console.log('✅ User model validation successful');
    
    // Test Transaction model
    console.log('\nTesting Transaction model...');
    const testTransaction = new Transaction({
      type: 'purchase',
      date: new Date(),
      items: [{
        itemName: 'Test Kurti',
        quantity: 5,
        unitPrice: 100,
        totalPrice: 500,
        category: 'Kurtis'
      }],
      totalAmount: 500,
      supplier: {
        name: 'Test Supplier',
        contact: '9876543210'
      },
      notes: 'Test purchase transaction'
    });
    
    // Validate without saving
    await testTransaction.validate();
    console.log('✅ Transaction model validation successful');
    console.log('Generated Transaction ID:', testTransaction.transactionId);
    
    // Test InventoryItem model
    console.log('\nTesting InventoryItem model...');
    const testInventoryItem = new InventoryItem({
      itemName: 'Test Kurti',
      category: 'Kurtis',
      currentStock: 10,
      minStockLevel: 5,
      unitPrice: 100
    });
    
    // Validate without saving
    await testInventoryItem.validate();
    console.log('✅ InventoryItem model validation successful');
    console.log('Calculated Total Value:', testInventoryItem.totalValue);
    console.log('Is Low Stock:', testInventoryItem.isLowStock());
    
    console.log('\n🎉 All models and database connection tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Close the connection
    process.exit(0);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testDatabaseConnection();
}

export default testDatabaseConnection;