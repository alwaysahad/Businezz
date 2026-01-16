// Generate unique ID
export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Format currency
export const formatCurrency = (amount, currency = '₹') => {
  const num = parseFloat(amount) || 0;
  return `${currency}${num.toLocaleString('en-IN', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
};

// Format date
export const formatDate = (date, format = 'short') => {
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

// Calculate invoice totals
export const calculateInvoiceTotals = (items, taxRate = 0, discount = 0) => {
  const subtotal = items.reduce((sum, item) => {
    return sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0);
  }, 0);
  
  const discountAmount = (subtotal * (parseFloat(discount) || 0)) / 100;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = (taxableAmount * (parseFloat(taxRate) || 0)) / 100;
  const total = taxableAmount + taxAmount;
  
  return {
    subtotal,
    discountAmount,
    taxableAmount,
    taxAmount,
    total,
  };
};

// Get invoice status color
export const getStatusColor = (status) => {
  const colors = {
    draft: 'bg-midnight-600 text-midnight-200',
    pending: 'bg-gold-500/20 text-gold-400',
    paid: 'bg-teal-500/20 text-teal-400',
    overdue: 'bg-coral-500/20 text-coral-400',
    cancelled: 'bg-midnight-700 text-midnight-400',
  };
  return colors[status] || colors.draft;
};

// Get invoice status label
export const getStatusLabel = (status) => {
  const labels = {
    draft: 'Draft',
    pending: 'Pending',
    paid: 'Paid',
    overdue: 'Overdue',
    cancelled: 'Cancelled',
  };
  return labels[status] || 'Unknown';
};

// Validate email
export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Validate phone number
export const isValidPhone = (phone) => {
  const re = /^[0-9]{10,15}$/;
  return re.test(phone.replace(/\s/g, ''));
};

// Format phone number for WhatsApp
export const formatPhoneForWhatsApp = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `91${cleaned}`;
  }
  return cleaned;
};

// Generate WhatsApp share link
export const generateWhatsAppLink = (phone, message) => {
  const formattedPhone = formatPhoneForWhatsApp(phone);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Get relative time
export const getRelativeTime = (date) => {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
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
export const numberToWords = (num) => {
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
