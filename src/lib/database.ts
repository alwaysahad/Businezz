import { supabase, isSupabaseConfigured, TABLES } from './supabase';
import type { Invoice, Customer, Product, Business, Settings } from '../types';

// ============================================
// DATABASE SERVICE - Cloud Sync Operations
// ============================================

// Invoices
export const invoiceDB = {
  async getAll(): Promise<Invoice[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from(TABLES.INVOICES)
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapFromDB);
  },

  async getById(id: string): Promise<Invoice | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from(TABLES.INVOICES)
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data ? mapFromDB(data) : null;
  },

  async save(invoice: Invoice): Promise<Invoice> {
    if (!supabase) throw new Error('Database not configured');
    const dbInvoice = mapToDB(invoice);
    const { data, error } = await supabase
      .from(TABLES.INVOICES)
      .upsert(dbInvoice, { onConflict: 'id' })
      .select()
      .single();
    if (error) throw error;
    return mapFromDB(data);
  },

  async delete(id: string): Promise<void> {
    if (!supabase) throw new Error('Database not configured');
    const { error } = await supabase
      .from(TABLES.INVOICES)
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};

// Customers
export const customerDB = {
  async getAll(): Promise<Customer[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from(TABLES.CUSTOMERS)
      .select('*')
      .order('name');
    if (error) throw error;
    return data || [];
  },

  async save(customer: Customer): Promise<Customer> {
    if (!supabase) throw new Error('Database not configured');
    const { data, error } = await supabase
      .from(TABLES.CUSTOMERS)
      .upsert(customer, { onConflict: 'id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    if (!supabase) throw new Error('Database not configured');
    const { error } = await supabase
      .from(TABLES.CUSTOMERS)
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};

// Products
export const productDB = {
  async getAll(): Promise<Product[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from(TABLES.PRODUCTS)
      .select('*')
      .order('name');
    if (error) throw error;
    return data || [];
  },

  async save(product: Product): Promise<Product> {
    if (!supabase) throw new Error('Database not configured');
    const { data, error } = await supabase
      .from(TABLES.PRODUCTS)
      .upsert(product, { onConflict: 'id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    if (!supabase) throw new Error('Database not configured');
    const { error } = await supabase
      .from(TABLES.PRODUCTS)
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};

// Business Profile
export const businessDB = {
  async get(): Promise<Business | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from(TABLES.BUSINESS)
      .select('*')
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async save(business: Business): Promise<Business> {
    if (!supabase) throw new Error('Database not configured');
    const existingBusiness = await businessDB.get();
    const businessWithId = { ...business, id: existingBusiness?.id || business.id || 'default' };
    const { data, error } = await supabase
      .from(TABLES.BUSINESS)
      .upsert(businessWithId, { onConflict: 'id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// Settings
export const settingsDB = {
  async get(): Promise<Settings | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from(TABLES.SETTINGS)
      .select('*')
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async save(settings: Settings): Promise<Settings> {
    if (!supabase) throw new Error('Database not configured');
    const existingSettings = await settingsDB.get();
    const settingsWithId = { ...settings, id: existingSettings?.id || settings.id || 'default' };
    const { data, error } = await supabase
      .from(TABLES.SETTINGS)
      .upsert(settingsWithId, { onConflict: 'id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// ============================================
// SYNC FUNCTIONS
// ============================================

// Sync all local data to cloud
export async function syncToCloud(localData: {
  invoices: Invoice[];
  customers: Customer[];
  products: Product[];
  business: Business;
  settings: Settings;
}): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, message: 'Supabase not configured' };
  }

  try {
    // Sync invoices
    for (const invoice of localData.invoices) {
      await invoiceDB.save(invoice);
    }

    // Sync customers
    for (const customer of localData.customers) {
      await customerDB.save(customer);
    }

    // Sync products
    for (const product of localData.products) {
      await productDB.save(product);
    }

    // Sync business
    if (localData.business.name) {
      await businessDB.save(localData.business);
    }

    // Sync settings
    await settingsDB.save(localData.settings);

    return { success: true, message: 'All data synced to cloud successfully!' };
  } catch (error) {
    console.error('Sync to cloud failed:', error);
    return { success: false, message: `Sync failed: ${(error as Error).message}` };
  }
}

// Sync from cloud to local
export async function syncFromCloud(): Promise<{
  success: boolean;
  message: string;
  data?: {
    invoices: Invoice[];
    customers: Customer[];
    products: Product[];
    business: Business | null;
    settings: Settings | null;
  };
}> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, message: 'Supabase not configured' };
  }

  try {
    const [invoices, customers, products, business, settings] = await Promise.all([
      invoiceDB.getAll(),
      customerDB.getAll(),
      productDB.getAll(),
      businessDB.get(),
      settingsDB.get(),
    ]);

    return {
      success: true,
      message: 'Data fetched from cloud successfully!',
      data: { invoices, customers, products, business, settings },
    };
  } catch (error) {
    console.error('Sync from cloud failed:', error);
    return { success: false, message: `Sync failed: ${(error as Error).message}` };
  }
}

// ============================================
// DATA MAPPING HELPERS
// ============================================

// Map database record to Invoice type
function mapFromDB(data: Record<string, unknown>): Invoice {
  return {
    id: data.id as string,
    invoiceNumber: data.invoice_number as string,
    date: data.date as string,
    customerName: data.customer_name as string,
    customerEmail: data.customer_email as string,
    customerPhone: data.customer_phone as string,
    customerAddress: data.customer_address as string,
    items: (data.items as InvoiceItem[]) || [],
    taxRate: data.tax_rate as number,
    discount: data.discount as number,
    notes: data.notes as string,
    status: data.status as Invoice['status'],
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}

// Map Invoice to database record
function mapToDB(invoice: Invoice): Record<string, unknown> {
  return {
    id: invoice.id,
    invoice_number: invoice.invoiceNumber,
    date: invoice.date,
    customer_name: invoice.customerName,
    customer_email: invoice.customerEmail,
    customer_phone: invoice.customerPhone,
    customer_address: invoice.customerAddress,
    items: invoice.items,
    tax_rate: invoice.taxRate,
    discount: invoice.discount,
    notes: invoice.notes,
    status: invoice.status,
    created_at: invoice.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// Re-export for convenience
export { isSupabaseConfigured };

// Missing type for mapFromDB
interface InvoiceItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}
