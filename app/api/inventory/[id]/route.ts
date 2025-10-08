import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/database';
import InventoryItem from '../../../../lib/models/InventoryItem';
import { APIResponse, InventoryItem as InventoryItemType } from '../../../../types';

// GET /api/inventory/[id] - Get a specific inventory item
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();

    const { id } = params;

    if (!id) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_PARAMETERS',
          message: 'Item ID is required'
        }
      } as APIResponse, { status: 400 });
    }

    const item = await InventoryItem.findById(id).lean();

    if (!item) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Inventory item not found'
        }
      } as APIResponse, { status: 404 });
    }

    const response: APIResponse<InventoryItemType> = {
      success: true,
      data: item as unknown as InventoryItemType
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching inventory item:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch inventory item'
      }
    } as APIResponse, { status: 500 });
  }
}

// PUT /api/inventory/[id] - Update a specific inventory item
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();

    const { id } = params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_PARAMETERS',
          message: 'Item ID is required'
        }
      } as APIResponse, { status: 400 });
    }

    // Find the existing item
    const existingItem = await InventoryItem.findById(id);

    if (!existingItem) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Inventory item not found'
        }
      } as APIResponse, { status: 404 });
    }

    // Validate and update fields
    const allowedUpdates = ['itemName', 'category', 'currentStock', 'minStockLevel', 'unitPrice'];
    const updates: Record<string, any> = {};

    for (const field of allowedUpdates) {
      if (body[field] !== undefined) {
        if (field === 'itemName' || field === 'category') {
          if (typeof body[field] !== 'string' || body[field].trim().length === 0) {
            return NextResponse.json({
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: `${field} must be a non-empty string`
              }
            } as APIResponse, { status: 400 });
          }
          updates[field] = body[field].trim();
        } else {
          if (typeof body[field] !== 'number' || body[field] < 0) {
            return NextResponse.json({
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: `${field} must be a non-negative number`
              }
            } as APIResponse, { status: 400 });
          }
          updates[field] = body[field];
        }
      }
    }

    // Update the item
    Object.assign(existingItem, updates);
    const updatedItem = await existingItem.save();

    const response: APIResponse<InventoryItemType> = {
      success: true,
      data: updatedItem.toJSON() as InventoryItemType
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error updating inventory item:', error);
    
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
          message: 'Item with this name already exists'
        }
      } as APIResponse, { status: 409 });
    }

    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update inventory item'
      }
    } as APIResponse, { status: 500 });
  }
}

// DELETE /api/inventory/[id] - Delete a specific inventory item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();

    const { id } = params;

    if (!id) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_PARAMETERS',
          message: 'Item ID is required'
        }
      } as APIResponse, { status: 400 });
    }

    const deletedItem = await InventoryItem.findByIdAndDelete(id);

    if (!deletedItem) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Inventory item not found'
        }
      } as APIResponse, { status: 404 });
    }

    const response: APIResponse<{ message: string }> = {
      success: true,
      data: { message: 'Inventory item deleted successfully' }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error deleting inventory item:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete inventory item'
      }
    } as APIResponse, { status: 500 });
  }
}