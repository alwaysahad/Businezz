// ============================================
// STORAGE UTILITIES
// This file exports both sync (localStorage) and async (database) methods
// ============================================

import { invoiceDB, customerDB, productDB, businessDB, settingsDB, isSupabaseConfigured } from '../lib/database';

// Local Storage Keys
const STORAGE_KEYS = {
  INVOICES: 'invoiceflow_invoices',
  BUSINESS: 'invoiceflow_business',
  SETTINGS: 'invoiceflow_settings',
  CUSTOMERS: 'invoiceflow_customers',
  PRODUCTS: 'invoiceflow_products',
};

// Generic storage helpers
export const storage = {
  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error reading from storage: ${key}`, error);
      return null;
    }
  },
  
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing to storage: ${key}`, error);
      return false;
    }
  },
  
  remove: (key) => {
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
  getAll: () => storage.get(STORAGE_KEYS.INVOICES) || [],
  
  getById: (id) => {
    const invoices = invoiceStorage.getAll();
    return invoices.find(inv => inv.id === id) || null;
  },
  
  save: (invoice) => {
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
    
    const result = storage.set(STORAGE_KEYS.INVOICES, invoices);
    
    if (isSupabaseConfigured) {
      invoiceDB.save(invoice).catch(console.error);
    }
    
    return result;
  },
  
  delete: (id) => {
    const invoices = invoiceStorage.getAll().filter(inv => inv.id !== id);
    const result = storage.set(STORAGE_KEYS.INVOICES, invoices);
    
    if (isSupabaseConfigured) {
      invoiceDB.delete(id).catch(console.error);
    }
    
    return result;
  },
  
  getNextInvoiceNumber: () => {
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
  
  fetchAll: () => invoiceDB.getAll(),
};

// ============================================
// BUSINESS PROFILE STORAGE
// ============================================
export const businessStorage = {
  get: () => storage.get(STORAGE_KEYS.BUSINESS) || {
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
  
  save: (business) => {
    const result = storage.set(STORAGE_KEYS.BUSINESS, business);
    
    if (isSupabaseConfigured) {
      businessDB.save(business).catch(console.error);
    }
    
    return result;
  },
  
  fetch: () => businessDB.get(),
};

// ============================================
// CUSTOMER STORAGE
// ============================================
export const customerStorage = {
  getAll: () => storage.get(STORAGE_KEYS.CUSTOMERS) || [],
  
  save: (customer) => {
    const customers = customerStorage.getAll();
    const existingIndex = customers.findIndex(c => c.id === customer.id);
    
    if (existingIndex >= 0) {
      customers[existingIndex] = customer;
    } else {
      customers.push(customer);
    }
    
    const result = storage.set(STORAGE_KEYS.CUSTOMERS, customers);
    
    if (isSupabaseConfigured) {
      customerDB.save(customer).catch(console.error);
    }
    
    return result;
  },
  
  delete: (id) => {
    const customers = customerStorage.getAll().filter(c => c.id !== id);
    const result = storage.set(STORAGE_KEYS.CUSTOMERS, customers);
    
    if (isSupabaseConfigured) {
      customerDB.delete(id).catch(console.error);
    }
    
    return result;
  },
  
  fetchAll: () => customerDB.getAll(),
};

// ============================================
// PRODUCT STORAGE
// ============================================
export const productStorage = {
  getAll: () => storage.get(STORAGE_KEYS.PRODUCTS) || [],
  
  save: (product) => {
    const products = productStorage.getAll();
    const existingIndex = products.findIndex(p => p.id === product.id);
    
    if (existingIndex >= 0) {
      products[existingIndex] = product;
    } else {
      products.push(product);
    }
    
    const result = storage.set(STORAGE_KEYS.PRODUCTS, products);
    
    if (isSupabaseConfigured) {
      productDB.save(product).catch(console.error);
    }
    
    return result;
  },
  
  delete: (id) => {
    const products = productStorage.getAll().filter(p => p.id !== id);
    const result = storage.set(STORAGE_KEYS.PRODUCTS, products);
    
    if (isSupabaseConfigured) {
      productDB.delete(id).catch(console.error);
    }
    
    return result;
  },
  
  fetchAll: () => productDB.getAll(),
};

// ============================================
// SETTINGS STORAGE
// ============================================
export const settingsStorage = {
  get: () => storage.get(STORAGE_KEYS.SETTINGS) || {
    currency: '₹',
    taxRate: 18,
    invoicePrefix: 'INV',
    defaultPaymentTerms: 'Due on receipt',
    showLogo: true,
    taxLabel: 'GST',
  },
  
  save: (settings) => {
    const result = storage.set(STORAGE_KEYS.SETTINGS, settings);
    
    if (isSupabaseConfigured) {
      settingsDB.save(settings).catch(console.error);
    }
    
    return result;
  },
  
  fetch: () => settingsDB.get(),
};

// ============================================
// DATA SYNC UTILITIES
// ============================================
export const syncData = {
  async pullFromCloud() {
    if (!isSupabaseConfigured) return;
    
    try {
      const [invoices, customers, products, business, settings] = await Promise.all([
        invoiceStorage.fetchAll(),
        customerStorage.fetchAll(),
        productStorage.fetchAll(),
        businessStorage.fetch(),
        settingsStorage.fetch(),
      ]);
      
      if (invoices.length) storage.set(STORAGE_KEYS.INVOICES, invoices);
      if (customers.length) storage.set(STORAGE_KEYS.CUSTOMERS, customers);
      if (products.length) storage.set(STORAGE_KEYS.PRODUCTS, products);
      if (business) storage.set(STORAGE_KEYS.BUSINESS, business);
      if (settings) storage.set(STORAGE_KEYS.SETTINGS, settings);
      
      console.log('Data synced from cloud');
      return true;
    } catch (error) {
      console.error('Failed to sync from cloud:', error);
      return false;
    }
  },
  
  isCloudEnabled: () => isSupabaseConfigured,
};

export { isSupabaseConfigured };
