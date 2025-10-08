import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '../../../lib/database';
import InventoryItem from '../../../lib/models/InventoryItem';
import { APIResponse, PaginatedResponse, InventoryItem as InventoryItemType } from '../../../types';

// GET /api/inventory - Retrieve inventory items with filtering, pagination, and search
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const lowStock = searchParams.get('lowStock') === 'true';
    const sortBy = searchParams.get('sortBy') || 'itemName';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_PARAMETERS',
          message: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100.'
        }
      } as APIResponse, { status: 400 });
    }

    // Build query object
    const query: Record<string, unknown> = {};

    // Filter by category
    if (category) {
      query.category = { $regex: category, $options: 'i' };
    }

    // Filter by low stock
    if (lowStock) {
      query.$expr = { $lte: ['$currentStock', '$minStockLevel'] };
    }

    // Search functionality
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      query.$or = [
        { itemName: searchRegex },
        { category: searchRegex }
      ];
    }

    // Build sort object
    const sortObject: Record<string, 1 | -1> = {};
    const validSortFields = ['itemName', 'category', 'currentStock', 'unitPrice', 'totalValue', 'lastUpdated'];
    if (validSortFields.includes(sortBy)) {
      sortObject[sortBy] = sortOrder === 'asc' ? 1 : -1;
    } else {
      sortObject.itemName = 1; // Default sort
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Execute queries
    const [items, totalCount] = await Promise.all([
      InventoryItem.find(query)
        .sort(sortObject)
        .skip(skip)
        .limit(limit)
        .lean(),
      InventoryItem.countDocuments(query)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);

    const response: APIResponse<{ items: InventoryItemType[]; pagination: any }> = {
      success: true,
      data: {
        items: items as unknown as InventoryItemType[],
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages
        }
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching inventory:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch inventory items'
      }
    } as APIResponse, { status: 500 });
  }
}

// POST /api/inventory - Create a new inventory item
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    
    // Validate required fields
    const { itemName, category, currentStock, minStockLevel, unitPrice } = body;
    
    if (!itemName || itemName.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Item name is required'
        }
      } as APIResponse, { status: 400 });
    }

    if (!category || category.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Category is required'
        }
      } as APIResponse, { status: 400 });
    }

    if (typeof currentStock !== 'number' || currentStock < 0) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Current stock must be a non-negative number'
        }
      } as APIResponse, { status: 400 });
    }

    if (typeof minStockLevel !== 'number' || minStockLevel < 0) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Minimum stock level must be a non-negative number'
        }
      } as APIResponse, { status: 400 });
    }

    if (typeof unitPrice !== 'number' || unitPrice < 0) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Unit price must be a non-negative number'
        }
      } as APIResponse, { status: 400 });
    }

    // Create new inventory item
    const inventoryItem = new InventoryItem({
      itemName: itemName.trim(),
      category: category.trim(),
      currentStock,
      minStockLevel,
      unitPrice
    });

    // Save inventory item
    const savedItem = await inventoryItem.save();

    const response: APIResponse<InventoryItemType> = {
      success: true,
      data: savedItem.toJSON() as InventoryItemType
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('Error creating inventory item:', error);
    
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
        message: 'Failed to create inventory item'
      }
    } as APIResponse, { status: 500 });
  }
}