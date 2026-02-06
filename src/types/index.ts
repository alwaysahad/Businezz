// Invoice Types
export interface InvoiceItem {
  id: string;
  name: string;
  quantity: number | '';
  unit?: string;
  price: number | '';
  discount?: number | ''; // Percentage (0-100)
  taxRate?: number | ''; // Percentage (0-100)
}

export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  items: InvoiceItem[];
  taxRate: number;
  discount: number;
  notes: string;
  status: InvoiceStatus;
  createdAt?: string;
  updatedAt?: string;
  user_id?: string;
}

// Customer Types
export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

// Product Types
export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  unit?: string;
  taxRate?: number; // GST/Tax percentage (0-100)
}

// Business Profile Types
export interface Business {
  id?: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  taxId: string;
  logo: string | null;
  signature: string | null;
  currency: string;
  taxRate: number;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  branchName?: string;
}

// Settings Types
export interface Settings {
  id?: string;
  currency: string;
  taxRate: number;
  invoicePrefix: string;
  defaultPaymentTerms: string;
  showLogo: boolean;
  taxLabel: string;
}

// Invoice Totals
export interface InvoiceTotals {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  roundOff: number;
  total: number;
}

// Date Format Types
export type DateFormat = 'short' | 'long' | 'input';

// Database Tables
export interface Tables {
  INVOICES: string;
  CUSTOMERS: string;
  PRODUCTS: string;
  BUSINESS: string;
  SETTINGS: string;
}

// Form Errors
export interface FormErrors {
  [key: string]: string | null | undefined;
}

// Navigation Item
export interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Status Option
export interface StatusOption {
  value: InvoiceStatus;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

// Stats
export interface DashboardStats {
  totalInvoices: number;
  totalRevenue: number;
  pendingAmount: number;
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
  thisMonthRevenue: number;
}

export interface InvoiceStats {
  total: number;
  draft: number;
  pending: number;
  paid: number;
  overdue: number;
}

// Product Form Data
export interface ProductFormData {
  name: string;
  description: string;
  price: string;
  unit: string;
  taxRate: string;
}

// Customer Form Data
export interface CustomerFormData {
  name: string;
  phone: string;
  email: string;
  address: string;
}
