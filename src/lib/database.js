import { supabase, isSupabaseConfigured, TABLES } from './supabase';

// Local Storage Keys (fallback)
const STORAGE_KEYS = {
  INVOICES: 'invoiceflow_invoices',
  BUSINESS: 'invoiceflow_business',
  SETTINGS: 'invoiceflow_settings',
  CUSTOMERS: 'invoiceflow_customers',
  PRODUCTS: 'invoiceflow_products',
};

// Generic localStorage helpers
const localStorageHelper = {
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
};

// ============================================
// INVOICE OPERATIONS
// ============================================
export const invoiceDB = {
  async getAll() {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from(TABLES.INVOICES)
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data.map(transformFromDB);
      } catch (error) {
        console.error('Supabase error, falling back to localStorage:', error);
      }
    }
    return localStorageHelper.get(STORAGE_KEYS.INVOICES) || [];
  },

  async getById(id) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from(TABLES.INVOICES)
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        return transformFromDB(data);
      } catch (error) {
        console.error('Supabase error, falling back to localStorage:', error);
      }
    }
    const invoices = localStorageHelper.get(STORAGE_KEYS.INVOICES) || [];
    return invoices.find(inv => inv.id === id) || null;
  },

  async save(invoice) {
    const now = new Date().toISOString();
    
    if (isSupabaseConfigured && supabase) {
      try {
        const dbInvoice = transformToDB({
          ...invoice,
          updatedAt: now,
          createdAt: invoice.createdAt || now,
        });

        const { data, error } = await supabase
          .from(TABLES.INVOICES)
          .upsert(dbInvoice, { onConflict: 'id' })
          .select()
          .single();
        
        if (error) throw error;
        syncToLocalStorage(STORAGE_KEYS.INVOICES, transformFromDB(data));
        return true;
      } catch (error) {
        console.error('Supabase error, falling back to localStorage:', error);
      }
    }
    
    const invoices = localStorageHelper.get(STORAGE_KEYS.INVOICES) || [];
    const existingIndex = invoices.findIndex(inv => inv.id === invoice.id);
    
    if (existingIndex >= 0) {
      invoices[existingIndex] = { ...invoice, updatedAt: now };
    } else {
      invoices.push({ ...invoice, createdAt: now, updatedAt: now });
    }
    
    return localStorageHelper.set(STORAGE_KEYS.INVOICES, invoices);
  },

  async delete(id) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from(TABLES.INVOICES).delete().eq('id', id);
        if (error) throw error;
        
        const invoices = (localStorageHelper.get(STORAGE_KEYS.INVOICES) || []).filter(inv => inv.id !== id);
        localStorageHelper.set(STORAGE_KEYS.INVOICES, invoices);
        return true;
      } catch (error) {
        console.error('Supabase error, falling back to localStorage:', error);
      }
    }
    
    const invoices = (localStorageHelper.get(STORAGE_KEYS.INVOICES) || []).filter(inv => inv.id !== id);
    return localStorageHelper.set(STORAGE_KEYS.INVOICES, invoices);
  },

  getNextInvoiceNumber() {
    const invoices = localStorageHelper.get(STORAGE_KEYS.INVOICES) || [];
    const currentYear = new Date().getFullYear();
    const yearInvoices = invoices.filter(inv => 
      inv.invoiceNumber && inv.invoiceNumber.startsWith(`INV-${currentYear}`)
    );
    const nextNum = yearInvoices.length + 1;
    return `INV-${currentYear}-${String(nextNum).padStart(4, '0')}`;
  },
};

// ============================================
// CUSTOMER OPERATIONS
// ============================================
export const customerDB = {
  async getAll() {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from(TABLES.CUSTOMERS).select('*').order('name');
        if (error) throw error;
        return data.map(transformFromDB);
      } catch (error) {
        console.error('Supabase error, falling back to localStorage:', error);
      }
    }
    return localStorageHelper.get(STORAGE_KEYS.CUSTOMERS) || [];
  },

  async save(customer) {
    if (isSupabaseConfigured && supabase) {
      try {
        const dbCustomer = transformToDB(customer);
        const { error } = await supabase.from(TABLES.CUSTOMERS).upsert(dbCustomer, { onConflict: 'id' });
        if (error) throw error;
        syncToLocalStorage(STORAGE_KEYS.CUSTOMERS, customer);
        return true;
      } catch (error) {
        console.error('Supabase error, falling back to localStorage:', error);
      }
    }
    
    const customers = localStorageHelper.get(STORAGE_KEYS.CUSTOMERS) || [];
    const existingIndex = customers.findIndex(c => c.id === customer.id);
    if (existingIndex >= 0) {
      customers[existingIndex] = customer;
    } else {
      customers.push(customer);
    }
    return localStorageHelper.set(STORAGE_KEYS.CUSTOMERS, customers);
  },

  async delete(id) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from(TABLES.CUSTOMERS).delete().eq('id', id);
        if (error) throw error;
        const customers = (localStorageHelper.get(STORAGE_KEYS.CUSTOMERS) || []).filter(c => c.id !== id);
        localStorageHelper.set(STORAGE_KEYS.CUSTOMERS, customers);
        return true;
      } catch (error) {
        console.error('Supabase error, falling back to localStorage:', error);
      }
    }
    
    const customers = (localStorageHelper.get(STORAGE_KEYS.CUSTOMERS) || []).filter(c => c.id !== id);
    return localStorageHelper.set(STORAGE_KEYS.CUSTOMERS, customers);
  },
};

// ============================================
// PRODUCT OPERATIONS
// ============================================
export const productDB = {
  async getAll() {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from(TABLES.PRODUCTS).select('*').order('name');
        if (error) throw error;
        return data.map(transformFromDB);
      } catch (error) {
        console.error('Supabase error, falling back to localStorage:', error);
      }
    }
    return localStorageHelper.get(STORAGE_KEYS.PRODUCTS) || [];
  },

  async save(product) {
    if (isSupabaseConfigured && supabase) {
      try {
        const dbProduct = transformToDB(product);
        const { error } = await supabase.from(TABLES.PRODUCTS).upsert(dbProduct, { onConflict: 'id' });
        if (error) throw error;
        syncToLocalStorage(STORAGE_KEYS.PRODUCTS, product);
        return true;
      } catch (error) {
        console.error('Supabase error, falling back to localStorage:', error);
      }
    }
    
    const products = localStorageHelper.get(STORAGE_KEYS.PRODUCTS) || [];
    const existingIndex = products.findIndex(p => p.id === product.id);
    if (existingIndex >= 0) {
      products[existingIndex] = product;
    } else {
      products.push(product);
    }
    return localStorageHelper.set(STORAGE_KEYS.PRODUCTS, products);
  },

  async delete(id) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from(TABLES.PRODUCTS).delete().eq('id', id);
        if (error) throw error;
        const products = (localStorageHelper.get(STORAGE_KEYS.PRODUCTS) || []).filter(p => p.id !== id);
        localStorageHelper.set(STORAGE_KEYS.PRODUCTS, products);
        return true;
      } catch (error) {
        console.error('Supabase error, falling back to localStorage:', error);
      }
    }
    
    const products = (localStorageHelper.get(STORAGE_KEYS.PRODUCTS) || []).filter(p => p.id !== id);
    return localStorageHelper.set(STORAGE_KEYS.PRODUCTS, products);
  },
};

// ============================================
// BUSINESS PROFILE OPERATIONS
// ============================================
export const businessDB = {
  async get() {
    const defaultBusiness = {
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
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from(TABLES.BUSINESS).select('*').limit(1).single();
        if (error && error.code !== 'PGRST116') throw error;
        if (data) return transformFromDB(data);
      } catch (error) {
        console.error('Supabase error, falling back to localStorage:', error);
      }
    }
    
    return localStorageHelper.get(STORAGE_KEYS.BUSINESS) || defaultBusiness;
  },

  async save(business) {
    if (isSupabaseConfigured && supabase) {
      try {
        const dbBusiness = transformToDB({ ...business, id: business.id || 'default' });
        const { error } = await supabase.from(TABLES.BUSINESS).upsert(dbBusiness, { onConflict: 'id' });
        if (error) throw error;
        localStorageHelper.set(STORAGE_KEYS.BUSINESS, business);
        return true;
      } catch (error) {
        console.error('Supabase error, falling back to localStorage:', error);
      }
    }
    
    return localStorageHelper.set(STORAGE_KEYS.BUSINESS, business);
  },
};

// ============================================
// SETTINGS OPERATIONS
// ============================================
export const settingsDB = {
  async get() {
    const defaultSettings = {
      currency: '₹',
      taxRate: 18,
      invoicePrefix: 'INV',
      defaultPaymentTerms: 'Due on receipt',
      showLogo: true,
      taxLabel: 'Tax',
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from(TABLES.SETTINGS).select('*').limit(1).single();
        if (error && error.code !== 'PGRST116') throw error;
        if (data) return transformFromDB(data);
      } catch (error) {
        console.error('Supabase error, falling back to localStorage:', error);
      }
    }
    
    return localStorageHelper.get(STORAGE_KEYS.SETTINGS) || defaultSettings;
  },

  async save(settings) {
    if (isSupabaseConfigured && supabase) {
      try {
        const dbSettings = transformToDB({ ...settings, id: settings.id || 'default' });
        const { error } = await supabase.from(TABLES.SETTINGS).upsert(dbSettings, { onConflict: 'id' });
        if (error) throw error;
        localStorageHelper.set(STORAGE_KEYS.SETTINGS, settings);
        return true;
      } catch (error) {
        console.error('Supabase error, falling back to localStorage:', error);
      }
    }
    
    return localStorageHelper.set(STORAGE_KEYS.SETTINGS, settings);
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function transformToDB(obj) {
  const transformed = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    transformed[snakeKey] = value;
  }
  return transformed;
}

function transformFromDB(obj) {
  if (!obj) return obj;
  const transformed = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    transformed[camelKey] = value;
  }
  return transformed;
}

function syncToLocalStorage(key, item) {
  const items = localStorageHelper.get(key) || [];
  const existingIndex = items.findIndex(i => i.id === item.id);
  if (existingIndex >= 0) {
    items[existingIndex] = item;
  } else {
    items.push(item);
  }
  localStorageHelper.set(key, items);
}

// ============================================
// DATA MIGRATION
// ============================================
export async function migrateLocalToSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    console.log('Supabase not configured, skipping migration');
    return;
  }

  console.log('Starting data migration to Supabase...');

  try {
    const business = localStorageHelper.get(STORAGE_KEYS.BUSINESS);
    if (business) {
      await businessDB.save(business);
      console.log('Business profile migrated');
    }

    const settings = localStorageHelper.get(STORAGE_KEYS.SETTINGS);
    if (settings) {
      await settingsDB.save(settings);
      console.log('Settings migrated');
    }

    const customers = localStorageHelper.get(STORAGE_KEYS.CUSTOMERS) || [];
    for (const customer of customers) {
      await customerDB.save(customer);
    }
    console.log(`${customers.length} customers migrated`);

    const products = localStorageHelper.get(STORAGE_KEYS.PRODUCTS) || [];
    for (const product of products) {
      await productDB.save(product);
    }
    console.log(`${products.length} products migrated`);

    const invoices = localStorageHelper.get(STORAGE_KEYS.INVOICES) || [];
    for (const invoice of invoices) {
      await invoiceDB.save(invoice);
    }
    console.log(`${invoices.length} invoices migrated`);

    console.log('Migration complete!');
    return true;
  } catch (error) {
    console.error('Migration failed:', error);
    return false;
  }
}

export { isSupabaseConfigured };
