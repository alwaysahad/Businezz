import { openDB, type IDBPDatabase } from 'idb';
import type { Invoice, Customer, Product, BusinessProfile, Settings } from '../types';

const DB_NAME = 'businezz-offline';
const DB_VERSION = 1;

export interface OfflineOperation {
    id: string;
    type: 'create' | 'update' | 'delete';
    entity: 'invoice' | 'customer' | 'product' | 'business' | 'settings';
    data: any;
    timestamp: number;
    userId: string;
    retryCount: number;
}

class OfflineDatabase {
    private db: IDBPDatabase | null = null;

    async init(): Promise<void> {
        this.db = await openDB(DB_NAME, DB_VERSION, {
            upgrade(db) {
                // Create object stores for each entity
                if (!db.objectStoreNames.contains('invoices')) {
                    const invoiceStore = db.createObjectStore('invoices', { keyPath: 'id' });
                    invoiceStore.createIndex('userId', 'userId');
                    invoiceStore.createIndex('updatedAt', 'updatedAt');
                }

                if (!db.objectStoreNames.contains('customers')) {
                    const customerStore = db.createObjectStore('customers', { keyPath: 'id' });
                    customerStore.createIndex('userId', 'userId');
                }

                if (!db.objectStoreNames.contains('products')) {
                    const productStore = db.createObjectStore('products', { keyPath: 'id' });
                    productStore.createIndex('userId', 'userId');
                }

                if (!db.objectStoreNames.contains('business')) {
                    db.createObjectStore('business', { keyPath: 'userId' });
                }

                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'userId' });
                }

                // Queue for pending operations
                if (!db.objectStoreNames.contains('syncQueue')) {
                    const queueStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
                    queueStore.createIndex('timestamp', 'timestamp');
                    queueStore.createIndex('userId', 'userId');
                }
            },
        });
    }

    private ensureDB(): IDBPDatabase {
        if (!this.db) {
            throw new Error('Database not initialized. Call init() first.');
        }
        return this.db;
    }

    // Generic CRUD operations
    async get<T>(storeName: string, id: string): Promise<T | undefined> {
        const db = this.ensureDB();
        return db.get(storeName, id);
    }

    async getAll<T>(storeName: string, userId?: string): Promise<T[]> {
        const db = this.ensureDB();
        if (userId) {
            return db.getAllFromIndex(storeName, 'userId', userId);
        }
        return db.getAll(storeName);
    }

    async put<T>(storeName: string, data: T): Promise<void> {
        const db = this.ensureDB();
        await db.put(storeName, data);
    }

    async delete(storeName: string, id: string): Promise<void> {
        const db = this.ensureDB();
        await db.delete(storeName, id);
    }

    async clear(storeName: string): Promise<void> {
        const db = this.ensureDB();
        await db.clear(storeName);
    }

    // Invoice operations
    async getInvoices(userId: string): Promise<Invoice[]> {
        return this.getAll<Invoice>('invoices', userId);
    }

    async getDeletedInvoices(userId: string): Promise<Invoice[]> {
        const invoices = await this.getAll<Invoice>('invoices', userId);
        return invoices.filter(inv => inv.deletedAt);
    }

    async purgeDeletedInvoices(userId: string): Promise<void> {
        const db = this.ensureDB();
        const invoices = await this.getAll<Invoice>('invoices', userId);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const tx = db.transaction('invoices', 'readwrite');
        for (const invoice of invoices) {
            if (invoice.deletedAt && new Date(invoice.deletedAt) < thirtyDaysAgo) {
                await tx.store.delete(invoice.id);
            }
        }
        await tx.done;
    }

    async saveInvoice(invoice: Invoice): Promise<void> {
        await this.put('invoices', invoice);
    }

    async deleteInvoice(id: string): Promise<void> {
        await this.delete('invoices', id);
    }

    // Customer operations
    async getCustomers(userId: string): Promise<Customer[]> {
        return this.getAll<Customer>('customers', userId);
    }

    async saveCustomer(customer: Customer): Promise<void> {
        await this.put('customers', customer);
    }

    async deleteCustomer(id: string): Promise<void> {
        await this.delete('customers', id);
    }

    // Product operations
    async getProducts(userId: string): Promise<Product[]> {
        return this.getAll<Product>('products', userId);
    }

    async saveProduct(product: Product): Promise<void> {
        await this.put('products', product);
    }

    async deleteProduct(id: string): Promise<void> {
        await this.delete('products', id);
    }

    // Business profile operations
    async getBusiness(userId: string): Promise<BusinessProfile | undefined> {
        return this.get<BusinessProfile>('business', userId);
    }

    async saveBusiness(business: BusinessProfile): Promise<void> {
        await this.put('business', business);
    }

    // Settings operations
    async getSettings(userId: string): Promise<Settings | undefined> {
        return this.get<Settings>('settings', userId);
    }

    async saveSettings(settings: Settings): Promise<void> {
        await this.put('settings', settings);
    }

    // Sync queue operations
    async addToSyncQueue(operation: OfflineOperation): Promise<void> {
        await this.put('syncQueue', operation);
    }

    async getSyncQueue(userId: string): Promise<OfflineOperation[]> {
        const db = this.ensureDB();
        const operations = await db.getAllFromIndex('syncQueue', 'userId', userId);
        // Sort by timestamp to maintain order
        return operations.sort((a, b) => a.timestamp - b.timestamp);
    }

    async removeFromSyncQueue(id: string): Promise<void> {
        await this.delete('syncQueue', id);
    }

    async updateSyncQueueItem(operation: OfflineOperation): Promise<void> {
        await this.put('syncQueue', operation);
    }

    async clearSyncQueue(userId: string): Promise<void> {
        const db = this.ensureDB();
        const operations = await this.getSyncQueue(userId);
        const tx = db.transaction('syncQueue', 'readwrite');
        await Promise.all(operations.map(op => tx.store.delete(op.id)));
        await tx.done;
    }

    // Utility: Check if data exists locally
    async hasLocalData(userId: string): Promise<boolean> {
        const invoices = await this.getInvoices(userId);
        const customers = await this.getCustomers(userId);
        const products = await this.getProducts(userId);
        return invoices.length > 0 || customers.length > 0 || products.length > 0;
    }

    // Clear all user data (for logout)
    async clearUserData(userId: string): Promise<void> {
        const stores = ['invoices', 'customers', 'products', 'business', 'settings'];
        for (const store of stores) {
            const items = await this.getAll(store, userId);
            for (const item of items) {
                await this.delete(store, (item as any).id || userId);
            }
        }
        await this.clearSyncQueue(userId);
    }
}

// Singleton instance
export const offlineDB = new OfflineDatabase();
