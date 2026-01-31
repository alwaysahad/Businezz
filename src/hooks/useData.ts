import { useState, useEffect, useCallback } from 'react';
import { invoiceDB, customerDB, productDB, businessDB, settingsDB } from '../lib/database';
import type { Invoice, Customer, Product, Business, Settings } from '../types';
import { useSync } from '../contexts/SyncProvider';

export function useInvoices() {
    const { lastSyncTime } = useSync();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchInvoices = useCallback(async () => {
        try {
            setLoading(true);
            // Depending on how big the data is, we might want to check if (loading) return?
            // But we want to refresh in background if it's a "sync" update.
            // So maybe "isRefetching" state?
            // For now, simple setLoading(true) is fine, or we can avoid setting loading=true if we already have data.
            // Let's set loading=true for now to be safe.
            const data = await invoiceDB.getAll();
            setInvoices(data);
            setError(null);
        } catch (err) {
            console.error('Error fetching invoices:', err);
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInvoices();
    }, [fetchInvoices, lastSyncTime]);

    const saveInvoice = async (invoice: Invoice) => {
        const saved = await invoiceDB.save(invoice);
        setInvoices(prev => {
            const index = prev.findIndex(i => i.id === saved.id);
            if (index >= 0) {
                const newInvoices = [...prev];
                newInvoices[index] = saved;
                return newInvoices;
            }
            return [saved, ...prev];
        });
        return saved;
    };

    const deleteInvoice = async (id: string) => {
        await invoiceDB.delete(id);
        setInvoices(prev => prev.filter(i => i.id !== id));
    };

    return { invoices, loading, error, refresh: fetchInvoices, saveInvoice, deleteInvoice };
}

export function useInvoice(id: string | undefined) {
    const { lastSyncTime } = useSync();
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!id) {
            setLoading(false);
            return;
        }
        const fetchInvoice = async () => {
            try {
                setLoading(true);
                const data = await invoiceDB.getById(id);
                setInvoice(data);
                setError(null);
            } catch (err) {
                console.error('Error fetching invoice:', err);
                setError(err as Error);
            } finally {
                setLoading(false);
            }
        };
        fetchInvoice();
    }, [id, lastSyncTime]);

    const saveInvoice = async (data: Invoice) => {
        const saved = await invoiceDB.save(data);
        setInvoice(saved);
        return saved;
    };

    return { invoice, loading, error, saveInvoice };
}

export function useCustomers() {
    const { lastSyncTime } = useSync();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchCustomers = useCallback(async () => {
        try {
            setLoading(true);
            const data = await customerDB.getAll();
            setCustomers(data);
            setError(null);
        } catch (err) {
            console.error('Error fetching customers:', err);
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers, lastSyncTime]);

    const saveCustomer = async (customer: Customer) => {
        const saved = await customerDB.save(customer);
        setCustomers(prev => {
            const index = prev.findIndex(c => c.id === saved.id);
            if (index >= 0) {
                const newCustomers = [...prev];
                newCustomers[index] = saved;
                return newCustomers;
            }
            return [...prev, saved].sort((a, b) => a.name.localeCompare(b.name));
        });
        return saved;
    };

    const deleteCustomer = async (id: string) => {
        await customerDB.delete(id);
        setCustomers(prev => prev.filter(c => c.id !== id));
    };

    return { customers, loading, error, refresh: fetchCustomers, saveCustomer, deleteCustomer };
}

export function useProducts() {
    const { lastSyncTime } = useSync();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true);
            const data = await productDB.getAll();
            setProducts(data);
            setError(null);
        } catch (err) {
            console.error('Error fetching products:', err);
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts, lastSyncTime]);

    const saveProduct = async (product: Product) => {
        const saved = await productDB.save(product);
        setProducts(prev => {
            const index = prev.findIndex(p => p.id === saved.id);
            if (index >= 0) {
                const newProducts = [...prev];
                newProducts[index] = saved;
                return newProducts;
            }
            return [...prev, saved].sort((a, b) => a.name.localeCompare(b.name));
        });
        return saved;
    };

    const deleteProduct = async (id: string) => {
        await productDB.delete(id);
        setProducts(prev => prev.filter(p => p.id !== id));
    };

    return { products, loading, error, refresh: fetchProducts, saveProduct, deleteProduct };
}

export function useBusiness() {
    const { lastSyncTime } = useSync();
    const [business, setBusiness] = useState<Business>({} as Business);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchBusiness = useCallback(async () => {
        try {
            setLoading(true);
            const data = await businessDB.get();
            if (data) {
                setBusiness(data);
            }
            setError(null);
        } catch (err) {
            console.error('Error fetching business:', err);
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBusiness();
    }, [fetchBusiness, lastSyncTime]);

    const saveBusiness = async (data: Business) => {
        const saved = await businessDB.save(data);
        setBusiness(saved);
        return saved;
    };

    return { business, loading, error, refresh: fetchBusiness, saveBusiness };
}

export function useSettings() {
    const { lastSyncTime } = useSync();
    const [settings, setSettings] = useState<Settings>({} as Settings);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchSettings = useCallback(async () => {
        try {
            setLoading(true);
            const data = await settingsDB.get();
            if (data) {
                setSettings(data);
            }
            setError(null);
        } catch (err) {
            console.error('Error fetching settings:', err);
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings, lastSyncTime]);

    const saveSettings = async (data: Settings) => {
        const saved = await settingsDB.save(data);
        setSettings(saved);
        return saved;
    };

    return { settings, loading, error, refresh: fetchSettings, saveSettings };
}
