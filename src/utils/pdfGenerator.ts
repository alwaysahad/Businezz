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

const checkAndAddPage = (doc: jsPDF, currentY: number, requiredSpace: number, margin: number = 15): number => {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (currentY + requiredSpace > pageHeight - 10) {
    doc.addPage();
    return margin;
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

  y = doc.lastAutoTable.finalY + 3;

  y = checkAndAddPage(doc, y, 30, margin);

  // Horizontal line
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // Tax Summary using autoTable (left side)
  const taxTableData = [
    ['SGST', formatPDFCurrency(totals.taxAmount / 2, currency)],
    ['CGST', formatPDFCurrency(totals.taxAmount / 2, currency)],
  ];

  doc.autoTable({
    startY: y,
    head: [['Tax type', 'Tax amount']],
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
      0: { cellWidth: 'auto', halign: 'left' },
      1: { cellWidth: 'auto', halign: 'right' },
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
  y += 5;

  // Pre-compute text for footer
  const amountWords = `${numberToWords(Math.floor(totals.total))} Rupees only`;
  const halfWidth = (pageWidth / 2) - margin - 10;
  const wordsLines = doc.splitTextToSize(amountWords, halfWidth);
  const notesLines = invoice.notes ? doc.splitTextToSize(invoice.notes, halfWidth) : [];

  // Estimate left-column height: heading(5) + words + gap(5) + terms heading(5) + notes
  const leftHeight = 5 + wordsLines.length * 4 + 5 + 5 + (notesLines.length > 0 ? 2 + notesLines.length * 4 : 0);
  // Estimate right-column height: "For:" line(8) + signature(20) + line(4) + label(4)
  const rightHeight = 8 + (business.signature ? 20 : 15) + 8;
  const footerHeight = Math.max(leftHeight, rightHeight);

  y = checkAndAddPage(doc, y, footerHeight, margin);

  const footerStartY = y;

  // Left column - Amount in words
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Invoice Amount In Words', leftColX, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(wordsLines, leftColX, y);
  y += wordsLines.length * 4 + 5;

  // Left column - Terms
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Terms and conditions', leftColX, y);
  y += 5;

  if (invoice.notes) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    y += 2;
    doc.text(notesLines, leftColX, y);
    y += notesLines.length * 4;
  }

  // Right column - Signature (rendered at footerStartY)
  let sigY = footerStartY;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`For: ${business.name || 'Your Business Name'}`, rightColX, sigY);
  sigY += 8;

  if (business.signature) {
    try {
      doc.addImage(business.signature, 'PNG', rightColX + 15, sigY, 30, 15);
      sigY += 18;
    } catch {
      sigY += 15;
    }
  } else {
    sigY += 15;
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
