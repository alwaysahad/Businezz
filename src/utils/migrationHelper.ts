import { syncToCloud, isSupabaseConfigured } from '../lib/database';
import { generateId } from './helpers';
import type { Invoice, Customer, Product, Business, Settings } from '../types';

// Local Storage Keys
const STORAGE_KEYS = {
    INVOICES: 'invoiceflow_invoices',
    BUSINESS: 'invoiceflow_business',
    SETTINGS: 'invoiceflow_settings',
    CUSTOMERS: 'invoiceflow_customers',
    PRODUCTS: 'invoiceflow_products',
} as const;

// UUID validation regex (approximate)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isUUID = (id: string): boolean => UUID_REGEX.test(id);

const getFromStorage = <T>(key: string): T | null => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (error) {
        console.error(`Error reading from storage: ${key}`, error);
        return null;
    }
};

/**
 * Uploads all data from localStorage to Supabase.
 * Ensures all entities have valid UUIDs before uploading.
 */
export async function uploadLocalDataToCloud(): Promise<{ success: boolean; message: string }> {
    if (!isSupabaseConfigured) {
        return { success: false, message: 'Cloud sync not configured.' };
    }

    const invoices = getFromStorage<Invoice[]>(STORAGE_KEYS.INVOICES) || [];
    const customers = getFromStorage<Customer[]>(STORAGE_KEYS.CUSTOMERS) || [];
    const products = getFromStorage<Product[]>(STORAGE_KEYS.PRODUCTS) || [];
    const business = getFromStorage<Business>(STORAGE_KEYS.BUSINESS);
    const settings = getFromStorage<Settings>(STORAGE_KEYS.SETTINGS);

    const hasData = invoices.length > 0 || customers.length > 0 || products.length > 0 || !!business;

    if (!hasData) {
        return { success: true, message: 'No local data to migrate.' };
    }

    // Migrate IDs to UUIDs if needed
    const migratedInvoices = invoices.map(inv => ({
        ...inv,
        id: isUUID(inv.id) ? inv.id : generateId(),
        items: inv.items.map(item => ({
            ...item,
            id: isUUID(item.id) ? item.id : generateId()
        }))
    }));

    const migratedCustomers = customers.map(c => ({
        ...c,
        id: isUUID(c.id) ? c.id : generateId()
    }));

    const migratedProducts = products.map(p => ({
        ...p,
        id: isUUID(p.id) ? p.id : generateId()
    }));

    let migratedBusiness = business;
    if (business && (!business.id || !isUUID(business.id))) {
        migratedBusiness = { ...business, id: generateId() };
    }

    let migratedSettings = settings;
    if (settings && (!settings.id || !isUUID(settings.id))) {
        migratedSettings = { ...settings, id: generateId() };
    }

    return syncToCloud({
        invoices: migratedInvoices,
        customers: migratedCustomers,
        products: migratedProducts,
        business: migratedBusiness || {} as Business,
        settings: migratedSettings || {} as Settings
    });
}
