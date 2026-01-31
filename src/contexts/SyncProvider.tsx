import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { cloudSync } from '../utils/storage';

interface SyncContextType {
    syncing: boolean;
    lastSyncTime: Date | null;
    syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
    syncError: string | null;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export function SyncProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [syncing, setSyncing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
    const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
    const [syncError, setSyncError] = useState<string | null>(null);

    // Initial sync on mount if user is logged in
    useEffect(() => {
        if (user && isSupabaseConfigured) {
            handleFullSync();
        }
    }, [user]);

    const handleFullSync = async () => {
        if (syncing) return;
        setSyncing(true);
        setSyncStatus('syncing');

        try {
            // We use downloadFromCloud because it merges data (cloud wins conflicts)
            // storage.ts's save methods already push changes, so we generally just need to pull
            // to ensure we have the latest state on load or conflict.
            // If we wanted to be 100% sure of consistency, we could use fullSync() 
            // but that might be heavy to run repeatedly.
            // Given "auto sync" requirement, downloadFromCloud is safe for "pulling updates".

            const result = await cloudSync.downloadFromCloud();

            if (result.success) {
                setSyncStatus('synced');
                setLastSyncTime(new Date());
                window.dispatchEvent(new Event('storage'));
            } else {
                setSyncStatus('error');
                setSyncError(result.message);
            }
        } catch (error) {
            setSyncStatus('error');
            setSyncError(error instanceof Error ? error.message : 'Unknown error');
        } finally {
            setSyncing(false);
        }
    };

    useEffect(() => {
        if (!supabase || !isSupabaseConfigured || !user) {
            return;
        }

        const handleRealtimeUpdate = () => {
            console.log('Remote change detected, syncing...');
            handleFullSync();
        };

        const tables = ['invoices', 'customers', 'products', 'business_profile', 'settings'];
        const channels = tables.map(table =>
            supabase!
                .channel(`${table}-changes`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: table,
                        filter: `user_id=eq.${user.id}`,
                    },
                    handleRealtimeUpdate
                )
                .subscribe()
        );

        return () => {
            channels.forEach(channel => channel.unsubscribe());
        };
    }, [user]);

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
