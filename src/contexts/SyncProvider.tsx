import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface SyncContextType {
    syncing: boolean;
    lastSyncTime: Date | null;
    syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
    syncError: string | null;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export function SyncProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [syncing] = useState(false);
    const [lastSyncTime] = useState<Date | null>(null);
    const [syncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
    const [syncError] = useState<string | null>(null);

    useEffect(() => {
        if (!supabase || !isSupabaseConfigured || !user) {
            return;
        }

        // Subscribe to real-time changes
        const invoicesChannel = supabase
            .channel('invoices-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'invoices',
                    filter: `user_id=eq.${user.id}`,
                },
                () => {
                    // Refresh local storage from database
                    refreshInvoices();
                }
            )
            .subscribe();

        const customersChannel = supabase
            .channel('customers-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'customers',
                    filter: `user_id=eq.${user.id}`,
                },
                () => {
                    refreshCustomers();
                }
            )
            .subscribe();

        const productsChannel = supabase
            .channel('products-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'products',
                    filter: `user_id=eq.${user.id}`,
                },
                () => {
                    refreshProducts();
                }
            )
            .subscribe();

        const businessChannel = supabase
            .channel('business-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'business_profile',
                    filter: `user_id=eq.${user.id}`,
                },
                () => {
                    refreshBusiness();
                }
            )
            .subscribe();

        const settingsChannel = supabase
            .channel('settings-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'settings',
                    filter: `user_id=eq.${user.id}`,
                },
                () => {
                    refreshSettings();
                }
            )
            .subscribe();

        // Cleanup subscriptions on unmount
        return () => {
            invoicesChannel.unsubscribe();
            customersChannel.unsubscribe();
            productsChannel.unsubscribe();
            businessChannel.unsubscribe();
            settingsChannel.unsubscribe();
        };
    }, [user]);

    const refreshInvoices = async () => {
        if (!supabase) return;
        try {
            const { data } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
            if (data) {
                // Update local storage with fresh data
                localStorage.setItem('invoiceflow_invoices', JSON.stringify(data.map(mapInvoiceFromDB)));
                // Trigger a storage event to update UI
                window.dispatchEvent(new Event('storage'));
            }
        } catch (error) {
            console.error('Error refreshing invoices:', error);
        }
    };

    const refreshCustomers = async () => {
        if (!supabase) return;
        try {
            const { data } = await supabase.from('customers').select('*').order('name');
            if (data) {
                localStorage.setItem('invoiceflow_customers', JSON.stringify(data));
                window.dispatchEvent(new Event('storage'));
            }
        } catch (error) {
            console.error('Error refreshing customers:', error);
        }
    };

    const refreshProducts = async () => {
        if (!supabase) return;
        try {
            const { data } = await supabase.from('products').select('*').order('name');
            if (data) {
                localStorage.setItem('invoiceflow_products', JSON.stringify(data));
                window.dispatchEvent(new Event('storage'));
            }
        } catch (error) {
            console.error('Error refreshing products:', error);
        }
    };

    const refreshBusiness = async () => {
        if (!supabase) return;
        try {
            const { data } = await supabase.from('business_profile').select('*').single();
            if (data) {
                localStorage.setItem('invoiceflow_business', JSON.stringify(data));
                window.dispatchEvent(new Event('storage'));
            }
        } catch (error) {
            console.error('Error refreshing business:', error);
        }
    };

    const refreshSettings = async () => {
        if (!supabase) return;
        try {
            const { data } = await supabase.from('settings').select('*').single();
            if (data) {
                localStorage.setItem('invoiceflow_settings', JSON.stringify(data));
                window.dispatchEvent(new Event('storage'));
            }
        } catch (error) {
            console.error('Error refreshing settings:', error);
        }
    };

    // Helper function to map invoice from DB
    const mapInvoiceFromDB = (data: any) => ({
        id: data.id,
        invoiceNumber: data.invoice_number,
        date: data.date,
        customerName: data.customer_name,
        customerEmail: data.customer_email,
        customerPhone: data.customer_phone,
        customerAddress: data.customer_address,
        items: data.items || [],
        taxRate: data.tax_rate,
        discount: data.discount,
        notes: data.notes,
        status: data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
    });

    const value = {
        syncing,
        lastSyncTime,
        syncStatus,
        syncError,
    };

    return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync() {
    const context = useContext(SyncContext);
    if (context === undefined) {
        throw new Error('useSync must be used within a SyncProvider');
    }
    return context;
}
