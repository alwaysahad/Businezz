import { supabase, isSupabaseConfigured, TABLES } from './supabase';
import type { Invoice, Customer, Product, Business, Settings } from '../types';

// ============================================
// HELPER FUNCTIONS
// ============================================

// Get current user ID
async function getCurrentUserId(): Promise<string | null> {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}

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
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const dbInvoice = { ...mapToDB(invoice), user_id: userId };
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
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const customerWithUserId = { ...customer, user_id: userId };
    const { data, error } = await supabase
      .from(TABLES.CUSTOMERS)
      .upsert(customerWithUserId, { onConflict: 'id' })
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
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const productWithUserId = { ...product, user_id: userId };
    const { data, error } = await supabase
      .from(TABLES.PRODUCTS)
      .upsert(productWithUserId, { onConflict: 'id' })
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
    return data ? mapBusinessFromDB(data) : null;
  },

  async save(business: Business): Promise<Business> {
    if (!supabase) throw new Error('Database not configured');
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const dbBusiness = {
      ...mapBusinessToDB(business),
      user_id: userId
    };

    const { data, error } = await supabase
      .from(TABLES.BUSINESS)
      .upsert(dbBusiness, { onConflict: 'user_id' })
      .select()
      .single();
    if (error) throw error;
    return mapBusinessFromDB(data);
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
    return data ? mapSettingsFromDB(data) : null;
  },

  async save(settings: Settings): Promise<Settings> {
    if (!supabase) throw new Error('Database not configured');
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const dbSettings = {
      ...mapSettingsToDB(settings),
      user_id: userId
    };

    const { data, error } = await supabase
      .from(TABLES.SETTINGS)
      .upsert(dbSettings, { onConflict: 'user_id' })
      .select()
      .single();
    if (error) throw error;
    return mapSettingsFromDB(data);
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

// Map database record to Business type
function mapBusinessFromDB(data: Record<string, unknown>): Business {
  return {
    id: data.id as string,
    name: data.name as string,
    address: data.address as string,
    city: data.city as string,
    state: data.state as string,
    pincode: data.pincode as string,
    phone: data.phone as string,
    email: data.email as string,
    taxId: data.tax_id as string,
    logo: data.logo as string | null,
    currency: data.currency as string,
    taxRate: data.tax_rate as number,
  };
}

// Map Business to database record
function mapBusinessToDB(business: Business): Record<string, unknown> {
  return {
    id: business.id,
    name: business.name,
    address: business.address,
    city: business.city,
    state: business.state,
    pincode: business.pincode,
    phone: business.phone,
    email: business.email,
    tax_id: business.taxId,
    logo: business.logo,
    currency: business.currency,
    tax_rate: business.taxRate,
    updated_at: new Date().toISOString(),
  };
}

// Map database record to Settings type
function mapSettingsFromDB(data: Record<string, unknown>): Settings {
  return {
    id: data.id as string,
    currency: data.currency as string,
    taxRate: data.tax_rate as number,
    invoicePrefix: data.invoice_prefix as string,
    defaultPaymentTerms: data.default_payment_terms as string,
    showLogo: data.show_logo as boolean,
    taxLabel: data.tax_label as string,
  };
}

// Map Settings to database record
function mapSettingsToDB(settings: Settings): Record<string, unknown> {
  return {
    id: settings.id,
    currency: settings.currency,
    tax_rate: settings.taxRate,
    invoice_prefix: settings.invoicePrefix,
    default_payment_terms: settings.defaultPaymentTerms,
    show_logo: settings.showLogo,
    tax_label: settings.taxLabel,
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
