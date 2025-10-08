import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/database';
import Transaction from '../../../../lib/models/Transaction';
import { APIResponse } from '../../../../types';

interface SupplierAnalytics {
  supplierName: string;
  totalPurchases: number;
  transactionCount: number;
  averageOrderValue: number;
  lastPurchaseDate: Date;
  topItems: Array<{
    itemName: string;
    totalQuantity: number;
    totalValue: number;
  }>;
}

interface PurchaseAnalyticsResponse {
  totalPurchases: number;
  supplierCount: number;
  averageOrderValue: number;
  suppliers: SupplierAnalytics[];
  topCategories: Array<{
    category: string;
    totalValue: number;
    itemCount: number;
  }>;
}

// GET /api/analytics/purchase-analytics - Get supplier insights and purchase analytics
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build date filter
    const dateFilter: Record<string, unknown> = {};
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
      dateFilter.date = dateQuery;
    }

    // Get overall purchase statistics
    const [overallStats, supplierAnalytics, categoryAnalytics] = await Promise.all([
      // Overall purchase statistics
      Transaction.aggregate([
        {
          $match: {
            type: 'purchase',
            ...dateFilter
          }
        },
        {
          $group: {
            _id: null,
            totalPurchases: { $sum: '$totalAmount' },
            transactionCount: { $sum: 1 },
            supplierCount: { $addToSet: '$supplier.name' }
          }
        },
        {
          $project: {
            totalPurchases: 1,
            transactionCount: 1,
            supplierCount: { $size: '$supplierCount' },
            averageOrderValue: {
              $cond: [
                { $gt: ['$transactionCount', 0] },
                { $divide: ['$totalPurchases', '$transactionCount'] },
                0
              ]
            }
          }
        }
      ]),

      // Supplier-wise analytics
      Transaction.aggregate([
        {
          $match: {
            type: 'purchase',
            ...dateFilter
          }
        },
        {
          $group: {
            _id: '$supplier.name',
            totalPurchases: { $sum: '$totalAmount' },
            transactionCount: { $sum: 1 },
            lastPurchaseDate: { $max: '$date' },
            items: { $push: '$items' }
          }
        },
        {
          $project: {
            supplierName: '$_id',
            totalPurchases: 1,
            transactionCount: 1,
            lastPurchaseDate: 1,
            averageOrderValue: {
              $cond: [
                { $gt: ['$transactionCount', 0] },
                { $divide: ['$totalPurchases', '$transactionCount'] },
                0
              ]
            },
            items: 1
          }
        },
        {
          $sort: { totalPurchases: -1 }
        },
        {
          $limit: limit
        }
      ]),

      // Category-wise analytics
      Transaction.aggregate([
        {
          $match: {
            type: 'purchase',
            ...dateFilter
          }
        },
        {
          $unwind: '$items'
        },
        {
          $group: {
            _id: '$items.category',
            totalValue: { $sum: '$items.totalPrice' },
            itemCount: { $sum: 1 },
            totalQuantity: { $sum: '$items.quantity' }
          }
        },
        {
          $project: {
            category: { $ifNull: ['$_id', 'Uncategorized'] },
            totalValue: 1,
            itemCount: 1,
            totalQuantity: 1
          }
        },
        {
          $sort: { totalValue: -1 }
        },
        {
          $limit: 10
        }
      ])
    ]);

    // Process supplier analytics to get top items for each supplier
    const suppliersWithTopItems: SupplierAnalytics[] = await Promise.all(
      supplierAnalytics.map(async (supplier: any) => {
        // Flatten and aggregate items for this supplier
        const allItems = supplier.items.flat();
        const itemMap = new Map();

        allItems.forEach((item: any) => {
          const key = item.itemName;
          if (itemMap.has(key)) {
            const existing = itemMap.get(key);
            existing.totalQuantity += item.quantity;
            existing.totalValue += item.totalPrice;
          } else {
            itemMap.set(key, {
              itemName: item.itemName,
              totalQuantity: item.quantity,
              totalValue: item.totalPrice
            });
          }
        });

        // Get top 5 items by value
        const topItems = Array.from(itemMap.values())
          .sort((a, b) => b.totalValue - a.totalValue)
          .slice(0, 5)
          .map(item => ({
            ...item,
            totalValue: Math.round(item.totalValue * 100) / 100
          }));

        return {
          supplierName: supplier.supplierName,
          totalPurchases: Math.round(supplier.totalPurchases * 100) / 100,
          transactionCount: supplier.transactionCount,
          averageOrderValue: Math.round(supplier.averageOrderValue * 100) / 100,
          lastPurchaseDate: supplier.lastPurchaseDate,
          topItems
        };
      })
    );

    const stats = overallStats[0] || {
      totalPurchases: 0,
      transactionCount: 0,
      supplierCount: 0,
      averageOrderValue: 0
    };

    const response: PurchaseAnalyticsResponse = {
      totalPurchases: Math.round(stats.totalPurchases * 100) / 100,
      supplierCount: stats.supplierCount,
      averageOrderValue: Math.round(stats.averageOrderValue * 100) / 100,
      suppliers: suppliersWithTopItems,
      topCategories: categoryAnalytics.map((cat: any) => ({
        category: cat.category,
        totalValue: Math.round(cat.totalValue * 100) / 100,
        itemCount: cat.itemCount
      }))
    };

    return NextResponse.json({
      success: true,
      data: response
    } as APIResponse<PurchaseAnalyticsResponse>);

  } catch (error) {
    console.error('Error fetching purchase analytics:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch purchase analytics'
      }
    } as APIResponse, { status: 500 });
  }
}