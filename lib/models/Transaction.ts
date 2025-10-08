import mongoose, { Schema, Document } from 'mongoose';
import { Transaction as TransactionType, TransactionItem } from '../../types';

// Extend the Transaction interface to include Mongoose Document methods
export interface TransactionDocument extends Omit<TransactionType, '_id'>, Document {
  generateTransactionId(): string;
}

// Schema for transaction items
const TransactionItemSchema = new Schema<TransactionItem>({
  itemName: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
    maxlength: [200, 'Item name cannot exceed 200 characters']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0.01, 'Quantity must be greater than 0'],
    validate: {
      validator: function(value: number) {
        return value > 0;
      },
      message: 'Quantity must be a positive number'
    }
  },
  unitPrice: {
    type: Number,
    required: [true, 'Unit price is required'],
    min: [0, 'Unit price cannot be negative'],
    validate: {
      validator: function(value: number) {
        return value >= 0;
      },
      message: 'Unit price must be a non-negative number'
    }
  },
  totalPrice: {
    type: Number,
    required: [true, 'Total price is required'],
    min: [0, 'Total price cannot be negative']
  },
  category: {
    type: String,
    trim: true,
    maxlength: [100, 'Category cannot exceed 100 characters']
  }
}, { _id: false }); // Don't create _id for subdocuments

// Schema for supplier information
const SupplierSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Supplier name is required'],
    trim: true,
    maxlength: [200, 'Supplier name cannot exceed 200 characters']
  },
  contact: {
    type: String,
    trim: true,
    maxlength: [50, 'Contact cannot exceed 50 characters']
  }
}, { _id: false });

// Schema for customer information
const CustomerSchema = new Schema({
  name: {
    type: String,
    trim: true,
    maxlength: [200, 'Customer name cannot exceed 200 characters']
  },
  contact: {
    type: String,
    trim: true,
    maxlength: [50, 'Contact cannot exceed 50 characters']
  }
}, { _id: false });

const TransactionSchema = new Schema<TransactionDocument>({
  type: {
    type: String,
    enum: {
      values: ['purchase', 'sale'],
      message: 'Transaction type must be either purchase or sale'
    },
    required: [true, 'Transaction type is required']
  },
  transactionId: {
    type: String,
    unique: true,
    required: [true, 'Transaction ID is required']
  },
  date: {
    type: Date,
    required: [true, 'Transaction date is required'],
    validate: {
      validator: function(value: Date) {
        // Don't allow future dates beyond tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return value <= tomorrow;
      },
      message: 'Transaction date cannot be in the future'
    }
  },
  items: {
    type: [TransactionItemSchema],
    required: [true, 'At least one item is required'],
    validate: {
      validator: function(items: TransactionItem[]) {
        return items && items.length > 0;
      },
      message: 'Transaction must have at least one item'
    }
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative'],
    validate: {
      validator: function(value: number) {
        // Validate that total amount matches sum of item totals
        if (this.items && this.items.length > 0) {
          const calculatedTotal = this.items.reduce((sum: number, item: TransactionItem) => {
            return sum + item.totalPrice;
          }, 0);
          // Allow small floating point differences
          return Math.abs(value - calculatedTotal) < 0.01;
        }
        return value >= 0;
      },
      message: 'Total amount must match the sum of item totals'
    }
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  supplier: {
    type: SupplierSchema,
    required: function(this: TransactionDocument) {
      return this.type === 'purchase';
    },
    validate: {
      validator: function(this: TransactionDocument, value: unknown) {
        // Supplier is required for purchase transactions
        if (this.type === 'purchase') {
          const supplier = value as { name?: string };
          return supplier && supplier.name && supplier.name.trim().length > 0;
        }
        return true;
      },
      message: 'Supplier information is required for purchase transactions'
    }
  },
  customer: {
    type: CustomerSchema,
    required: false // Customer is optional for sales
  }
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
  toJSON: {
    transform: function(doc, ret) {
      // Format dates for JSON output - dates are already properly formatted by Mongoose
      return ret;
    }
  }
});

// Indexes for better query performance
TransactionSchema.index({ type: 1, date: -1 }); // For filtering by type and sorting by date
// transactionId index is automatically created by unique: true constraint
TransactionSchema.index({ date: -1 }); // For date-based queries
TransactionSchema.index({ 'items.itemName': 1 }); // For item-based searches
TransactionSchema.index({ 'supplier.name': 1 }); // For supplier-based searches
TransactionSchema.index({ createdAt: -1 }); // For recent transactions

// Pre-save middleware to generate transaction ID and validate item totals
TransactionSchema.pre('save', function(next) {
  // Generate transaction ID if not provided
  if (!this.transactionId) {
    this.transactionId = this.generateTransactionId();
  }

  // Calculate and validate item total prices
  if (this.items && this.items.length > 0) {
    this.items.forEach((item: TransactionItem) => {
      const calculatedTotal = item.quantity * item.unitPrice;
      // Allow small floating point differences
      if (Math.abs(item.totalPrice - calculatedTotal) > 0.01) {
        item.totalPrice = Math.round(calculatedTotal * 100) / 100; // Round to 2 decimal places
      }
    });

    // Recalculate total amount
    const calculatedTotal = this.items.reduce((sum: number, item: TransactionItem) => {
      return sum + item.totalPrice;
    }, 0);
    this.totalAmount = Math.round(calculatedTotal * 100) / 100;
  }

  next();
});

// Instance method to generate unique transaction ID
TransactionSchema.methods.generateTransactionId = function(): string {
  const prefix = this.type === 'purchase' ? 'PUR' : 'SAL';
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `${prefix}-${date}-${random}`;
};

// Static method to find transactions by date range
TransactionSchema.statics.findByDateRange = function(startDate: Date, endDate: Date, type?: 'purchase' | 'sale') {
  const query: Record<string, unknown> = {
    date: {
      $gte: startDate,
      $lte: endDate
    }
  };
  
  if (type) {
    query.type = type;
  }
  
  return this.find(query).sort({ date: -1 });
};

// Static method to find transactions by item name
TransactionSchema.statics.findByItemName = function(itemName: string) {
  return this.find({
    'items.itemName': { $regex: itemName, $options: 'i' }
  }).sort({ date: -1 });
};

// Prevent multiple compilations in development
const Transaction = mongoose.models.Transaction || mongoose.model<TransactionDocument>('Transaction', TransactionSchema);

export default Transaction;