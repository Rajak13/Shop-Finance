import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '../../../lib/database';
import Transaction from '../../../lib/models/Transaction';
import InventoryItem from '../../../lib/models/InventoryItem';
import { fallbackTransactionOps, fallbackInventoryOps, shouldUseFallback } from '../../../lib/fallback-data';
import { APIResponse, PaginatedResponse, Transaction as TransactionType } from '../../../types';

// GET /api/transactions - Retrieve transactions with filtering, pagination, and search
export async function GET(request: NextRequest) {
  try {

    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const type = searchParams.get('type') as 'purchase' | 'sale' | null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const sortBy = searchParams.get('sortBy') || 'date';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

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

    // Filter by transaction type
    if (type && ['purchase', 'sale'].includes(type)) {
      query.type = type;
    }

    // Filter by date range
    if (startDate || endDate) {
      const dateQuery: Record<string, Date> = {};
      if (startDate) {
        const start = new Date(startDate);
        if (isNaN(start.getTime())) {
          return NextResponse.json({
            success: false,
            error: {
              code: 'INVALID_DATE',
              message: 'Invalid start date format'
            }
          } as APIResponse, { status: 400 });
        }
        dateQuery.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        if (isNaN(end.getTime())) {
          return NextResponse.json({
            success: false,
            error: {
              code: 'INVALID_DATE',
              message: 'Invalid end date format'
            }
          } as APIResponse, { status: 400 });
        }
        // Set end date to end of day
        end.setHours(23, 59, 59, 999);
        dateQuery.$lte = end;
      }
      query.date = dateQuery;
    }

    // Search functionality
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      query.$or = [
        { transactionId: searchRegex },
        { 'items.itemName': searchRegex },
        { 'supplier.name': searchRegex },
        { 'customer.name': searchRegex },
        { notes: searchRegex }
      ];
    }

    // Build sort object
    const sortObject: Record<string, 1 | -1> = {};
    const validSortFields = ['date', 'totalAmount', 'createdAt', 'transactionId'];
    if (validSortFields.includes(sortBy)) {
      sortObject[sortBy] = sortOrder === 'asc' ? 1 : -1;
    } else {
      sortObject.date = -1; // Default sort
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    let transactions: TransactionType[];
    let totalCount: number;

    // Try database connection, fallback to in-memory data if needed
    if (shouldUseFallback()) {
      console.log('Using fallback data for transactions');
      
      // Convert query to fallback format
      const fallbackFilter: any = {};
      if (query.type) fallbackFilter.type = query.type;
      
      const fallbackOptions: any = {
        sort: sortObject,
        skip,
        limit
      };
      
      transactions = fallbackTransactionOps.find(fallbackFilter, fallbackOptions) as any;
      totalCount = fallbackTransactionOps.count(fallbackFilter);
    } else {
      try {
        await connectToDatabase();
        
        // Execute queries
        const [dbTransactions, dbTotalCount] = await Promise.all([
          Transaction.find(query)
            .sort(sortObject)
            .skip(skip)
            .limit(limit)
            .lean(),
          Transaction.countDocuments(query)
        ]);
        
        transactions = dbTransactions as unknown as TransactionType[];
        totalCount = dbTotalCount;
      } catch (dbError) {
        console.error('Database connection failed, using fallback:', dbError);
        
        const fallbackFilter: any = {};
        if (query.type) fallbackFilter.type = query.type;
        
        const fallbackOptions: any = {
          sort: sortObject,
          skip,
          limit
        };
        
        transactions = fallbackTransactionOps.find(fallbackFilter, fallbackOptions) as any;
        totalCount = fallbackTransactionOps.count(fallbackFilter);
      }
    }

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);

    const response: APIResponse<{ transactions: TransactionType[]; pagination: any }> = {
      success: true,
      data: {
        transactions,
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
    console.error('Error fetching transactions:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch transactions'
      }
    } as APIResponse, { status: 500 });
  }
}

// POST /api/transactions - Create a new transaction
export async function POST(request: NextRequest) {
  try {

    const body = await request.json();
    
    // Validate required fields
    const { type, date, items, totalAmount } = body;
    
    if (!type || !['purchase', 'sale'].includes(type)) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Transaction type must be either "purchase" or "sale"'
        }
      } as APIResponse, { status: 400 });
    }

    if (!date) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Transaction date is required'
        }
      } as APIResponse, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'At least one item is required'
        }
      } as APIResponse, { status: 400 });
    }

    if (typeof totalAmount !== 'number' || totalAmount < 0) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Total amount must be a non-negative number'
        }
      } as APIResponse, { status: 400 });
    }

    // Validate supplier for purchase transactions
    if (type === 'purchase') {
      if (!body.supplier || !body.supplier.name || body.supplier.name.trim().length === 0) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Supplier information is required for purchase transactions'
          }
        } as APIResponse, { status: 400 });
      }
    }

    // Validate items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
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

    let savedTransaction: TransactionType;

    // Try database connection, fallback to in-memory data if needed
    if (shouldUseFallback()) {
      console.log('Using fallback data for transaction creation');
      
      const transactionData = {
        type,
        date: new Date(date),
        items,
        totalAmount,
        notes: body.notes?.trim() || undefined,
        supplier: type === 'purchase' ? body.supplier : undefined,
        customer: type === 'sale' ? body.customer : undefined
      };
      
      savedTransaction = fallbackTransactionOps.create(transactionData) as any;
      
      // Update inventory for each item
      items.forEach((item: any) => {
        const quantityChange = type === 'purchase' ? item.quantity : -item.quantity;
        fallbackInventoryOps.updateStock(item.itemName, quantityChange, item.unitPrice);
      });
    } else {
      try {
        await connectToDatabase();
        
        // Generate transaction ID
        const generateTransactionId = (type: string): string => {
          const prefix = type === 'purchase' ? 'PUR' : 'SAL';
          const date = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
          const random = Math.random().toString(36).substr(2, 6).toUpperCase();
          return `${prefix}-${date}-${random}`;
        };

        // Create new transaction
        const transaction = new Transaction({
          type,
          transactionId: generateTransactionId(type),
          date: new Date(date),
          items,
          totalAmount,
          notes: body.notes?.trim() || undefined,
          supplier: type === 'purchase' ? body.supplier : undefined,
          customer: type === 'sale' ? body.customer : undefined
        });

        // Save transaction (pre-save middleware will handle ID generation and validation)
        const dbTransaction = await transaction.save();
        savedTransaction = dbTransaction.toJSON() as TransactionType;

        // Update inventory for each item in the transaction
        const inventoryUpdatePromises = items.map(async (item: any) => {
          try {
            await InventoryItem.updateStockFromTransaction(
              item.itemName,
              item.quantity,
              item.unitPrice,
              type,
              item.category
            );
          } catch (error) {
            console.error(`Failed to update inventory for item ${item.itemName}:`, error);
          }
        });

        // Wait for all inventory updates to complete
        await Promise.allSettled(inventoryUpdatePromises);
      } catch (dbError) {
        console.error('Database connection failed, using fallback:', dbError);
        
        const transactionData = {
          type,
          date: new Date(date),
          items,
          totalAmount,
          notes: body.notes?.trim() || undefined,
          supplier: type === 'purchase' ? body.supplier : undefined,
          customer: type === 'sale' ? body.customer : undefined
        };
        
        savedTransaction = fallbackTransactionOps.create(transactionData) as any;
        
        // Update inventory for each item
        items.forEach((item: any) => {
          const quantityChange = type === 'purchase' ? item.quantity : -item.quantity;
          fallbackInventoryOps.updateStock(item.itemName, quantityChange, item.unitPrice);
        });
      }
    }

    const response: APIResponse<TransactionType> = {
      success: true,
      data: savedTransaction
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('Error creating transaction:', error);
    
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
        message: 'Failed to create transaction'
      }
    } as APIResponse, { status: 500 });
  }
}