import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/database';
import InventoryItem from '../../../../lib/models/InventoryItem';
import { APIResponse, InventoryItem as InventoryItemType } from '../../../../types';

// GET /api/inventory/low-stock - Get items with low stock levels
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const threshold = parseInt(searchParams.get('threshold') || '0');

    // Build query for low stock items
    let query: Record<string, unknown>;
    
    if (threshold > 0) {
      // Use custom threshold
      query = { currentStock: { $lte: threshold } };
    } else {
      // Use each item's individual minStockLevel
      query = { $expr: { $lte: ['$currentStock', '$minStockLevel'] } };
    }

    // Get low stock items sorted by stock level (lowest first)
    const lowStockItems = await InventoryItem.find(query)
      .sort({ currentStock: 1, itemName: 1 })
      .lean();

    // Calculate additional metrics
    const totalLowStockItems = lowStockItems.length;
    const criticalItems = lowStockItems.filter((item: any) => item.currentStock === 0);
    const totalCriticalItems = criticalItems.length;

    const response: APIResponse<{
      items: InventoryItemType[];
      summary: {
        totalLowStockItems: number;
        totalCriticalItems: number;
        threshold: number;
      };
    }> = {
      success: true,
      data: {
        items: lowStockItems as unknown as InventoryItemType[],
        summary: {
          totalLowStockItems,
          totalCriticalItems,
          threshold: threshold || 0
        }
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching low stock items:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch low stock items'
      }
    } as APIResponse, { status: 500 });
  }
}