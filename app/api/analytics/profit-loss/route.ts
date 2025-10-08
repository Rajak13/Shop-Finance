import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/database';
import Transaction from '../../../../lib/models/Transaction';
import { APIResponse, ChartData } from '../../../../types';

interface ProfitLossData {
  period: string;
  sales: number;
  purchases: number;
  profit: number;
  profitMargin: number;
  transactionCount: {
    sales: number;
    purchases: number;
  };
}

interface ProfitLossResponse {
  summary: {
    totalSales: number;
    totalPurchases: number;
    totalProfit: number;
    averageProfitMargin: number;
  };
  chartData: ProfitLossData[];
  trends: {
    salesTrend: 'up' | 'down' | 'stable';
    profitTrend: 'up' | 'down' | 'stable';
    profitMarginTrend: 'up' | 'down' | 'stable';
  };
}

// GET /api/analytics/profit-loss - Get profit/loss calculation with date range support
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') as 'daily' | 'weekly' | 'monthly' | 'yearly' || 'monthly';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Validate period
    if (!['daily', 'weekly', 'monthly', 'yearly'].includes(period)) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Period must be one of: daily, weekly, monthly, yearly'
        }
      } as APIResponse, { status: 400 });
    }

    // Build date filter - default to last 6 months if no dates provided
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
      // Default to last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      dateFilter = {
        date: { $gte: sixMonthsAgo }
      };
    }

    // Build aggregation pipeline based on period
    let groupBy: Record<string, unknown>;

    switch (period) {
      case 'daily':
        groupBy = {
          year: { $year: '$date' },
          month: { $month: '$date' },
          day: { $dayOfMonth: '$date' }
        };
        break;
      case 'weekly':
        groupBy = {
          year: { $year: '$date' },
          week: { $week: '$date' }
        };
        break;
      case 'monthly':
        groupBy = {
          year: { $year: '$date' },
          month: { $month: '$date' }
        };
        break;
      case 'yearly':
        groupBy = {
          year: { $year: '$date' }
        };
        break;
      default:
        groupBy = {
          year: { $year: '$date' },
          month: { $month: '$date' }
        };
    }

    // Get profit/loss data by period
    const profitLossData = await Transaction.aggregate([
      {
        $match: dateFilter
      },
      {
        $group: {
          _id: {
            ...groupBy,
            type: '$type'
          },
          totalAmount: { $sum: '$totalAmount' },
          transactionCount: { $sum: 1 },
          date: { $first: '$date' }
        }
      },
      {
        $group: {
          _id: {
            year: '$_id.year',
            month: '$_id.month',
            day: '$_id.day',
            week: '$_id.week'
          },
          sales: {
            $sum: {
              $cond: [{ $eq: ['$_id.type', 'sale'] }, '$totalAmount', 0]
            }
          },
          purchases: {
            $sum: {
              $cond: [{ $eq: ['$_id.type', 'purchase'] }, '$totalAmount', 0]
            }
          },
          salesCount: {
            $sum: {
              $cond: [{ $eq: ['$_id.type', 'sale'] }, '$transactionCount', 0]
            }
          },
          purchasesCount: {
            $sum: {
              $cond: [{ $eq: ['$_id.type', 'purchase'] }, '$transactionCount', 0]
            }
          },
          date: { $first: '$date' }
        }
      },
      {
        $project: {
          sales: 1,
          purchases: 1,
          profit: { $subtract: ['$sales', '$purchases'] },
          profitMargin: {
            $cond: [
              { $gt: ['$sales', 0] },
              { $multiply: [{ $divide: [{ $subtract: ['$sales', '$purchases'] }, '$sales'] }, 100] },
              0
            ]
          },
          salesCount: 1,
          purchasesCount: 1,
          date: 1
        }
      },
      {
        $sort: { date: 1 }
      }
    ]);

    // Format data for response
    const chartData: ProfitLossData[] = profitLossData.map(item => {
      let periodLabel: string;
      
      switch (period) {
        case 'daily':
          periodLabel = new Date(item._id.year, item._id.month - 1, item._id.day).toISOString().split('T')[0];
          break;
        case 'weekly':
          periodLabel = `Week ${item._id.week}, ${item._id.year}`;
          break;
        case 'monthly':
          periodLabel = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`;
          break;
        case 'yearly':
          periodLabel = String(item._id.year);
          break;
        default:
          periodLabel = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`;
      }

      return {
        period: periodLabel,
        sales: Math.round(item.sales * 100) / 100,
        purchases: Math.round(item.purchases * 100) / 100,
        profit: Math.round(item.profit * 100) / 100,
        profitMargin: Math.round(item.profitMargin * 100) / 100,
        transactionCount: {
          sales: item.salesCount,
          purchases: item.purchasesCount
        }
      };
    });

    // Calculate summary
    const summary = chartData.reduce(
      (acc, item) => ({
        totalSales: acc.totalSales + item.sales,
        totalPurchases: acc.totalPurchases + item.purchases,
        totalProfit: acc.totalProfit + item.profit,
        averageProfitMargin: 0 // Will calculate after
      }),
      { totalSales: 0, totalPurchases: 0, totalProfit: 0, averageProfitMargin: 0 }
    );

    summary.averageProfitMargin = summary.totalSales > 0 
      ? Math.round((summary.totalProfit / summary.totalSales) * 100 * 100) / 100
      : 0;

    // Calculate trends (compare first half vs second half of data)
    const calculateTrend = (values: number[]): 'up' | 'down' | 'stable' => {
      if (values.length < 2) return 'stable';
      
      const midPoint = Math.floor(values.length / 2);
      const firstHalf = values.slice(0, midPoint);
      const secondHalf = values.slice(midPoint);
      
      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      
      const change = ((secondAvg - firstAvg) / firstAvg) * 100;
      
      if (change > 5) return 'up';
      if (change < -5) return 'down';
      return 'stable';
    };

    const trends = {
      salesTrend: calculateTrend(chartData.map(d => d.sales)),
      profitTrend: calculateTrend(chartData.map(d => d.profit)),
      profitMarginTrend: calculateTrend(chartData.map(d => d.profitMargin))
    };

    const response: ProfitLossResponse = {
      summary: {
        totalSales: Math.round(summary.totalSales * 100) / 100,
        totalPurchases: Math.round(summary.totalPurchases * 100) / 100,
        totalProfit: Math.round(summary.totalProfit * 100) / 100,
        averageProfitMargin: summary.averageProfitMargin
      },
      chartData,
      trends
    };

    return NextResponse.json({
      success: true,
      data: response
    } as APIResponse<ProfitLossResponse>);

  } catch (error) {
    console.error('Error fetching profit/loss analytics:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch profit/loss analytics'
      }
    } as APIResponse, { status: 500 });
  }
}