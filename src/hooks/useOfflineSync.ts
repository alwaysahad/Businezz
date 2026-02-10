import { useState, useEffect } from 'react';
import { offlineDB } from '../lib/offlineDB';
import { syncQueue, type SyncResult } from '../lib/syncQueue';
import { networkStatus, type NetworkStatus } from '../utils/networkStatus';
import { useAuth } from '../contexts/AuthContext';

export interface OfflineSyncState {
    isOnline: boolean;
    isSyncing: boolean;
    pendingCount: number;
    lastSyncResult: SyncResult | null;
    error: string | null;
}

export function useOfflineSync() {
    const { user } = useAuth();
    const [state, setState] = useState<OfflineSyncState>({
        isOnline: networkStatus.isOnline(),
        isSyncing: false,
        pendingCount: 0,
        lastSyncResult: null,
        error: null,
    });

    // Initialize offline database
    useEffect(() => {
        offlineDB.init().catch(error => {
            console.error('Failed to initialize offline database:', error);
            setState(prev => ({ ...prev, error: 'Failed to initialize offline storage' }));
        });
    }, []);

    // Monitor network status
    useEffect(() => {
        const unsubscribe = networkStatus.subscribe((status: NetworkStatus) => {
            setState(prev => ({ ...prev, isOnline: status === 'online' }));

            // Auto-sync when coming back online
            if (status === 'online' && user) {
                handleSync();
            }
        });

        return unsubscribe;
    }, [user]);

    // Update pending count periodically
    useEffect(() => {
        if (!user) return;

        const updatePendingCount = async () => {
            try {
                const count = await syncQueue.getPendingCount(user.id);
                setState(prev => ({ ...prev, pendingCount: count }));
            } catch (error) {
                console.error('Failed to get pending count:', error);
            }
        };

        updatePendingCount();
        const interval = setInterval(updatePendingCount, 5000); // Update every 5 seconds

        return () => clearInterval(interval);
    }, [user]);

    // Listen for sync events
    useEffect(() => {
        const unsubscribe = syncQueue.onSync((result: SyncResult) => {
            setState(prev => ({
                ...prev,
                isSyncing: false,
                lastSyncResult: result,
                pendingCount: 0,
                error: result.success ? null : 'Some operations failed to sync',
            }));
        });

        return unsubscribe;
    }, []);

    const handleSync = async () => {
        if (!user || state.isSyncing || !state.isOnline) return;

        setState(prev => ({ ...prev, isSyncing: true, error: null }));

        try {
            const result = await syncQueue.processQueue(user.id);

            // Update pending count after sync
            const count = await syncQueue.getPendingCount(user.id);
            setState(prev => ({
                ...prev,
                isSyncing: false,
                lastSyncResult: result,
                pendingCount: count,
                error: result.success ? null : 'Some operations failed to sync',
            }));
        } catch (error) {
            console.error('Sync failed:', error);
            setState(prev => ({
                ...prev,
                isSyncing: false,
                error: error instanceof Error ? error.message : 'Sync failed',
            }));
        }
    };

    const clearError = () => {
        setState(prev => ({ ...prev, error: null }));
    };

    return {
        ...state,
        sync: handleSync,
        clearError,
    };
}
