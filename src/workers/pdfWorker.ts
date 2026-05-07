import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatDate, numberToWords, calculateInvoiceTotals } from '../utils/helpers';
import type { Invoice, Business, Settings } from '../types';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
    interface jsPDF {
        lastAutoTable: { finalY: number };
    }
}

interface PDFGenerationMessage {
    type: 'generate';
    invoice: Invoice;
    business: Business;
    settings: Partial<Settings>;
}

interface PDFProgressMessage {
    type: 'progress';
    progress: number;
    message: string;
}

interface PDFSuccessMessage {
    type: 'success';
    blob: Blob;
}

interface PDFErrorMessage {
    type: 'error';
    error: string;
}

type WorkerMessage = PDFGenerationMessage;

// PDF-safe currency formatter (avoids Unicode issues)
const formatPDFCurrency = (amount: number | string, currency: string = 'Rs.'): string => {
    const num = parseFloat(String(amount)) || 0;
    const currencySymbol = currency === '₹' ? 'Rs.' : currency;
    return `${currencySymbol} ${num.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
};

const checkAndAddPage = (doc: jsPDF, currentY: number, requiredSpace: number, margin: number = 15): number => {
    const pageHeight = doc.internal.pageSize.getHeight();
    const bottomMargin = 15;

    if (currentY + requiredSpace > pageHeight - bottomMargin) {
        doc.addPage();
        return margin;
    }

    return currentY;
};

const generateInvoicePDF = (
    invoice: Invoice,
    business: Business,
    settings: Partial<Settings> = {},
    onProgress?: (progress: number, message: string) => void
): jsPDF => {
    onProgress?.(10, 'Initializing PDF...');

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;
    let y = 15;

    const totals = calculateInvoiceTotals(invoice.items, invoice.taxRate, invoice.discount);
    const currency = business.currency || 'Rs.';

    onProgress?.(20, 'Adding header...');

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
            doc.addImage(business.logo, 'PNG', margin, y, 20, 20);
        } catch (error) {
            console.error('Error adding logo to PDF:', error);
        }
    }

    // Business Details - Right aligned
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    y += 5;
    doc.text(business.name || 'Business Name', pageWidth - margin, y, { align: 'right' });

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

    onProgress?.(40, 'Adding customer details...');

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

    onProgress?.(60, 'Adding invoice items...');

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

    // Calculate space needed for footer section early to ensure table leaves room for it
    const amountWords = `${numberToWords(Math.floor(totals.total))} Rupees only`;
    const wordsLines = doc.splitTextToSize(amountWords, (pageWidth / 2) - margin - 10);
    const notesLines = invoice.notes ? doc.splitTextToSize(invoice.notes, (pageWidth / 2) - margin - 10) : [];
    
    // More accurate footer height calculation. Right column (signature) takes ~32mm max.
    const footerHeight = Math.max(
        20 + wordsLines.length * 4 + (notesLines.length > 0 ? 5 + notesLines.length * 4 : 0),
        32
    );

    let tableFontSize = 7;
    let tableCellPadding = 2;

    if (invoice.items.length <= 5) {
        tableFontSize = 9;
        tableCellPadding = 3.5;
    } else if (invoice.items.length <= 9) {
        tableFontSize = 8;
        tableCellPadding = 3;
    } else if (invoice.items.length <= 13) {
        tableFontSize = 8;
        tableCellPadding = 2;
    }

    doc.autoTable({
        startY: y,
        head: [['#', 'Item name', 'Qty', 'Unit', 'Price/Unit', 'Disc %', 'Tax %', 'Amount']],
        body: tableData,
        margin: { top: margin, left: margin, right: margin, bottom: margin },
        tableWidth: contentWidth,
        styles: {
            fontSize: tableFontSize,
            cellPadding: tableCellPadding,
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

    // Check if we need a new page for BOTH the summary section (approx 30) and footer
    // This prevents the summary from being left at the bottom of page 1 while footer is pushed to page 2
    y = checkAndAddPage(doc, y, 30 + footerHeight, margin);

    onProgress?.(80, 'Adding totals and tax details...');

    // Horizontal line
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

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

    y = Math.max(taxTableEndY, amountY) + 5;

    // Horizontal line
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;

    onProgress?.(90, 'Adding footer...');

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

    if (invoice.notes) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text('Terms and conditions', leftColX, y);
        y += 5;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        y += 2;
        doc.text(notesLines, leftColX, y);
        y += notesLines.length * 4;
    }

    // Right column - Signature
    let sigY = footerStartY;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(`For: ${business.name || 'Your Business Name'}`, rightColX, sigY);
    sigY += 6;

    // Add signature image if available
    if (business.signature) {
        try {
            doc.addImage(business.signature, 'PNG', rightColX + 15, sigY, 30, 15);
            sigY += 18;
        } catch (error) {
            console.error('Failed to add signature to PDF:', error);
            sigY += 10;
        }
    } else {
        sigY += 10;
    }

    doc.setLineWidth(0.3);
    doc.line(rightColX + 10, sigY, rightColX + 50, sigY);
    sigY += 4;
    doc.setFont('helvetica', 'bold');
    doc.text('Authorized Signatory', rightColX + 30, sigY, { align: 'center' });

    onProgress?.(100, 'PDF generated successfully!');

    return doc;
};

// Listen for messages from main thread
self.onmessage = (e: MessageEvent<WorkerMessage>) => {
    const { type, invoice, business, settings } = e.data;

    if (type === 'generate') {
        try {
            const progressCallback = (progress: number, message: string) => {
                self.postMessage({
                    type: 'progress',
                    progress,
                    message
                } as PDFProgressMessage);
            };

            const doc = generateInvoicePDF(invoice, business, settings, progressCallback);
            const blob = doc.output('blob');

            self.postMessage({
                type: 'success',
                blob
            } as PDFSuccessMessage);
        } catch (error) {
            self.postMessage({
                type: 'error',
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            } as PDFErrorMessage);
        }
    }
};

export { };
