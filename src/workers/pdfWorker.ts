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

// Helper function to check if content fits on current page and add new page if needed
const checkAndAddPage = (doc: jsPDF, currentY: number, requiredSpace: number, margin: number = 15): number => {
    const pageHeight = doc.internal.pageSize.getHeight();
    const bottomMargin = 20;

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

    // Items table with new columns
    const tableData = invoice.items.map((item, index) => {
        const itemTotal = Number(item.quantity) * Number(item.price);
        const itemDiscount = (itemTotal * invoice.discount) / 100;
        const itemTaxable = itemTotal - itemDiscount;
        const itemGst = (itemTaxable * invoice.taxRate) / 100;
        const itemAmount = itemTaxable + itemGst;

        return [
            (index + 1).toString(),
            item.name,
            item.quantity.toString(),
            item.unit || 'PCS',
            formatPDFCurrency(item.price, currency),
            `${formatPDFCurrency(itemDiscount, currency)}\n(${invoice.discount}%)`,
            formatPDFCurrency(itemTaxable, currency),
            `${formatPDFCurrency(itemGst, currency)}\n(${invoice.taxRate.toFixed(1)}%)`,
            formatPDFCurrency(itemAmount, currency),
        ];
    });

    doc.autoTable({
        startY: y,
        head: [['#', 'Item name', 'Quantity', 'Unit', 'Price/Unit', 'Discount', 'Taxable amount', 'GST', 'Amount']],
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
            4: { cellWidth: 20, halign: 'right' },
            5: { cellWidth: 20, halign: 'right' },
            6: { cellWidth: 22, halign: 'right' },
            7: { cellWidth: 20, halign: 'right' },
            8: { cellWidth: 22, halign: 'right' },
        },
    });

    y = doc.lastAutoTable.finalY + 5;

    // Check if we need a new page for the summary section
    y = checkAndAddPage(doc, y, 30, margin);

    onProgress?.(80, 'Adding totals and tax details...');

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

    onProgress?.(90, 'Adding footer...');

    // Calculate space needed for footer section
    const amountWords = `${numberToWords(Math.floor(totals.total))} Rupees only`;
    const wordsLines = doc.splitTextToSize(amountWords, (pageWidth / 2) - margin - 10);
    const notesLines = invoice.notes ? doc.splitTextToSize(invoice.notes, (pageWidth / 2) - margin - 10) : [];
    const footerHeight = 15 + wordsLines.length * 4 + 10 + (notesLines.length * 4) + 35;

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
            doc.addImage(business.signature, 'PNG', rightColX + 15, sigY, 30, 15);
            sigY += 20;
        } catch (error) {
            console.error('Failed to add signature to PDF:', error);
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
