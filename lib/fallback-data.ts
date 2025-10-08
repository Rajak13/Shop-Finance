// Fallback in-memory data store for development when database is not available

interface User {
  _id: string;
  email: string;
  password: string;
  name: string;
  role: string;
}

interface Transaction {
  _id: string;
  type: 'purchase' | 'sale';
  transactionId: string;
  date: Date;
  items: Array<{
    itemName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    category?: string;
  }>;
  totalAmount: number;
  notes?: string;
  supplier?: {
    name: string;
    contact?: string;
  };
  customer?: {
    name?: string;
    contact?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface InventoryItem {
  _id: string;
  itemName: string;
  category: string;
  currentStock: number;
  minStockLevel: number;
  unitPrice: number;
  totalValue: number;
  lastUpdated: Date;
  createdAt: Date;
}

// In-memory data stores
let users: User[] = [
  {
    _id: '1',
    email: 'admin@gmail.com',
    password: '$2b$10$rQZ9QmjlQ8ZvQ8ZvQ8ZvQeJ8ZvQ8ZvQ8ZvQ8ZvQ8ZvQ8ZvQ8ZvQ8Z', // shabnam123@
    name: 'Admin User',
    role: 'admin'
  }
];

let transactions: Transaction[] = [];
let inventory: InventoryItem[] = [];
let transactionCounter = 1;

// Helper functions
function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

function generateTransactionId(): string {
  return `TXN-${Date.now()}-${transactionCounter++}`;
}

// User operations
export const fallbackUserOps = {
  findByEmail: (email: string): User | undefined => {
    return users.find(user => user.email === email);
  },
  
  findById: (id: string): User | undefined => {
    return users.find(user => user._id === id);
  },
  
  create: (userData: Omit<User, '_id'>): User => {
    const user: User = {
      _id: generateId(),
      ...userData
    };
    users.push(user);
    return user;
  }
};

// Transaction operations
export const fallbackTransactionOps = {
  find: (filter: any = {}, options: any = {}): Transaction[] => {
    let result = [...transactions];
    
    // Apply filters
    if (filter.type) {
      result = result.filter(t => t.type === filter.type);
    }
    
    // Apply sorting
    if (options.sort) {
      result.sort((a, b) => {
        if (options.sort.date === -1) {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });
    }
    
    // Apply pagination
    if (options.skip && options.limit) {
      result = result.slice(options.skip, options.skip + options.limit);
    } else if (options.limit) {
      result = result.slice(0, options.limit);
    }
    
    return result;
  },
  
  findById: (id: string): Transaction | undefined => {
    return transactions.find(t => t._id === id);
  },
  
  create: (transactionData: Omit<Transaction, '_id' | 'transactionId' | 'createdAt' | 'updatedAt'>): Transaction => {
    const transaction: Transaction = {
      _id: generateId(),
      transactionId: generateTransactionId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...transactionData
    };
    transactions.push(transaction);
    
    // Update inventory
    updateInventoryFromTransaction(transaction);
    
    return transaction;
  },
  
  updateById: (id: string, updateData: Partial<Transaction>): Transaction | null => {
    const index = transactions.findIndex(t => t._id === id);
    if (index === -1) return null;
    
    transactions[index] = {
      ...transactions[index],
      ...updateData,
      updatedAt: new Date()
    };
    
    return transactions[index];
  },
  
  deleteById: (id: string): boolean => {
    const index = transactions.findIndex(t => t._id === id);
    if (index === -1) return false;
    
    transactions.splice(index, 1);
    return true;
  },
  
  count: (filter: any = {}): number => {
    let result = transactions;
    
    if (filter.type) {
      result = result.filter(t => t.type === filter.type);
    }
    
    return result.length;
  }
};

// Inventory operations
export const fallbackInventoryOps = {
  find: (): InventoryItem[] => {
    return [...inventory];
  },
  
  findByName: (itemName: string): InventoryItem | undefined => {
    return inventory.find(item => item.itemName.toLowerCase() === itemName.toLowerCase());
  },
  
  create: (itemData: Omit<InventoryItem, '_id' | 'createdAt' | 'lastUpdated'>): InventoryItem => {
    const item: InventoryItem = {
      _id: generateId(),
      createdAt: new Date(),
      lastUpdated: new Date(),
      ...itemData
    };
    inventory.push(item);
    return item;
  },
  
  updateStock: (itemName: string, quantityChange: number, unitPrice: number): void => {
    let item = inventory.find(i => i.itemName.toLowerCase() === itemName.toLowerCase());
    
    if (!item) {
      // Create new inventory item
      item = {
        _id: generateId(),
        itemName,
        category: 'General',
        currentStock: Math.max(0, quantityChange),
        minStockLevel: 5,
        unitPrice,
        totalValue: Math.max(0, quantityChange) * unitPrice,
        lastUpdated: new Date(),
        createdAt: new Date()
      };
      inventory.push(item);
    } else {
      // Update existing item
      item.currentStock = Math.max(0, item.currentStock + quantityChange);
      item.unitPrice = unitPrice;
      item.totalValue = item.currentStock * unitPrice;
      item.lastUpdated = new Date();
    }
  }
};

// Helper function to update inventory from transactions
function updateInventoryFromTransaction(transaction: Transaction): void {
  transaction.items.forEach(item => {
    const quantityChange = transaction.type === 'purchase' ? item.quantity : -item.quantity;
    fallbackInventoryOps.updateStock(item.itemName, quantityChange, item.unitPrice);
  });
}

// Analytics operations
export const fallbackAnalyticsOps = {
  getOverview: () => {
    const totalSales = transactions
      .filter(t => t.type === 'sale')
      .reduce((sum, t) => sum + t.totalAmount, 0);
    
    const totalPurchases = transactions
      .filter(t => t.type === 'purchase')
      .reduce((sum, t) => sum + t.totalAmount, 0);
    
    const profit = totalSales - totalPurchases;
    const transactionCount = transactions.length;
    
    return {
      totalSales,
      totalPurchases,
      profit,
      transactionCount
    };
  },
  
  getSalesTrends: (period: string = 'daily') => {
    // Simple implementation - return last 7 days of sales
    const salesData = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      
      const dayTransactions = transactions.filter(t => 
        t.type === 'sale' && 
        new Date(t.date) >= dayStart && 
        new Date(t.date) <= dayEnd
      );
      
      const totalSales = dayTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
      
      salesData.push({
        date: date.toISOString().split('T')[0],
        sales: totalSales,
        transactions: dayTransactions.length
      });
    }
    
    return salesData;
  }
};

// Global fallback state
let useFallback = false;

// Check if we should use fallback data
export function shouldUseFallback(): boolean {
  // Use fallback if explicitly set or if MongoDB URI is not available
  return useFallback || !process.env.MONGODB_URI;
}

// Force fallback mode (useful when database connection fails)
export function enableFallback(): void {
  useFallback = true;
  console.log('Fallback mode enabled');
}

// Disable fallback mode
export function disableFallback(): void {
  useFallback = false;
  console.log('Fallback mode disabled');
}

// Reset fallback state
export function resetFallback(): void {
  useFallback = false;
}