'use client';

import { useState } from 'react';
import { Button } from '../ui';
import { Download, FileText, FileSpreadsheet, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ReportExportProps {
  startDate?: string;
  endDate?: string;
  reportTitle?: string;
  printElementId?: string;
}

type ExportFormat = 'excel' | 'csv' | 'pdf';
type ExportType = 'transactions' | 'inventory' | 'analytics';

export default function ReportExport({ 
  startDate, 
  endDate, 
  reportTitle = 'Analytics Report',
  printElementId = 'analytics-dashboard'
}: ReportExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleExport = async (format: ExportFormat, type: ExportType) => {
    try {
      setIsExporting(true);
      setShowDropdown(false);

      if (format === 'pdf') {
        await exportToPDF();
        return;
      }

      // Build query parameters
      const params = new URLSearchParams();
      params.append('format', format);
      params.append('type', type);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      // Fetch the export data
      const response = await fetch(`/api/analytics/export?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Export failed');
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from response headers or generate one
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `${type}_export_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Export error:', error);
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = async () => {
    try {
      const element = document.getElementById(printElementId);
      if (!element) {
        throw new Error('Element to export not found');
      }

      // Create canvas from the element
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      // Add title
      pdf.setFontSize(16);
      pdf.text(reportTitle, pdfWidth / 2, 10, { align: 'center' });

      // Add date range if provided
      if (startDate || endDate) {
        pdf.setFontSize(10);
        const dateRange = `${startDate ? new Date(startDate).toLocaleDateString() : 'Start'} - ${endDate ? new Date(endDate).toLocaleDateString() : 'End'}`;
        pdf.text(`Date Range: ${dateRange}`, pdfWidth / 2, 20, { align: 'center' });
      }

      // Add the chart/dashboard image
      pdf.addImage(imgData, 'PNG', imgX, imgY + 10, imgWidth * ratio, imgHeight * ratio);

      // Save the PDF
      const filename = `${reportTitle.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);

    } catch (error) {
      console.error('PDF export error:', error);
      throw error;
    }
  };

  const handlePrint = () => {
    const element = document.getElementById(printElementId);
    if (!element) {
      alert('Content to print not found');
      return;
    }

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print');
      return;
    }

    // Clone the element and its styles
    const clonedElement = element.cloneNode(true) as HTMLElement;
    
    // Create print document
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${reportTitle}</title>
          <style>
            body { 
              font-family: system-ui, -apple-system, sans-serif; 
              margin: 20px; 
              color: #000;
              background: #fff;
            }
            .no-print { display: none !important; }
            @media print {
              body { margin: 0; }
              .page-break { page-break-before: always; }
            }
            /* Copy relevant styles */
            .grid { display: grid; gap: 1rem; }
            .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
            .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
            .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
            .grid-cols-5 { grid-template-columns: repeat(5, minmax(0, 1fr)); }
            .p-4 { padding: 1rem; }
            .p-6 { padding: 1.5rem; }
            .mb-4 { margin-bottom: 1rem; }
            .mb-6 { margin-bottom: 1.5rem; }
            .text-lg { font-size: 1.125rem; }
            .text-xl { font-size: 1.25rem; }
            .text-2xl { font-size: 1.5rem; }
            .font-semibold { font-weight: 600; }
            .font-bold { font-weight: 700; }
            .border { border: 1px solid #e5e7eb; }
            .rounded-lg { border-radius: 0.5rem; }
            .bg-white { background-color: #fff; }
            .shadow { box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1); }
          </style>
        </head>
        <body>
          <div style="text-align: center; margin-bottom: 2rem;">
            <h1>${reportTitle}</h1>
            ${startDate || endDate ? `<p>Date Range: ${startDate ? new Date(startDate).toLocaleDateString() : 'Start'} - ${endDate ? new Date(endDate).toLocaleDateString() : 'End'}</p>` : ''}
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
          </div>
          ${clonedElement.outerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    
    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const exportOptions = [
    { 
      label: 'Export Transactions (Excel)', 
      format: 'excel' as ExportFormat, 
      type: 'transactions' as ExportType,
      icon: FileSpreadsheet 
    },
    { 
      label: 'Export Transactions (CSV)', 
      format: 'csv' as ExportFormat, 
      type: 'transactions' as ExportType,
      icon: FileText 
    },
    { 
      label: 'Export Inventory (Excel)', 
      format: 'excel' as ExportFormat, 
      type: 'inventory' as ExportType,
      icon: FileSpreadsheet 
    },
    { 
      label: 'Export Analytics (Excel)', 
      format: 'excel' as ExportFormat, 
      type: 'analytics' as ExportType,
      icon: FileSpreadsheet 
    },
    { 
      label: 'Export Dashboard (PDF)', 
      format: 'pdf' as ExportFormat, 
      type: 'analytics' as ExportType,
      icon: FileText 
    }
  ];

  return (
    <div className="relative">
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDropdown(!showDropdown)}
          disabled={isExporting}
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          {isExporting ? 'Exporting...' : 'Export'}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrint}
          className="flex items-center gap-2"
        >
          <Printer className="w-4 h-4" />
          Print
        </Button>
      </div>

      {showDropdown && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg min-w-[250px]">
            <div className="py-2">
              <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                Export Options
              </div>
              {exportOptions.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleExport(option.format, option.type)}
                  disabled={isExporting}
                  className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option.icon className="w-4 h-4" />
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}