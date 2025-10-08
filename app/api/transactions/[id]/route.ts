import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/database';
import Transaction from '../../../../lib/models/Transaction';
import InventoryItem from '../../../../lib/models/InventoryItem';
import { APIResponse, Transaction as TransactionType } from '../../../../types';
import mongoose from 'mongoose';

// GET /api/transactions/[id] - Get a specific transaction
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();

    const { id } = params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid transaction ID format'
        }
      } as APIResponse, { status: 400 });
    }

    // Find transaction by ID
    const transaction = await Transaction.findById(id).lean();

    if (!transaction) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Transaction not found'
        }
      } as APIResponse, { status: 404 });
    }

    const response: APIResponse<TransactionType> = {
      success: true,
      data: transaction as unknown as TransactionType
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching transaction:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch transaction'
      }
    } as APIResponse, { status: 500 });
  }
}

// PUT /api/transactions/[id] - Update a specific transaction
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();

    const { id } = params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid transaction ID format'
        }
      } as APIResponse, { status: 400 });
    }

    const body = await request.json();
    
    // Find existing transaction
    const existingTransaction = await Transaction.findById(id);
    
    if (!existingTransaction) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Transaction not found'
        }
      } as APIResponse, { status: 404 });
    }

    // Validate updated fields if provided
    if (body.type && !['purchase', 'sale'].includes(body.type)) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Transaction type must be either "purchase" or "sale"'
        }
      } as APIResponse, { status: 400 });
    }

    if (body.date && isNaN(new Date(body.date).getTime())) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid date format'
        }
      } as APIResponse, { status: 400 });
    }

    if (body.items) {
      if (!Array.isArray(body.items) || body.items.length === 0) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'At least one item is required'
          }
        } as APIResponse, { status: 400 });
      }

      // Validate items
      for (let i = 0; i < body.items.length; i++) {
        const item = body.items[i];
        if (!item.itemName || item.itemName.trim().length === 0) {
          return NextResponse.json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: `Item ${i + 1}: Item name is required`
            }
          } as APIResponse, { status: 400 });
        }
        
        if (typeof item.quantity !== 'number' || item.quantity <= 0) {
          return NextResponse.json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: `Item ${i + 1}: Quantity must be a positive number`
            }
          } as APIResponse, { status: 400 });
        }
        
        if (typeof item.unitPrice !== 'number' || item.unitPrice < 0) {
          return NextResponse.json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: `Item ${i + 1}: Unit price must be a non-negative number`
            }
          } as APIResponse, { status: 400 });
        }
      }
    }

    if (body.totalAmount !== undefined && (typeof body.totalAmount !== 'number' || body.totalAmount < 0)) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Total amount must be a non-negative number'
        }
      } as APIResponse, { status: 400 });
    }

    // Check if transaction type is changing and validate supplier/customer requirements
    const newType = body.type || existingTransaction.type;
    if (newType === 'purchase') {
      const supplier = body.supplier || existingTransaction.supplier;
      if (!supplier || !supplier.name || supplier.name.trim().length === 0) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Supplier information is required for purchase transactions'
          }
        } as APIResponse, { status: 400 });
      }
    }

    // Prepare update object
    const updateData: Record<string, unknown> = {};
    
    // Only update provided fields
    if (body.type !== undefined) updateData.type = body.type;
    if (body.date !== undefined) updateData.date = new Date(body.date);
    if (body.items !== undefined) updateData.items = body.items;
    if (body.totalAmount !== undefined) updateData.totalAmount = body.totalAmount;
    if (body.notes !== undefined) updateData.notes = body.notes?.trim() || undefined;
    if (body.supplier !== undefined) updateData.supplier = body.supplier;
    if (body.customer !== undefined) updateData.customer = body.customer;

    // Handle inventory updates if items are being changed
    if (body.items) {
      // First, reverse the inventory changes from the original transaction
      const reverseInventoryPromises = existingTransaction.items.map(async (item: any) => {
        try {
          // Reverse the operation: if it was a purchase, subtract; if sale, add back
          const reverseOperation = existingTransaction.type === 'purchase' ? 'subtract' : 'add';
          await InventoryItem.updateStockFromTransaction(
            item.itemName,
            item.quantity,
            item.unitPrice,
            reverseOperation === 'subtract' ? 'sale' : 'purchase',
            item.category
          );
        } catch (error) {
          console.error(`Failed to reverse inventory for item ${item.itemName}:`, error);
        }
      });

      await Promise.allSettled(reverseInventoryPromises);

      // Then apply the new inventory changes
      const newInventoryPromises = body.items.map(async (item: any) => {
        try {
          await InventoryItem.updateStockFromTransaction(
            item.itemName,
            item.quantity,
            item.unitPrice,
            newType,
            item.category
          );
        } catch (error) {
          console.error(`Failed to update inventory for item ${item.itemName}:`, error);
        }
      });

      await Promise.allSettled(newInventoryPromises);
    }

    // Update transaction
    const updatedTransaction = await Transaction.findByIdAndUpdate(
      id,
      updateData,
      { 
        new: true, // Return updated document
        runValidators: true // Run schema validators
      }
    );

    if (!updatedTransaction) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Transaction not found'
        }
      } as APIResponse, { status: 404 });
    }

    const response: APIResponse<TransactionType> = {
      success: true,
      data: updatedTransaction.toJSON() as TransactionType
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error updating transaction:', error);
    
    // Handle validation errors
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message
        }
      } as APIResponse, { status: 400 });
    }

    // Handle duplicate key errors
    if (error instanceof Error && 'code' in error && error.code === 11000) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'DUPLICATE_ERROR',
          message: 'Transaction ID already exists'
        }
      } as APIResponse, { status: 409 });
    }

    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update transaction'
      }
    } as APIResponse, { status: 500 });
  }
}

// DELETE /api/transactions/[id] - Delete a specific transaction
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();

    const { id } = params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid transaction ID format'
        }
      } as APIResponse, { status: 400 });
    }

    // Find the transaction first to get its details for inventory reversal
    const transactionToDelete = await Transaction.findById(id);

    if (!transactionToDelete) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Transaction not found'
        }
      } as APIResponse, { status: 404 });
    }

    // Reverse inventory changes before deleting the transaction
    const reverseInventoryPromises = transactionToDelete.items.map(async (item: any) => {
      try {
        // Reverse the operation: if it was a purchase, subtract; if sale, add back
        const reverseOperation = transactionToDelete.type === 'purchase' ? 'subtract' : 'add';
        await InventoryItem.updateStockFromTransaction(
          item.itemName,
          item.quantity,
          item.unitPrice,
          reverseOperation === 'subtract' ? 'sale' : 'purchase',
          item.category
        );
      } catch (error) {
        console.error(`Failed to reverse inventory for item ${item.itemName}:`, error);
        // Log the error but don't fail the deletion
      }
    });

    await Promise.allSettled(reverseInventoryPromises);

    // Now delete the transaction
    const deletedTransaction = await Transaction.findByIdAndDelete(id);

    if (!deletedTransaction) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Transaction not found'
        }
      } as APIResponse, { status: 404 });
    }

    const response: APIResponse<{ id: string }> = {
      success: true,
      data: { id: deletedTransaction._id.toString() }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error deleting transaction:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete transaction'
      }
    } as APIResponse, { status: 500 });
  }
}