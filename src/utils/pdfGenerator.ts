import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatDate, numberToWords, calculateInvoiceTotals } from './helpers';
import type { Invoice, Business, Settings } from '../types';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: AutoTableOptions) => jsPDF;
    lastAutoTable: { finalY: number };
  }
}

interface AutoTableOptions {
  startY?: number;
  head?: string[][];
  body?: string[][];
  margin?: { left?: number; right?: number; top?: number; bottom?: number };
  tableWidth?: number | 'auto';
  styles?: {
    fontSize?: number;
    cellPadding?: number;
    lineColor?: number[];
    lineWidth?: number;
    textColor?: number[];
  };
  headStyles?: {
    fillColor?: number[];
    textColor?: number[];
    fontStyle?: string;
    lineWidth?: number;
  };
  bodyStyles?: {
    fillColor?: number[];
  };
  columnStyles?: {
    [key: number]: {
      cellWidth?: number | 'auto';
      halign?: 'left' | 'center' | 'right';
    };
  };
}

// PDF-safe currency formatter (avoids Unicode issues)
const formatPDFCurrency = (amount: number | string, currency: string = 'Rs.'): string => {
  const num = parseFloat(String(amount)) || 0;
  // Use simple currency prefix for PDF compatibility
  const currencySymbol = currency === '₹' ? 'Rs.' : currency;
  return `${currencySymbol} ${num.toFixed(2)}`;
};

export const generateInvoicePDF = (
  invoice: Invoice,
  business: Business,
  settings: Partial<Settings> = {}
): jsPDF => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let y = 20;

  const taxLabel = settings.taxLabel || 'Tax';
  const totals = calculateInvoiceTotals(invoice.items, invoice.taxRate, invoice.discount);
  const currency = business.currency || 'Rs.';

  // Add logo if available and showLogo is enabled
  if (settings.showLogo && business.logo) {
    try {
      // Add logo image (20x20 size)
      doc.addImage(business.logo, 'PNG', margin, y, 20, 20);

      // Business Name - Bold Header (next to logo)
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(business.name || 'Business Name', margin + 25, y + 7);

      // Invoice Number - Right aligned
      doc.setFontSize(12);
      doc.text('INVOICE', pageWidth - margin, y + 7, { align: 'right' });

      y += 12;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(invoice.invoiceNumber, pageWidth - margin, y, { align: 'right' });

      y += 10;
    } catch (error) {
      console.error('Error adding logo to PDF:', error);
      // Fallback to text-only header
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(business.name || 'Business Name', margin, y);

      doc.setFontSize(12);
      doc.text('INVOICE', pageWidth - margin, y, { align: 'right' });

      y += 7;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(invoice.invoiceNumber, pageWidth - margin, y, { align: 'right' });

      y += 5;
    }
  } else {
    // No logo - original layout
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(business.name || 'Business Name', margin, y);

    // Invoice Number - Right aligned
    doc.setFontSize(12);
    doc.text('INVOICE', pageWidth - margin, y, { align: 'right' });

    y += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.invoiceNumber, pageWidth - margin, y, { align: 'right' });

    y += 5;
  }

  // Business Details
  doc.setFontSize(9);
  const businessLines: string[] = [];
  if (business.address) businessLines.push(business.address);
  if (business.city || business.state) {
    businessLines.push(`${business.city || ''}${business.city && business.state ? ', ' : ''}${business.state || ''} ${business.pincode || ''}`.trim());
  }
  if (business.phone) businessLines.push(`Phone: ${business.phone}`);
  if (business.email) businessLines.push(`Email: ${business.email}`);
  if (business.taxId) businessLines.push(`${taxLabel} ID: ${business.taxId}`);

  businessLines.forEach((line) => {
    doc.text(line, margin, y);
    y += 4;
  });

  // Horizontal line
  y += 5;
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // Invoice Details - Two columns
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', margin, y);
  doc.text('Invoice Details:', pageWidth / 2 + 10, y);

  y += 6;
  doc.setFont('helvetica', 'normal');

  // Customer details (left)
  const customerY = y;
  doc.text(invoice.customerName || 'Customer', margin, customerY);
  let custY = customerY + 4;
  if (invoice.customerAddress) {
    const addrLines = doc.splitTextToSize(invoice.customerAddress, contentWidth / 2 - 20);
    doc.text(addrLines, margin, custY);
    custY += addrLines.length * 4;
  }
  if (invoice.customerPhone) {
    doc.text(`Phone: ${invoice.customerPhone}`, margin, custY);
    custY += 4;
  }
  if (invoice.customerEmail) {
    doc.text(`Email: ${invoice.customerEmail}`, margin, custY);
  }

  // Invoice details (right)
  const detailX = pageWidth / 2 + 10;
  doc.text(`Date: ${formatDate(invoice.date)}`, detailX, customerY);

  y = Math.max(custY, customerY + 12) + 10;

  // Items table
  const tableData = invoice.items.map((item, index) => [
    (index + 1).toString(),
    item.name,
    item.quantity.toString(),
    formatPDFCurrency(item.price, currency),
    formatPDFCurrency(item.quantity * item.price, currency),
  ]);

  doc.autoTable({
    startY: y,
    head: [['#', 'Description', 'Qty', 'Rate', 'Amount']],
    body: tableData,
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
    styles: {
      fontSize: 9,
      cellPadding: 4,
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
      textColor: [0, 0, 0],
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      lineWidth: 0.3,
    },
    bodyStyles: {
      fillColor: [255, 255, 255],
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 35, halign: 'right' },
    },
  });

  y = doc.lastAutoTable.finalY + 10;

  // Totals section - right aligned
  const totalsX = pageWidth - margin - 80;
  const valueX = pageWidth - margin;

  doc.setFontSize(9);

  // Subtotal
  doc.text('Subtotal:', totalsX, y);
  doc.text(formatPDFCurrency(totals.subtotal, currency), valueX, y, { align: 'right' });

  // Discount
  if (invoice.discount > 0) {
    y += 6;
    doc.text(`Discount (${invoice.discount}%):`, totalsX, y);
    doc.text(`-${formatPDFCurrency(totals.discountAmount, currency)}`, valueX, y, { align: 'right' });
  }

  // Tax
  if (invoice.taxRate > 0) {
    y += 6;
    doc.text(`${taxLabel} (${invoice.taxRate}%):`, totalsX, y);
    doc.text(formatPDFCurrency(totals.taxAmount, currency), valueX, y, { align: 'right' });
  }

  // Total with line
  y += 4;
  doc.setLineWidth(0.3);
  doc.line(totalsX - 5, y, valueX, y);

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('TOTAL:', totalsX, y);
  doc.text(formatPDFCurrency(totals.total, currency), valueX, y, { align: 'right' });

  // Amount in words
  y += 15;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Amount in Words:', margin, y);
  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.text(`${numberToWords(Math.floor(totals.total))} Only`, margin, y);

  // Notes
  if (invoice.notes) {
    y += 12;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Notes:', margin, y);
    y += 5;
    const notesLines = doc.splitTextToSize(invoice.notes, contentWidth);
    doc.text(notesLines, margin, y);
  }

  // Footer line
  const footerY = doc.internal.pageSize.getHeight() - 20;
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Thank you for your business!', pageWidth / 2, footerY, { align: 'center' });

  return doc;
};

export const downloadInvoicePDF = (
  invoice: Invoice,
  business: Business,
  settings: Partial<Settings>
): void => {
  const doc = generateInvoicePDF(invoice, business, settings);
  doc.save(`${invoice.invoiceNumber}.pdf`);
};

export const getInvoicePDFBlob = (
  invoice: Invoice,
  business: Business,
  settings: Partial<Settings>
): Blob => {
  const doc = generateInvoicePDF(invoice, business, settings);
  return doc.output('blob');
};

export const openInvoicePDFInNewTab = (
  invoice: Invoice,
  business: Business,
  settings: Partial<Settings>
): void => {
  const doc = generateInvoicePDF(invoice, business, settings);
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');
};
