import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/database';
import Transaction from '../../../../lib/models/Transaction';
import InventoryItem from '../../../../lib/models/InventoryItem';
import { APIResponse, InventoryInsights } from '../../../../types';

// GET /api/analytics/inventory-insights - Get best-selling and slow-moving inventory insights
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build date filter - default to last 3 months for sales analysis
    let dateFilter: Record<string, unknown> = {};
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
        end.setHours(23, 59, 59, 999);
        dateQuery.$lte = end;
      }
      dateFilter = { date: dateQuery };
    } else {
      // Default to last 3 months
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      dateFilter = {
        date: { $gte: threeMonthsAgo }
      };
    }

    // Get best-selling items
    const bestSellingItems = await Transaction.aggregate([
      {
        $match: {
          type: 'sale',
          ...dateFilter
        }
      },
      {
        $unwind: '$items'
      },
      {
        $group: {
          _id: '$items.itemName',
          totalSold: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.totalPrice' },
          transactionCount: { $sum: 1 },
          averagePrice: { $avg: '$items.unitPrice' },
          lastSaleDate: { $max: '$date' }
        }
      },
      {
        $project: {
          itemName: '$_id',
          totalSold: 1,
          revenue: { $round: ['$revenue', 2] },
          transactionCount: 1,
          averagePrice: { $round: ['$averagePrice', 2] },
          lastSaleDate: 1
        }
      },
      {
        $sort: { totalSold: -1 }
      },
      {
        $limit: limit
      }
    ]);

    // Get slow-moving items (items with low sales or no recent sales)
    const slowMovingThreshold = new Date();
    slowMovingThreshold.setMonth(slowMovingThreshold.getMonth() - 1); // Items not sold in last month

    // First, get all items that have been sold to find their last sale dates
    const itemSalesData = await Transaction.aggregate([
      {
        $match: {
          type: 'sale'
        }
      },
      {
        $unwind: '$items'
      },
      {
        $group: {
          _id: '$items.itemName',
          lastSaleDate: { $max: '$date' },
          totalSold: { $sum: '$items.quantity' }
        }
      }
    ]);

    // Create a map of item sales data
    const salesMap = new Map();
    itemSalesData.forEach(item => {
      salesMap.set(item._id, {
        lastSaleDate: item.lastSaleDate,
        totalSold: item.totalSold
      });
    });

    // Get all inventory items and identify slow-moving ones
    const allInventoryItems = await InventoryItem.find({}).lean();
    
    const slowMovingItems = allInventoryItems
      .map(item => {
        const salesData = salesMap.get(item.itemName);
        return {
          itemName: item.itemName,
          currentStock: item.currentStock,
          lastSaleDate: salesData?.lastSaleDate || null,
          totalSold: salesData?.totalSold || 0,
          category: item.category,
          unitPrice: item.unitPrice
        };
      })
      .filter(item => {
        // Consider item slow-moving if:
        // 1. Never sold, OR
        // 2. Not sold in the last month, OR
        // 3. Has high stock but low sales
        const neverSold = !item.lastSaleDate;
        const notSoldRecently = item.lastSaleDate && item.lastSaleDate < slowMovingThreshold;
        const highStockLowSales = item.currentStock > 10 && item.totalSold < 5;
        
        return neverSold || notSoldRecently || highStockLowSales;
      })
      .sort((a, b) => {
        // Sort by stock level (highest first) then by last sale date (oldest first)
        if (a.currentStock !== b.currentStock) {
          return b.currentStock - a.currentStock;
        }
        if (!a.lastSaleDate && !b.lastSaleDate) return 0;
        if (!a.lastSaleDate) return -1;
        if (!b.lastSaleDate) return 1;
        return a.lastSaleDate.getTime() - b.lastSaleDate.getTime();
      })
      .slice(0, limit);

    // Get low stock items
    const lowStockItems = await InventoryItem.findLowStockItems()
      .limit(limit)
      .lean();

    const insights: InventoryInsights = {
      bestSelling: bestSellingItems.map(item => ({
        itemName: item.itemName,
        totalSold: item.totalSold,
        revenue: item.revenue
      })),
      slowMoving: slowMovingItems.map(item => ({
        itemName: item.itemName,
        currentStock: item.currentStock,
        lastSaleDate: item.lastSaleDate
      })),
      lowStock: lowStockItems.map((item: any) => ({
        itemName: item.itemName,
        currentStock: item.currentStock,
        minStockLevel: item.minStockLevel
      }))
    };

    const response: APIResponse<InventoryInsights> = {
      success: true,
      data: insights
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching inventory insights:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch inventory insights'
      }
    } as APIResponse, { status: 500 });
  }
}