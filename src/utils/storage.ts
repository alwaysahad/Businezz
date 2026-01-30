// ============================================
// STORAGE UTILITIES - Local + Cloud Sync
// ============================================

import type { Invoice, Customer, Product, Business, Settings } from '../types';
import { isSupabaseConfigured, syncToCloud, syncFromCloud } from '../lib/database';

// Re-export for convenience
export { isSupabaseConfigured };

// Local Storage Keys
const STORAGE_KEYS = {
  INVOICES: 'invoiceflow_invoices',
  BUSINESS: 'invoiceflow_business',
  SETTINGS: 'invoiceflow_settings',
  CUSTOMERS: 'invoiceflow_customers',
  PRODUCTS: 'invoiceflow_products',
} as const;

// Generic storage helpers
export const storage = {
  get: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error reading from storage: ${key}`, error);
      return null;
    }
  },
  
  set: <T>(key: string, value: T): boolean => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing to storage: ${key}`, error);
      return false;
    }
  },
  
  remove: (key: string): boolean => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing from storage: ${key}`, error);
      return false;
    }
  },
};

// ============================================
// INVOICE STORAGE
// ============================================
export const invoiceStorage = {
  getAll: (): Invoice[] => storage.get<Invoice[]>(STORAGE_KEYS.INVOICES) || [],
  
  getById: (id: string): Invoice | null => {
    const invoices = invoiceStorage.getAll();
    return invoices.find(inv => inv.id === id) || null;
  },
  
  save: (invoice: Invoice): boolean => {
    const invoices = invoiceStorage.getAll();
    const existingIndex = invoices.findIndex(inv => inv.id === invoice.id);
    
    const now = new Date().toISOString();
    if (existingIndex >= 0) {
      invoices[existingIndex] = { ...invoice, updatedAt: now };
    } else {
      invoices.push({
        ...invoice,
        createdAt: now,
        updatedAt: now,
      });
    }
    
    return storage.set(STORAGE_KEYS.INVOICES, invoices);
  },
  
  delete: (id: string): boolean => {
    const invoices = invoiceStorage.getAll().filter(inv => inv.id !== id);
    return storage.set(STORAGE_KEYS.INVOICES, invoices);
  },
  
  getNextInvoiceNumber: (): string => {
    const settings = settingsStorage.get();
    const prefix = settings.invoicePrefix || 'INV';
    const invoices = invoiceStorage.getAll();
    const currentYear = new Date().getFullYear();
    const yearInvoices = invoices.filter(inv => 
      inv.invoiceNumber && inv.invoiceNumber.startsWith(`${prefix}-${currentYear}`)
    );
    const nextNum = yearInvoices.length + 1;
    return `${prefix}-${currentYear}-${String(nextNum).padStart(4, '0')}`;
  },
};

// ============================================
// BUSINESS PROFILE STORAGE
// ============================================
export const businessStorage = {
  get: (): Business => storage.get<Business>(STORAGE_KEYS.BUSINESS) || {
    name: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    email: '',
    taxId: '',
    logo: null,
    currency: '₹',
    taxRate: 18,
  },
  
  save: (business: Business): boolean => {
    return storage.set(STORAGE_KEYS.BUSINESS, business);
  },
};

// ============================================
// CUSTOMER STORAGE
// ============================================
export const customerStorage = {
  getAll: (): Customer[] => storage.get<Customer[]>(STORAGE_KEYS.CUSTOMERS) || [],
  
  save: (customer: Customer): boolean => {
    const customers = customerStorage.getAll();
    const existingIndex = customers.findIndex(c => c.id === customer.id);
    
    if (existingIndex >= 0) {
      customers[existingIndex] = customer;
    } else {
      customers.push(customer);
    }
    
    return storage.set(STORAGE_KEYS.CUSTOMERS, customers);
  },
  
  delete: (id: string): boolean => {
    const customers = customerStorage.getAll().filter(c => c.id !== id);
    return storage.set(STORAGE_KEYS.CUSTOMERS, customers);
  },
};

// ============================================
// PRODUCT STORAGE
// ============================================
export const productStorage = {
  getAll: (): Product[] => storage.get<Product[]>(STORAGE_KEYS.PRODUCTS) || [],
  
  save: (product: Product): boolean => {
    const products = productStorage.getAll();
    const existingIndex = products.findIndex(p => p.id === product.id);
    
    if (existingIndex >= 0) {
      products[existingIndex] = product;
    } else {
      products.push(product);
    }
    
    return storage.set(STORAGE_KEYS.PRODUCTS, products);
  },
  
  delete: (id: string): boolean => {
    const products = productStorage.getAll().filter(p => p.id !== id);
    return storage.set(STORAGE_KEYS.PRODUCTS, products);
  },
};

// ============================================
// SETTINGS STORAGE
// ============================================
export const settingsStorage = {
  get: (): Settings => storage.get<Settings>(STORAGE_KEYS.SETTINGS) || {
    currency: '₹',
    taxRate: 18,
    invoicePrefix: 'INV',
    defaultPaymentTerms: 'Due on receipt',
    showLogo: true,
    taxLabel: 'GST',
  },
  
  save: (settings: Settings): boolean => {
    return storage.set(STORAGE_KEYS.SETTINGS, settings);
  },
};
