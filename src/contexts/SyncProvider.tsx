import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface SyncContextType {
    lastSyncTime: Date | null;
    syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export function SyncProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
    const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');

    useEffect(() => {
        if (!supabase || !isSupabaseConfigured || !user) {
            return;
        }

        const handleRealtimeUpdate = () => {
            console.log('Remote change detected, refreshing data...');
            setSyncStatus('syncing');
            // Brief delay to show "syncing" state then trigger refresh
            setTimeout(() => {
                setLastSyncTime(new Date());
                setSyncStatus('synced');
                setTimeout(() => setSyncStatus('idle'), 2000);
            }, 500);
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
        lastSyncTime,
        syncStatus,
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
