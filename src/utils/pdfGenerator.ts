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
  body?: (string | number)[][];
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

// Helper function to check if content fits on current page and add new page if needed
const checkAndAddPage = (doc: jsPDF, currentY: number, requiredSpace: number, margin: number = 15): number => {
  const pageHeight = doc.internal.pageSize.getHeight();
  const bottomMargin = 20; // Reserve space at bottom of page

  if (currentY + requiredSpace > pageHeight - bottomMargin) {
    doc.addPage();
    return margin; // Return to top margin on new page
  }

  return currentY;
};

export const generateInvoicePDF = (
  invoice: Invoice,
  business: Business,
  settings: Partial<Settings> = {}
): jsPDF => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;
  let y = 15;

  const totals = calculateInvoiceTotals(invoice.items, invoice.taxRate, invoice.discount);
  const currency = business.currency || 'Rs.';

  // Tax Invoice Title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Tax Invoice', pageWidth / 2, y, { align: 'center' });
  y += 10;

  // Draw top border
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Header with logo and business details
  const headerStartY = y;

  // Add logo if available
  if (settings.showLogo && business.logo) {
    try {
      console.log('Adding logo to PDF:', { showLogo: settings.showLogo, hasLogo: !!business.logo });
      doc.addImage(business.logo, 'PNG', margin, y, 20, 20);
    } catch (error) {
      console.error('Error adding logo to PDF:', error);
    }
  } else {
    console.log('Logo not added to PDF:', { showLogo: settings.showLogo, hasLogo: !!business.logo });
  }

  // Business Details - Right aligned
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  const businessNameY = y + 5;
  doc.text(business.name || 'Business Name', pageWidth - margin, businessNameY, { align: 'right' });

  y += 8;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');

  if (business.address) {
    doc.text(business.address, pageWidth - margin, y, { align: 'right' });
    y += 4;
  }
  if (business.city || business.state) {
    const cityLine = `${business.city || ''}${business.city && business.state ? ', ' : ''}${business.state || ''} ${business.pincode || ''}`.trim();
    doc.text(cityLine, pageWidth - margin, y, { align: 'right' });
    y += 4;
  }
  if (business.phone) {
    doc.text(`Phone no.: ${business.phone}`, pageWidth - margin, y, { align: 'right' });
    y += 4;
  }
  if (business.email) {
    doc.text(`Email: ${business.email}`, pageWidth - margin, y, { align: 'right' });
    y += 4;
  }
  if (business.taxId) {
    doc.text(`GSTIN: ${business.taxId}, State: ${business.state || '09-Uttar Pradesh'}`, pageWidth - margin, y, { align: 'right' });
    y += 4;
  }

  y = Math.max(y, headerStartY + 30);
  y += 5;

  // Horizontal line
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Bill To & Invoice Details - Two columns
  const leftColX = margin;
  const rightColX = pageWidth / 2 + 5;
  const sectionY = y;

  // Bill To
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Bill To', leftColX, sectionY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  let leftY = sectionY + 5;
  doc.text(invoice.customerName || 'Customer', leftColX, leftY);
  leftY += 4;

  if (invoice.customerAddress) {
    const addrLines = doc.splitTextToSize(invoice.customerAddress, (pageWidth / 2) - margin - 10);
    doc.text(addrLines, leftColX, leftY);
    leftY += addrLines.length * 4;
  }
  doc.text(`State: ${business.state || '09-Uttar Pradesh'}`, leftColX, leftY);

  // Invoice Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Invoice Details', rightColX, sectionY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  let rightY = sectionY + 5;
  doc.text(`Invoice No.: ${invoice.invoiceNumber}`, rightColX, rightY);
  rightY += 4;
  doc.text(`Date: ${formatDate(invoice.date)}`, rightColX, rightY);
  rightY += 4;
  doc.text(`Place of Supply: ${business.state || '09-Uttar Pradesh'}`, rightColX, rightY);

  y = Math.max(leftY, rightY) + 8;

  // Horizontal line
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  // Items table with per-item discount and tax
  const tableData = invoice.items.map((item, index) => {
    const qty = Number(item.quantity);
    const price = Number(item.price);
    const itemDiscount = Number(item.discount) || 0;
    const itemTaxRate = Number(item.taxRate) || 0;

    const itemSubtotal = qty * price;
    const itemDiscountAmount = (itemSubtotal * itemDiscount) / 100;
    const itemTaxable = itemSubtotal - itemDiscountAmount;
    const itemTaxAmount = (itemTaxable * itemTaxRate) / 100;
    const itemTotal = itemTaxable + itemTaxAmount;

    return [
      (index + 1).toString(),
      item.name,
      item.quantity.toString(),
      item.unit || 'PCS',
      formatPDFCurrency(price, currency),
      itemDiscount > 0 ? `${itemDiscount.toFixed(1)}%` : '-',
      itemTaxRate > 0 ? `${itemTaxRate.toFixed(1)}%` : '-',
      formatPDFCurrency(itemTotal, currency),
    ];
  });

  doc.autoTable({
    startY: y,
    head: [['#', 'Item name', 'Qty', 'Unit', 'Price/Unit', 'Disc %', 'Tax %', 'Amount']],
    body: tableData,
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
    styles: {
      fontSize: 7,
      cellPadding: 2,
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
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 12, halign: 'center' },
      4: { cellWidth: 22, halign: 'right' },
      5: { cellWidth: 18, halign: 'center' },
      6: { cellWidth: 18, halign: 'center' },
      7: { cellWidth: 25, halign: 'right' },
    },
  });

  y = doc.lastAutoTable.finalY + 5;

  // Check if we need a new page for the summary section (needs ~30 units)
  y = checkAndAddPage(doc, y, 30, margin);

  // Horizontal line
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Tax Summary using autoTable (left side)
  const taxTableData = [
    ['SGST', formatPDFCurrency(totals.taxableAmount, currency), `${(invoice.taxRate / 2).toFixed(1)}%`, formatPDFCurrency(totals.taxAmount / 2, currency)],
    ['CGST', formatPDFCurrency(totals.taxableAmount, currency), `${(invoice.taxRate / 2).toFixed(1)}%`, formatPDFCurrency(totals.taxAmount / 2, currency)],
  ];

  doc.autoTable({
    startY: y,
    head: [['Tax type', 'Taxable amt', 'Rate', 'Tax amount']],
    body: taxTableData,
    margin: { left: margin, right: pageWidth / 2 + 10 },
    tableWidth: (pageWidth / 2) - margin - 15,
    styles: {
      fontSize: 6,
      cellPadding: 1.5,
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
      textColor: [0, 0, 0],
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      lineWidth: 0.2,
    },
    bodyStyles: {
      fillColor: [255, 255, 255],
    },
    columnStyles: {
      0: { cellWidth: 15, halign: 'left' },
      1: { cellWidth: 'auto', halign: 'right' },
      2: { cellWidth: 12, halign: 'center' },
      3: { cellWidth: 'auto', halign: 'right' },
    },
  });

  const taxTableEndY = doc.lastAutoTable.finalY;

  // Amounts (right side) - positioned at same Y as tax table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Amounts', rightColX, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  let amountY = y + 5;

  doc.text('Sub Total', rightColX, amountY);
  doc.text(formatPDFCurrency(totals.taxableAmount, currency), pageWidth - margin, amountY, { align: 'right' });
  amountY += 5;

  doc.text('Round off', rightColX, amountY);
  const roundOffText = `${totals.roundOff >= 0 ? '' : '- '}${formatPDFCurrency(Math.abs(totals.roundOff), currency)}`;
  doc.text(roundOffText, pageWidth - margin, amountY, { align: 'right' });
  amountY += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Total', rightColX, amountY);
  doc.text(formatPDFCurrency(totals.total, currency), pageWidth - margin, amountY, { align: 'right' });

  y = Math.max(taxTableEndY, amountY) + 8;

  // Horizontal line
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Calculate space needed for footer section
  const amountWords = `${numberToWords(Math.floor(totals.total))} Rupees only`;
  const wordsLines = doc.splitTextToSize(amountWords, (pageWidth / 2) - margin - 10);
  const notesLines = invoice.notes ? doc.splitTextToSize(invoice.notes, (pageWidth / 2) - margin - 10) : [];
  const footerHeight = 15 + wordsLines.length * 4 + 10 + (notesLines.length * 4) + 35; // Space for words, terms, notes, and signature

  // Check if we need a new page for the footer section
  y = checkAndAddPage(doc, y, footerHeight, margin);

  // Footer section - Two columns
  const footerStartY = y;

  // Left column - Amount in words and Terms
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Invoice Amount In Words', leftColX, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(wordsLines, leftColX, y);
  y += wordsLines.length * 4 + 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Terms and conditions', leftColX, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);

  if (invoice.notes) {
    y += 2;
    doc.text(notesLines, leftColX, y);
    y += notesLines.length * 4;
  }

  // Right column - Signature
  let sigY = footerStartY;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`For: ${business.name || 'Your Business Name'}`, rightColX, sigY);
  sigY += 10;

  // Add signature image if available
  if (business.signature) {
    try {
      console.log('Adding signature to PDF:', { hasSignature: !!business.signature });
      doc.addImage(business.signature, 'PNG', rightColX + 15, sigY, 30, 15);
      sigY += 20;
    } catch (error) {
      console.error('Failed to add signature to PDF:', error);
      sigY += 15; // Add space even if signature fails
    }
  } else {
    console.log('Signature not added to PDF:', { hasSignature: !!business.signature });
    sigY += 15; // Add space for signature line
  }

  doc.setLineWidth(0.3);
  doc.line(rightColX + 10, sigY, rightColX + 50, sigY);
  sigY += 4;
  doc.setFont('helvetica', 'bold');
  doc.text('Authorized Signatory', rightColX + 30, sigY, { align: 'center' });

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
