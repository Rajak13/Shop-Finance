// Export all models for easier imports
export { default as User } from './User';
export { default as Transaction } from './Transaction';
export { default as InventoryItem } from './InventoryItem';

// Export types
export type { UserDocument } from './User';
export type { TransactionDocument } from './Transaction';
export type { InventoryItemDocument } from './InventoryItem';

// Re-export database connection utility
export { default as connectToDatabase } from '../database';