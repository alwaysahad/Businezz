import type { InvoiceItem, InvoiceTotals, InvoiceStatus, DateFormat } from '../types';

// Generate unique ID (UUID v4)
export const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers (though unlikely needed for this stack)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Format currency
export const formatCurrency = (amount: number | string, currency: string = '₹'): string => {
  const num = parseFloat(String(amount)) || 0;
  return `${currency}${num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

// Format date
export const formatDate = (date: string | Date | null | undefined, format: DateFormat = 'short'): string => {
  if (!date) return '';
  const d = new Date(date);

  if (format === 'short') {
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  if (format === 'long') {
    return d.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  if (format === 'input') {
    return d.toISOString().split('T')[0];
  }

  return d.toLocaleDateString();
};

// Calculate invoice totals with per-item discount and tax support
export const calculateInvoiceTotals = (
  items: InvoiceItem[],
  taxRate: number = 0,
  discount: number = 0
): InvoiceTotals => {
  // Calculate per-item totals first
  const itemTotals = items.map(item => {
    const qty = parseFloat(String(item.quantity)) || 0;
    const price = parseFloat(String(item.price)) || 0;
    const itemDiscount = parseFloat(String(item.discount)) || 0;
    const itemTaxRate = parseFloat(String(item.taxRate)) || 0;

    const itemSubtotal = qty * price;
    const itemDiscountAmount = (itemSubtotal * itemDiscount) / 100;
    const itemTaxable = itemSubtotal - itemDiscountAmount;
    const itemTaxAmount = (itemTaxable * itemTaxRate) / 100;
    const itemTotal = itemTaxable + itemTaxAmount;

    return itemTotal;
  });

  // Sum all item totals to get invoice subtotal
  const subtotal = itemTotals.reduce((sum, total) => sum + total, 0);

  // Apply invoice-level discount and tax
  const discountAmount = (subtotal * (parseFloat(String(discount)) || 0)) / 100;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = (taxableAmount * (parseFloat(String(taxRate)) || 0)) / 100;
  const exactTotal = taxableAmount + taxAmount;
  const roundedTotal = Math.round(exactTotal);
  const roundOff = roundedTotal - exactTotal;

  return {
    subtotal,
    discountAmount,
    taxableAmount,
    taxAmount,
    roundOff,
    total: roundedTotal,
  };
};

// Get invoice status color
export const getStatusColor = (status: InvoiceStatus): string => {
  const colors: Record<InvoiceStatus, string> = {
    draft: 'bg-midnight-600 text-midnight-200',
    pending: 'bg-gold-500/20 text-gold-400',
    paid: 'bg-teal-500/20 text-teal-400',
    overdue: 'bg-coral-500/20 text-coral-400',
    cancelled: 'bg-midnight-700 text-midnight-400',
  };
  return colors[status] || colors.draft;
};

// Get invoice status label
export const getStatusLabel = (status: InvoiceStatus): string => {
  const labels: Record<InvoiceStatus, string> = {
    draft: 'Draft',
    pending: 'Pending',
    paid: 'Paid',
    overdue: 'Overdue',
    cancelled: 'Cancelled',
  };
  return labels[status] || 'Unknown';
};

// Validate email
export const isValidEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Validate phone number
export const isValidPhone = (phone: string): boolean => {
  const re = /^[0-9]{10,15}$/;
  return re.test(phone.replace(/\s/g, ''));
};

// Debounce function
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Get relative time
export const getRelativeTime = (date: string | Date): string => {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 30) {
    return formatDate(date, 'short');
  }
  if (diffDays > 1) {
    return `${diffDays} days ago`;
  }
  if (diffDays === 1) {
    return 'Yesterday';
  }
  if (diffHours > 1) {
    return `${diffHours} hours ago`;
  }
  if (diffHours === 1) {
    return '1 hour ago';
  }
  if (diffMins > 1) {
    return `${diffMins} minutes ago`;
  }
  return 'Just now';
};

// Number to words
export const numberToWords = (num: number): string => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (num === 0) return 'Zero';
  if (num < 0) return 'Minus ' + numberToWords(-num);

  let words = '';

  if (Math.floor(num / 10000000) > 0) {
    words += numberToWords(Math.floor(num / 10000000)) + ' Crore ';
    num %= 10000000;
  }

  if (Math.floor(num / 100000) > 0) {
    words += numberToWords(Math.floor(num / 100000)) + ' Lakh ';
    num %= 100000;
  }

  if (Math.floor(num / 1000) > 0) {
    words += numberToWords(Math.floor(num / 1000)) + ' Thousand ';
    num %= 1000;
  }

  if (Math.floor(num / 100) > 0) {
    words += numberToWords(Math.floor(num / 100)) + ' Hundred ';
    num %= 100;
  }

  if (num > 0) {
    if (words !== '') words += 'and ';
    if (num < 20) {
      words += ones[num];
    } else {
      words += tens[Math.floor(num / 10)];
      if (num % 10 > 0) {
        words += '-' + ones[num % 10];
      }
    }
  }

  return words.trim();
};
