import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/database';
import InventoryItem from '../../../../lib/models/InventoryItem';
import { APIResponse } from '../../../../types';

// GET /api/inventory/summary - Get inventory summary statistics
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    // Get overall statistics
    const [
      totalItems,
      totalValue,
      totalStock,
      lowStockItems,
      outOfStockItems,
      categoryBreakdown,
      topValueItems,
      recentlyUpdated
    ] = await Promise.all([
      // Total items count
      InventoryItem.countDocuments(),
      
      // Total inventory value
      InventoryItem.aggregate([
        { $group: { _id: null, totalValue: { $sum: '$totalValue' } } }
      ]),
      
      // Total stock
      InventoryItem.aggregate([
        { $group: { _id: null, totalStock: { $sum: '$currentStock' } } }
      ]),
      
      // Low stock items count
      InventoryItem.countDocuments({
        $expr: { $lte: ['$currentStock', '$minStockLevel'] }
      }),
      
      // Out of stock items count
      InventoryItem.countDocuments({ currentStock: 0 }),
      
      // Category breakdown
      InventoryItem.aggregate([
        {
          $group: {
            _id: '$category',
            totalItems: { $sum: 1 },
            totalStock: { $sum: '$currentStock' },
            totalValue: { $sum: '$totalValue' },
            lowStockItems: {
              $sum: {
                $cond: [
                  { $lte: ['$currentStock', '$minStockLevel'] },
                  1,
                  0
                ]
              }
            }
          }
        },
        { $sort: { totalValue: -1 } }
      ]),
      
      // Top value items
      InventoryItem.find()
        .sort({ totalValue: -1 })
        .limit(10)
        .select('itemName category currentStock unitPrice totalValue')
        .lean(),
      
      // Recently updated items
      InventoryItem.find()
        .sort({ lastUpdated: -1 })
        .limit(10)
        .select('itemName category currentStock lastUpdated')
        .lean()
    ]);

    const summary = {
      overall: {
        totalValue: totalValue[0]?.totalValue || 0,
        totalItems,
        totalStock: totalStock[0]?.totalStock || 0,
        lowStockItems,
        outOfStockItems
      },
      categories: categoryBreakdown,
      topValueItems,
      recentlyUpdated
    };

    const response: APIResponse<typeof summary> = {
      success: true,
      data: summary
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching inventory summary:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch inventory summary'
      }
    } as APIResponse, { status: 500 });
  }
}