import mongoose, { Schema, Document } from 'mongoose';
import { InventoryItem as InventoryItemType } from '../../types';

// Extend the InventoryItem interface to include Mongoose Document methods
export interface InventoryItemDocument extends Omit<InventoryItemType, '_id'>, Document {
  updateStock(quantity: number, operation: 'add' | 'subtract'): Promise<InventoryItemDocument>;
  isLowStock(): boolean;
  calculateTotalValue(): number;
}

// Interface for static methods
export interface InventoryItemModel extends mongoose.Model<InventoryItemDocument> {
  findLowStockItems(): mongoose.Query<InventoryItemDocument[], InventoryItemDocument>;
  findByCategory(category: string): mongoose.Query<InventoryItemDocument[], InventoryItemDocument>;
  searchByName(searchTerm: string): mongoose.Query<InventoryItemDocument[], InventoryItemDocument>;
  getTotalInventoryValue(): Promise<{ totalValue: number; totalItems: number; totalStock: number }>;
  getInventorySummaryByCategory(): mongoose.Aggregate<any[]>;
  updateStockFromTransaction(
    itemName: string,
    quantity: number,
    unitPrice: number,
    transactionType: 'purchase' | 'sale',
    category?: string
  ): Promise<InventoryItemDocument>;
}

const InventoryItemSchema = new Schema<InventoryItemDocument>({
  itemName: {
    type: String,
    required: [true, 'Item name is required'],
    unique: true,
    trim: true,
    maxlength: [200, 'Item name cannot exceed 200 characters'],
    index: true // For faster searches
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    maxlength: [100, 'Category cannot exceed 100 characters'],
    index: true // For category-based filtering
  },
  currentStock: {
    type: Number,
    required: [true, 'Current stock is required'],
    min: [0, 'Current stock cannot be negative'],
    default: 0,
    validate: {
      validator: function(value: number) {
        return value >= 0;
      },
      message: 'Current stock must be a non-negative number'
    }
  },
  minStockLevel: {
    type: Number,
    required: [true, 'Minimum stock level is required'],
    min: [0, 'Minimum stock level cannot be negative'],
    default: 5,
    validate: {
      validator: function(value: number) {
        return value >= 0;
      },
      message: 'Minimum stock level must be a non-negative number'
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
  totalValue: {
    type: Number,
    required: [true, 'Total value is required'],
    min: [0, 'Total value cannot be negative'],
    default: 0
  },
  lastUpdated: {
    type: Date,
    required: [true, 'Last updated date is required'],
    default: Date.now
  }
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
  toJSON: {
    virtuals: true
  }
});

// Compound indexes for better query performance
InventoryItemSchema.index({ category: 1, itemName: 1 }); // For category-based item searches
InventoryItemSchema.index({ currentStock: 1, minStockLevel: 1 }); // For low stock queries
InventoryItemSchema.index({ lastUpdated: -1 }); // For recently updated items
InventoryItemSchema.index({ totalValue: -1 }); // For value-based sorting

// Pre-save middleware to calculate total value and update lastUpdated
InventoryItemSchema.pre('save', function(next) {
  // Calculate total value
  this.totalValue = this.calculateTotalValue();
  
  // Update lastUpdated timestamp if stock or price changed
  if (this.isModified('currentStock') || this.isModified('unitPrice')) {
    this.lastUpdated = new Date();
  }
  
  next();
});

// Instance method to update stock levels
InventoryItemSchema.methods.updateStock = async function(
  quantity: number, 
  operation: 'add' | 'subtract'
): Promise<InventoryItemDocument> {
  if (quantity < 0) {
    throw new Error('Quantity must be a positive number');
  }

  const oldStock = this.currentStock;
  
  if (operation === 'add') {
    this.currentStock += quantity;
  } else if (operation === 'subtract') {
    if (this.currentStock < quantity) {
      throw new Error(`Insufficient stock. Available: ${this.currentStock}, Requested: ${quantity}`);
    }
    this.currentStock -= quantity;
  } else {
    throw new Error('Operation must be either "add" or "subtract"');
  }

  // Update total value and last updated timestamp
  this.totalValue = this.calculateTotalValue();
  this.lastUpdated = new Date();

  try {
    await this.save();
    console.log(`Stock updated for ${this.itemName}: ${oldStock} → ${this.currentStock} (${operation} ${quantity})`);
    return this as InventoryItemDocument;
  } catch (error) {
    // Revert the stock change if save fails
    this.currentStock = oldStock;
    throw error;
  }
};

// Instance method to check if item is low on stock
InventoryItemSchema.methods.isLowStock = function(): boolean {
  return this.currentStock <= this.minStockLevel;
};

// Instance method to calculate total value
InventoryItemSchema.methods.calculateTotalValue = function(): number {
  const value = this.currentStock * this.unitPrice;
  return Math.round(value * 100) / 100; // Round to 2 decimal places
};

// Static method to find low stock items
InventoryItemSchema.statics.findLowStockItems = function() {
  return this.find({
    $expr: { $lte: ['$currentStock', '$minStockLevel'] }
  }).sort({ currentStock: 1 });
};

// Static method to find items by category
InventoryItemSchema.statics.findByCategory = function(category: string) {
  return this.find({
    category: { $regex: category, $options: 'i' }
  }).sort({ itemName: 1 });
};

// Static method to search items by name
InventoryItemSchema.statics.searchByName = function(searchTerm: string) {
  return this.find({
    itemName: { $regex: searchTerm, $options: 'i' }
  }).sort({ itemName: 1 });
};

// Static method to get total inventory value
InventoryItemSchema.statics.getTotalInventoryValue = async function() {
  const result = await this.aggregate([
    {
      $group: {
        _id: null,
        totalValue: { $sum: '$totalValue' },
        totalItems: { $sum: 1 },
        totalStock: { $sum: '$currentStock' }
      }
    }
  ]);
  
  return result[0] || { totalValue: 0, totalItems: 0, totalStock: 0 };
};

// Static method to get inventory summary by category
InventoryItemSchema.statics.getInventorySummaryByCategory = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$category',
        totalItems: { $sum: 1 },
        totalStock: { $sum: '$currentStock' },
        totalValue: { $sum: '$totalValue' },
        lowStockItems: {
          $sum: {
            $cond: [{ $lte: ['$currentStock', '$minStockLevel'] }, 1, 0]
          }
        }
      }
    },
    {
      $sort: { totalValue: -1 }
    }
  ]);
};

// Static method to update stock from transaction
InventoryItemSchema.statics.updateStockFromTransaction = async function(
  itemName: string,
  quantity: number,
  unitPrice: number,
  transactionType: 'purchase' | 'sale',
  category?: string
) {
  try {
    let item = await this.findOne({ itemName });
    
    // Create new inventory item if it doesn't exist (for purchases)
    if (!item && transactionType === 'purchase') {
      item = new this({
        itemName,
        category: category || 'General',
        currentStock: 0,
        minStockLevel: 5,
        unitPrice,
        totalValue: 0
      });
    }
    
    if (!item) {
      throw new Error(`Item "${itemName}" not found in inventory`);
    }
    
    // Update unit price if it's a purchase (assuming latest purchase price)
    if (transactionType === 'purchase') {
      item.unitPrice = unitPrice;
    }
    
    // Update stock based on transaction type
    const operation = transactionType === 'purchase' ? 'add' : 'subtract';
    await (item as InventoryItemDocument).updateStock(quantity, operation);
    
    return item;
  } catch (error) {
    console.error(`Error updating stock for ${itemName}:`, error);
    throw error;
  }
};

// Prevent multiple compilations in development
const InventoryItem = (mongoose.models.InventoryItem as InventoryItemModel) || 
  mongoose.model<InventoryItemDocument, InventoryItemModel>('InventoryItem', InventoryItemSchema);

export default InventoryItem;