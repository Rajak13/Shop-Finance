import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/database';
import Transaction from '../../../../lib/models/Transaction';
import InventoryItem from '../../../../lib/models/InventoryItem';
import { APIResponse } from '../../../../types';
import * as XLSX from 'xlsx';

// GET /api/analytics/export - Export analytics data in various formats
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') as 'excel' | 'csv' || 'excel';
    const type = searchParams.get('type') as 'transactions' | 'inventory' | 'analytics' || 'transactions';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Validate format
    if (!['excel', 'csv'].includes(format)) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_FORMAT',
          message: 'Format must be either excel or csv'
        }
      } as APIResponse, { status: 400 });
    }

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

    let data: any[] = [];
    let filename = '';

    switch (type) {
      case 'transactions':
        const transactions = await Transaction.find(dateFilter)
          .sort({ date: -1 })
          .lean();

        data = transactions.flatMap(transaction => 
          transaction.items.map((item: any) => ({
            'Transaction ID': transaction.transactionId,
            'Date': new Date(transaction.date).toLocaleDateString(),
            'Type': transaction.type,
            'Item Name': item.itemName,
            'Category': item.category || 'N/A',
            'Quantity': item.quantity,
            'Unit Price': item.unitPrice,
            'Total Price': item.totalPrice,
            'Supplier': transaction.supplier?.name || 'N/A',
            'Customer': transaction.customer?.name || 'N/A',
            'Notes': transaction.notes || ''
          }))
        );
        filename = `transactions_${new Date().toISOString().split('T')[0]}`;
        break;

      case 'inventory':
        const inventory = await InventoryItem.find({}).lean();
        data = inventory.map((item: any) => ({
          'Item Name': item.itemName,
          'Category': item.category,
          'Current Stock': item.currentStock,
          'Min Stock Level': item.minStockLevel,
          'Unit Price': item.unitPrice,
          'Total Value': item.totalValue,
          'Last Updated': new Date(item.lastUpdated).toLocaleDateString(),
          'Low Stock': item.currentStock <= item.minStockLevel ? 'Yes' : 'No'
        }));
        filename = `inventory_${new Date().toISOString().split('T')[0]}`;
        break;

      case 'analytics':
        // Get comprehensive analytics data
        const [salesData, purchaseData, inventoryData] = await Promise.all([
          Transaction.aggregate([
            { $match: { type: 'sale', ...dateFilter } },
            { $unwind: '$items' },
            {
              $group: {
                _id: {
                  date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                  item: '$items.itemName'
                },
                totalQuantity: { $sum: '$items.quantity' },
                totalRevenue: { $sum: '$items.totalPrice' }
              }
            },
            { $sort: { '_id.date': -1 } }
          ]),
          Transaction.aggregate([
            { $match: { type: 'purchase', ...dateFilter } },
            { $unwind: '$items' },
            {
              $group: {
                _id: {
                  date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                  supplier: '$supplier.name'
                },
                totalAmount: { $sum: '$items.totalPrice' },
                itemCount: { $sum: 1 }
              }
            },
            { $sort: { '_id.date': -1 } }
          ]),
          InventoryItem.aggregate([
            {
              $project: {
                itemName: 1,
                category: 1,
                currentStock: 1,
                totalValue: 1,
                isLowStock: { $lte: ['$currentStock', '$minStockLevel'] }
              }
            }
          ])
        ]);

        // Combine analytics data
        data = [
          ...salesData.map((item: any) => ({
            'Type': 'Sale',
            'Date': item._id.date,
            'Item/Supplier': item._id.item,
            'Quantity/Count': item.totalQuantity,
            'Amount': item.totalRevenue,
            'Category': 'Sales Data'
          })),
          ...purchaseData.map((item: any) => ({
            'Type': 'Purchase',
            'Date': item._id.date,
            'Item/Supplier': item._id.supplier,
            'Quantity/Count': item.itemCount,
            'Amount': item.totalAmount,
            'Category': 'Purchase Data'
          })),
          ...inventoryData.map((item: any) => ({
            'Type': 'Inventory',
            'Date': new Date().toISOString().split('T')[0],
            'Item/Supplier': item.itemName,
            'Quantity/Count': item.currentStock,
            'Amount': item.totalValue,
            'Category': item.category
          }))
        ];
        filename = `analytics_${new Date().toISOString().split('T')[0]}`;
        break;

      default:
        return NextResponse.json({
          success: false,
          error: {
            code: 'INVALID_TYPE',
            message: 'Type must be one of: transactions, inventory, analytics'
          }
        } as APIResponse, { status: 400 });
    }

    if (data.length === 0) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'NO_DATA',
          message: 'No data available for export'
        }
      } as APIResponse, { status: 404 });
    }

    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Auto-size columns
    const colWidths = Object.keys(data[0]).map(key => ({
      wch: Math.max(
        key.length,
        ...data.map(row => String(row[key] || '').length)
      )
    }));
    worksheet['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, type.charAt(0).toUpperCase() + type.slice(1));

    // Generate buffer
    const buffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: format === 'excel' ? 'xlsx' : 'csv' 
    });

    // Set response headers
    const mimeType = format === 'excel' 
      ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      : 'text/csv';
    
    const fileExtension = format === 'excel' ? 'xlsx' : 'csv';

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}.${fileExtension}"`,
        'Content-Length': buffer.length.toString()
      }
    });

  } catch (error) {
    console.error('Error exporting data:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to export data'
      }
    } as APIResponse, { status: 500 });
  }
}