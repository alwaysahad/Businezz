import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatCurrency, formatDate, numberToWords, calculateInvoiceTotals } from './helpers';

export const generateInvoicePDF = (invoice, business, settings = {}) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;
  let y = 15;
  
  const primaryColor = [49, 151, 149];
  const textColor = [51, 51, 51];
  const lightGray = [120, 120, 120];
  const headerBg = [240, 247, 250];
  
  const totals = calculateInvoiceTotals(invoice.items, invoice.taxRate, invoice.discount);
  const taxLabel = settings.taxLabel || 'Tax';
  
  // Header background
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  // Business Name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(business.name || 'Your Business', margin, y + 8);
  
  // Invoice label
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('INVOICE', pageWidth - margin, y + 5, { align: 'right' });
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.invoiceNumber, pageWidth - margin, y + 12, { align: 'right' });
  
  y = 25;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  if (business.taxId) {
    doc.text(`${taxLabel} ID: ${business.taxId}`, margin, y + 5);
  }
  
  y = 48;
  
  // Business & Invoice Details Box
  doc.setFillColor(...headerBg);
  doc.roundedRect(margin, y, contentWidth, 32, 2, 2, 'F');
  
  doc.setTextColor(...textColor);
  doc.setFontSize(8);
  
  let leftY = y + 8;
  if (business.address) {
    doc.text(business.address, margin + 5, leftY);
    leftY += 5;
  }
  if (business.city || business.state) {
    doc.text(`${business.city || ''}${business.city && business.state ? ', ' : ''}${business.state || ''} ${business.pincode || ''}`, margin + 5, leftY);
    leftY += 5;
  }
  if (business.phone) doc.text(`Ph: ${business.phone}`, margin + 5, leftY);
  if (business.email) doc.text(`Email: ${business.email}`, margin + 5, leftY + 5);
  
  // Right side - Invoice details
  const labelX = pageWidth - margin - 55;
  const valueX = pageWidth - margin - 5;
  doc.setTextColor(...lightGray);
  doc.setFont('helvetica', 'normal');
  doc.text('Date:', labelX, y + 10);
  doc.text('Due Date:', labelX, y + 18);
  
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'bold');
  doc.text(formatDate(invoice.date), valueX, y + 10, { align: 'right' });
  doc.text(invoice.dueDate ? formatDate(invoice.dueDate) : '-', valueX, y + 18, { align: 'right' });
  
  y = 88;
  
  // Bill To section
  doc.setFillColor(...headerBg);
  doc.roundedRect(margin, y, contentWidth, 30, 2, 2, 'F');
  
  doc.setTextColor(...lightGray);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('BILL TO', margin + 5, y + 6);
  
  doc.setTextColor(...textColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.customerName || 'Customer', margin + 5, y + 13);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  let customerY = y + 19;
  if (invoice.customerAddress) {
    doc.text(invoice.customerAddress.substring(0, 60), margin + 5, customerY);
    customerY += 5;
  }
  if (invoice.customerPhone) doc.text(`Ph: ${invoice.customerPhone}`, margin + 5, customerY);
  if (invoice.customerEmail) doc.text(`Email: ${invoice.customerEmail}`, margin + 70, customerY);
  
  y = 125;
  
  // Items table - calculate proper column widths based on content width
  const colWidths = {
    num: 12,
    qty: 22,
    price: 32,
    amount: 35
  };
  const descWidth = contentWidth - colWidths.num - colWidths.qty - colWidths.price - colWidths.amount;
  
  const tableData = invoice.items.map((item, index) => [
    index + 1,
    item.name,
    item.quantity,
    formatCurrency(item.price, business.currency),
    formatCurrency(item.quantity * item.price, business.currency),
  ]);
  
  doc.autoTable({
    startY: y,
    head: [['#', 'Item Description', 'Qty', 'Price', 'Amount']],
    body: tableData,
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
    styles: {
      fontSize: 9,
      cellPadding: 4,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
    columnStyles: {
      0: { cellWidth: colWidths.num, halign: 'center' },
      1: { cellWidth: descWidth, halign: 'left' },
      2: { cellWidth: colWidths.qty, halign: 'center' },
      3: { cellWidth: colWidths.price, halign: 'right' },
      4: { cellWidth: colWidths.amount, halign: 'right' },
    },
  });
  
  y = doc.lastAutoTable.finalY + 12;
  
  // Totals section - align with the last two columns of the table
  const totalsWidth = 75;
  const totalsStartX = pageWidth - margin - totalsWidth;
  const totalsLabelX = totalsStartX;
  const totalsValueX = pageWidth - margin;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textColor);
  
  doc.text('Subtotal:', totalsLabelX, y);
  doc.text(formatCurrency(totals.subtotal, business.currency), totalsValueX, y, { align: 'right' });
  
  if (invoice.discount > 0) {
    y += 7;
    doc.text(`Discount (${invoice.discount}%):`, totalsLabelX, y);
    doc.setTextColor(220, 38, 38);
    doc.text(`-${formatCurrency(totals.discountAmount, business.currency)}`, totalsValueX, y, { align: 'right' });
    doc.setTextColor(...textColor);
  }
  
  if (invoice.taxRate > 0) {
    y += 7;
    doc.text(`${taxLabel} (${invoice.taxRate}%):`, totalsLabelX, y);
    doc.text(formatCurrency(totals.taxAmount, business.currency), totalsValueX, y, { align: 'right' });
  }
  
  // Total box - properly aligned
  y += 10;
  doc.setFillColor(...primaryColor);
  doc.roundedRect(totalsStartX - 3, y - 5, totalsWidth + 3, 14, 2, 2, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', totalsLabelX + 2, y + 4);
  doc.text(formatCurrency(totals.total, business.currency), totalsValueX - 3, y + 4, { align: 'right' });
  
  // Amount in words
  y += 20;
  doc.setTextColor(...lightGray);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Amount in Words:', margin, y);
  doc.setTextColor(...textColor);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(`${numberToWords(Math.floor(totals.total))} Only`, margin, y + 6);
  
  // Notes
  if (invoice.notes) {
    y += 18;
    doc.setTextColor(...lightGray);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('NOTES:', margin, y);
    doc.setTextColor(...textColor);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const notesLines = doc.splitTextToSize(invoice.notes, contentWidth);
    doc.text(notesLines, margin, y + 6);
  }
  
  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, footerY - 8, pageWidth - margin, footerY - 8);
  
  doc.setTextColor(...lightGray);
  doc.setFontSize(7);
  doc.text('Thank you for your business!', pageWidth / 2, footerY, { align: 'center' });
  
  return doc;
};

export const downloadInvoicePDF = (invoice, business, settings) => {
  const doc = generateInvoicePDF(invoice, business, settings);
  doc.save(`${invoice.invoiceNumber}.pdf`);
};

export const getInvoicePDFBlob = (invoice, business, settings) => {
  const doc = generateInvoicePDF(invoice, business, settings);
  return doc.output('blob');
};

export const openInvoicePDFInNewTab = (invoice, business, settings) => {
  const doc = generateInvoicePDF(invoice, business, settings);
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');
};
