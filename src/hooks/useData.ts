import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoiceDB, customerDB, productDB, businessDB, settingsDB } from '../lib/database';
import type { Invoice, Customer, Product, Business, Settings } from '../types';
import { useSync } from '../contexts/SyncProvider';

// Query keys for React Query cache management
export const queryKeys = {
    invoices: ['invoices'] as const,
    invoice: (id: string) => ['invoices', id] as const,
    customers: ['customers'] as const,
    products: ['products'] as const,
    business: ['business'] as const,
    settings: ['settings'] as const,
};

export function useInvoices() {
    const { lastSyncTime } = useSync();
    const queryClient = useQueryClient();

    // Fetch all invoices with React Query
    const { data: invoices = [], isLoading: loading, error } = useQuery({
        queryKey: queryKeys.invoices,
        queryFn: () => invoiceDB.getAll(),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Refetch when sync happens
    if (lastSyncTime) {
        queryClient.invalidateQueries({ queryKey: queryKeys.invoices });
    }

    // Save invoice mutation with optimistic update
    const saveInvoiceMutation = useMutation({
        mutationFn: (invoice: Invoice) => invoiceDB.save(invoice),
        onMutate: async (newInvoice) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: queryKeys.invoices });

            // Snapshot previous value
            const previousInvoices = queryClient.getQueryData<Invoice[]>(queryKeys.invoices);

            // Optimistically update
            queryClient.setQueryData<Invoice[]>(queryKeys.invoices, (old = []) => {
                const index = old.findIndex(i => i.id === newInvoice.id);
                if (index >= 0) {
                    const updated = [...old];
                    updated[index] = newInvoice;
                    return updated;
                }
                return [newInvoice, ...old];
            });

            return { previousInvoices };
        },
        onError: (_err, _newInvoice, context) => {
            // Rollback on error
            if (context?.previousInvoices) {
                queryClient.setQueryData(queryKeys.invoices, context.previousInvoices);
            }
        },
        onSettled: () => {
            // Refetch to ensure consistency
            queryClient.invalidateQueries({ queryKey: queryKeys.invoices });
        },
    });

    // Delete invoice mutation with optimistic update
    const deleteInvoiceMutation = useMutation({
        mutationFn: (id: string) => invoiceDB.delete(id),
        onMutate: async (deletedId) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.invoices });
            const previousInvoices = queryClient.getQueryData<Invoice[]>(queryKeys.invoices);

            queryClient.setQueryData<Invoice[]>(queryKeys.invoices, (old = []) =>
                old.filter(i => i.id !== deletedId)
            );

            return { previousInvoices };
        },
        onError: (_err, _deletedId, context) => {
            if (context?.previousInvoices) {
                queryClient.setQueryData(queryKeys.invoices, context.previousInvoices);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.invoices });
        },
    });

    const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.invoices });

    return {
        invoices,
        loading,
        error: error as Error | null,
        refresh,
        saveInvoice: saveInvoiceMutation.mutateAsync,
        deleteInvoice: deleteInvoiceMutation.mutateAsync
    };
}

export function useInvoice(id: string | undefined) {
    const { lastSyncTime } = useSync();
    const queryClient = useQueryClient();

    const { data: invoice = null, isLoading: loading, error } = useQuery({
        queryKey: queryKeys.invoice(id || ''),
        queryFn: () => id ? invoiceDB.getById(id) : Promise.resolve(null),
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
    });

    if (lastSyncTime && id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.invoice(id) });
    }

    const saveInvoiceMutation = useMutation({
        mutationFn: (data: Invoice) => invoiceDB.save(data),
        onSuccess: (saved) => {
            queryClient.setQueryData(queryKeys.invoice(saved.id), saved);
            queryClient.invalidateQueries({ queryKey: queryKeys.invoices });
        },
    });

    return {
        invoice,
        loading,
        error: error as Error | null,
        saveInvoice: saveInvoiceMutation.mutateAsync
    };
}

export function useCustomers() {
    const { lastSyncTime } = useSync();
    const queryClient = useQueryClient();

    const { data: customers = [], isLoading: loading, error } = useQuery({
        queryKey: queryKeys.customers,
        queryFn: () => customerDB.getAll(),
        staleTime: 5 * 60 * 1000,
    });

    if (lastSyncTime) {
        queryClient.invalidateQueries({ queryKey: queryKeys.customers });
    }

    const saveCustomerMutation = useMutation({
        mutationFn: (customer: Customer) => customerDB.save(customer),
        onMutate: async (newCustomer) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.customers });
            const previousCustomers = queryClient.getQueryData<Customer[]>(queryKeys.customers);

            queryClient.setQueryData<Customer[]>(queryKeys.customers, (old = []) => {
                const index = old.findIndex(c => c.id === newCustomer.id);
                if (index >= 0) {
                    const updated = [...old];
                    updated[index] = newCustomer;
                    return updated;
                }
                return [...old, newCustomer].sort((a, b) => a.name.localeCompare(b.name));
            });

            return { previousCustomers };
        },
        onError: (_err, _newCustomer, context) => {
            if (context?.previousCustomers) {
                queryClient.setQueryData(queryKeys.customers, context.previousCustomers);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.customers });
        },
    });

    const deleteCustomerMutation = useMutation({
        mutationFn: (id: string) => customerDB.delete(id),
        onMutate: async (deletedId) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.customers });
            const previousCustomers = queryClient.getQueryData<Customer[]>(queryKeys.customers);

            queryClient.setQueryData<Customer[]>(queryKeys.customers, (old = []) =>
                old.filter(c => c.id !== deletedId)
            );

            return { previousCustomers };
        },
        onError: (_err, _deletedId, context) => {
            if (context?.previousCustomers) {
                queryClient.setQueryData(queryKeys.customers, context.previousCustomers);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.customers });
        },
    });

    const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.customers });

    return {
        customers,
        loading,
        error: error as Error | null,
        refresh,
        saveCustomer: saveCustomerMutation.mutateAsync,
        deleteCustomer: deleteCustomerMutation.mutateAsync
    };
}

export function useProducts() {
    const { lastSyncTime } = useSync();
    const queryClient = useQueryClient();

    const { data: products = [], isLoading: loading, error } = useQuery({
        queryKey: queryKeys.products,
        queryFn: () => productDB.getAll(),
        staleTime: 5 * 60 * 1000,
    });

    if (lastSyncTime) {
        queryClient.invalidateQueries({ queryKey: queryKeys.products });
    }

    const saveProductMutation = useMutation({
        mutationFn: (product: Product) => productDB.save(product),
        onMutate: async (newProduct) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.products });
            const previousProducts = queryClient.getQueryData<Product[]>(queryKeys.products);

            queryClient.setQueryData<Product[]>(queryKeys.products, (old = []) => {
                const index = old.findIndex(p => p.id === newProduct.id);
                if (index >= 0) {
                    const updated = [...old];
                    updated[index] = newProduct;
                    return updated;
                }
                return [...old, newProduct].sort((a, b) => a.name.localeCompare(b.name));
            });

            return { previousProducts };
        },
        onError: (_err, _newProduct, context) => {
            if (context?.previousProducts) {
                queryClient.setQueryData(queryKeys.products, context.previousProducts);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.products });
        },
    });

    const deleteProductMutation = useMutation({
        mutationFn: (id: string) => productDB.delete(id),
        onMutate: async (deletedId) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.products });
            const previousProducts = queryClient.getQueryData<Product[]>(queryKeys.products);

            queryClient.setQueryData<Product[]>(queryKeys.products, (old = []) =>
                old.filter(p => p.id !== deletedId)
            );

            return { previousProducts };
        },
        onError: (_err, _deletedId, context) => {
            if (context?.previousProducts) {
                queryClient.setQueryData(queryKeys.products, context.previousProducts);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.products });
        },
    });

    const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.products });

    return {
        products,
        loading,
        error: error as Error | null,
        refresh,
        saveProduct: saveProductMutation.mutateAsync,
        deleteProduct: deleteProductMutation.mutateAsync
    };
}

export function useBusiness() {
    const { lastSyncTime } = useSync();
    const queryClient = useQueryClient();

    const { data: business = {} as Business, isLoading: loading, error } = useQuery({
        queryKey: queryKeys.business,
        queryFn: async () => {
            const data = await businessDB.get();
            return data || {} as Business;
        },
        staleTime: 5 * 60 * 1000,
    });

    if (lastSyncTime) {
        queryClient.invalidateQueries({ queryKey: queryKeys.business });
    }

    const saveBusinessMutation = useMutation({
        mutationFn: (data: Business) => businessDB.save(data),
        onSuccess: (saved) => {
            queryClient.setQueryData(queryKeys.business, saved);
        },
    });

    const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.business });

    return {
        business,
        loading,
        error: error as Error | null,
        refresh,
        saveBusiness: saveBusinessMutation.mutateAsync
    };
}

export function useSettings() {
    const { lastSyncTime } = useSync();
    const queryClient = useQueryClient();

    const { data: settings = {} as Settings, isLoading: loading, error } = useQuery({
        queryKey: queryKeys.settings,
        queryFn: async () => {
            const data = await settingsDB.get();
            return data || {} as Settings;
        },
        staleTime: 5 * 60 * 1000,
    });

    if (lastSyncTime) {
        queryClient.invalidateQueries({ queryKey: queryKeys.settings });
    }

    const saveSettingsMutation = useMutation({
        mutationFn: (data: Settings) => settingsDB.save(data),
        onSuccess: (saved) => {
            queryClient.setQueryData(queryKeys.settings, saved);
        },
    });

    const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.settings });

    return {
        settings,
        loading,
        error: error as Error | null,
        refresh,
        saveSettings: saveSettingsMutation.mutateAsync
    };
}
