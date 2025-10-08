import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/database';
import Transaction from '../../../../lib/models/Transaction';
import InventoryItem from '../../../../lib/models/InventoryItem';
import { APIResponse, OverviewAnalytics } from '../../../../types';

// GET /api/analytics/overview - Get KPI dashboard data
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

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
        // Set end date to end of day
        end.setHours(23, 59, 59, 999);
        dateQuery.$lte = end;
      }
      dateFilter.date = dateQuery;
    }

    // Get sales and purchase totals
    const [salesData, purchaseData, inventoryValue, transactionCount] = await Promise.all([
      // Total sales
      Transaction.aggregate([
        {
          $match: {
            type: 'sale',
            ...dateFilter
          }
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$totalAmount' },
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Total purchases
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
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Current inventory value
      InventoryItem.getTotalInventoryValue(),
      
      // Total transaction count
      Transaction.countDocuments(dateFilter)
    ]);

    const totalSales = salesData[0]?.totalSales || 0;
    const totalPurchases = purchaseData[0]?.totalPurchases || 0;
    const profit = totalSales - totalPurchases;

    const analytics: OverviewAnalytics = {
      totalSales: Math.round(totalSales * 100) / 100,
      totalPurchases: Math.round(totalPurchases * 100) / 100,
      profit: Math.round(profit * 100) / 100,
      transactionCount,
      inventoryValue: Math.round(inventoryValue.totalValue * 100) / 100
    };

    const response: APIResponse<OverviewAnalytics> = {
      success: true,
      data: analytics
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching overview analytics:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch overview analytics'
      }
    } as APIResponse, { status: 500 });
  }
}