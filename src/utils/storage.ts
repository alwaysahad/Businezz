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

// ============================================
// CLOUD SYNC FUNCTIONS
// ============================================

// Check if cloud sync is available
function isCloudAvailable(): boolean {
  return isSupabaseConfigured;
}

// Upload all local data to cloud
async function uploadToCloud(): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured) {
    return { success: false, message: 'Cloud sync not configured. Please add Supabase credentials.' };
  }
  
  const localData = {
    invoices: invoiceStorage.getAll(),
    customers: customerStorage.getAll(),
    products: productStorage.getAll(),
    business: businessStorage.get(),
    settings: settingsStorage.get(),
  };
  
  return syncToCloud(localData);
}

// Download data from cloud and merge with local
async function downloadFromCloud(): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured) {
    return { success: false, message: 'Cloud sync not configured. Please add Supabase credentials.' };
  }
  
  const result = await syncFromCloud();
  
  if (!result.success || !result.data) {
    return { success: false, message: result.message };
  }
  
  const { data } = result;
  
  // Merge cloud data with local (cloud takes priority for conflicts)
  const localInvoices = invoiceStorage.getAll();
  const mergedInvoices = mergeData(localInvoices, data.invoices);
  storage.set(STORAGE_KEYS.INVOICES, mergedInvoices);
  
  const localCustomers = customerStorage.getAll();
  const mergedCustomers = mergeData(localCustomers, data.customers);
  storage.set(STORAGE_KEYS.CUSTOMERS, mergedCustomers);
  
  const localProducts = productStorage.getAll();
  const mergedProducts = mergeData(localProducts, data.products);
  storage.set(STORAGE_KEYS.PRODUCTS, mergedProducts);
  
  if (data.business) {
    storage.set(STORAGE_KEYS.BUSINESS, data.business);
  }
  
  if (data.settings) {
    storage.set(STORAGE_KEYS.SETTINGS, data.settings);
  }
  
  return { success: true, message: `Synced! ${mergedInvoices.length} invoices, ${mergedCustomers.length} customers, ${mergedProducts.length} products.` };
}

// Full two-way sync
async function fullSync(): Promise<{ success: boolean; message: string }> {
  // First download from cloud
  const downloadResult = await downloadFromCloud();
  if (!downloadResult.success) {
    return downloadResult;
  }
  
  // Then upload to cloud
  const uploadResult = await uploadToCloud();
  if (!uploadResult.success) {
    return uploadResult;
  }
  
  return { success: true, message: 'Two-way sync completed successfully!' };
}

// Export as object for convenience
export const cloudSync = {
  isAvailable: isCloudAvailable,
  uploadToCloud,
  downloadFromCloud,
  fullSync,
};

// Helper function to merge two arrays by ID (cloud data takes priority)
function mergeData<T extends { id: string; updatedAt?: string }>(local: T[], cloud: T[]): T[] {
  const merged = new Map<string, T>();
  
  // Add local items first
  for (const item of local) {
    merged.set(item.id, item);
  }
  
  // Override with cloud items (cloud takes priority)
  for (const item of cloud) {
    const existing = merged.get(item.id);
    if (!existing) {
      merged.set(item.id, item);
    } else {
      // Compare updated timestamps if available
      const existingTime = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
      const cloudTime = item.updatedAt ? new Date(item.updatedAt).getTime() : 0;
      if (cloudTime >= existingTime) {
        merged.set(item.id, item);
      }
    }
  }
  
  return Array.from(merged.values());
}
