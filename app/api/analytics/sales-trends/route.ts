import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/database';
import Transaction from '../../../../lib/models/Transaction';
import { APIResponse, ChartData } from '../../../../types';

// GET /api/analytics/sales-trends - Get sales trends with time period filtering
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') as 'daily' | 'weekly' | 'monthly' | 'yearly' || 'daily';
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

    // Build date filter - default to last 30 days if no dates provided
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
      // Default to last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      dateFilter = {
        date: { $gte: thirtyDaysAgo }
      };
    }

    // Build aggregation pipeline based on period
    let groupBy: Record<string, unknown>;
    let sortField: string;

    switch (period) {
      case 'daily':
        groupBy = {
          year: { $year: '$date' },
          month: { $month: '$date' },
          day: { $dayOfMonth: '$date' }
        };
        sortField = 'date';
        break;
      case 'weekly':
        groupBy = {
          year: { $year: '$date' },
          week: { $week: '$date' }
        };
        sortField = 'date';
        break;
      case 'monthly':
        groupBy = {
          year: { $year: '$date' },
          month: { $month: '$date' }
        };
        sortField = 'date';
        break;
      case 'yearly':
        groupBy = {
          year: { $year: '$date' }
        };
        sortField = 'date';
        break;
      default:
        groupBy = {
          year: { $year: '$date' },
          month: { $month: '$date' },
          day: { $dayOfMonth: '$date' }
        };
        sortField = 'date';
    }

    const salesTrends = await Transaction.aggregate([
      {
        $match: {
          type: 'sale',
          ...dateFilter
        }
      },
      {
        $group: {
          _id: groupBy,
          totalSales: { $sum: '$totalAmount' },
          transactionCount: { $sum: 1 },
          date: { $first: '$date' }
        }
      },
      {
        $sort: { [sortField]: 1 }
      }
    ]);

    // Format data for charts
    const chartData: ChartData[] = salesTrends.map(item => {
      let dateLabel: string;
      
      switch (period) {
        case 'daily':
          dateLabel = new Date(item._id.year, item._id.month - 1, item._id.day).toISOString().split('T')[0];
          break;
        case 'weekly':
          // Calculate the start of the week
          const weekStart = new Date(item._id.year, 0, 1 + (item._id.week - 1) * 7);
          dateLabel = `Week ${item._id.week}, ${item._id.year}`;
          break;
        case 'monthly':
          dateLabel = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`;
          break;
        case 'yearly':
          dateLabel = String(item._id.year);
          break;
        default:
          dateLabel = new Date(item._id.year, item._id.month - 1, item._id.day).toISOString().split('T')[0];
      }

      return {
        date: dateLabel,
        value: Math.round(item.totalSales * 100) / 100,
        label: `${item.transactionCount} transactions`
      };
    });

    const response: APIResponse<ChartData[]> = {
      success: true,
      data: chartData
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching sales trends:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch sales trends'
      }
    } as APIResponse, { status: 500 });
  }
}