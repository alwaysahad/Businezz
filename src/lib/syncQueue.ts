import { offlineDB, type OfflineOperation } from './offlineDB';
import { supabase } from './supabase';
import { generateId } from '../utils/helpers';

const MAX_RETRY_COUNT = 3;

export interface SyncResult {
    success: boolean;
    processed: number;
    failed: number;
    errors: Array<{ operation: OfflineOperation; error: string }>;
}

class SyncQueueManager {
    private isSyncing = false;
    private syncListeners: Array<(result: SyncResult) => void> = [];

    /**
     * Add an operation to the sync queue
     */
    async enqueue(
        type: OfflineOperation['type'],
        entity: OfflineOperation['entity'],
        data: any,
        userId: string
    ): Promise<void> {
        const operation: OfflineOperation = {
            id: generateId(),
            type,
            entity,
            data,
            timestamp: Date.now(),
            userId,
            retryCount: 0,
        };

        await offlineDB.addToSyncQueue(operation);
    }

    /**
     * Process the sync queue
     */
    async processQueue(userId: string): Promise<SyncResult> {
        if (this.isSyncing) {
            console.log('Sync already in progress');
            return { success: false, processed: 0, failed: 0, errors: [] };
        }

        this.isSyncing = true;
        const result: SyncResult = {
            success: true,
            processed: 0,
            failed: 0,
            errors: [],
        };

        try {
            const queue = await offlineDB.getSyncQueue(userId);
            console.log(`Processing ${queue.length} queued operations`);

            for (const operation of queue) {
                try {
                    await this.processOperation(operation);
                    await offlineDB.removeFromSyncQueue(operation.id);
                    result.processed++;
                } catch (error) {
                    console.error('Failed to process operation:', operation, error);

                    // Increment retry count
                    operation.retryCount++;

                    if (operation.retryCount >= MAX_RETRY_COUNT) {
                        // Max retries reached, remove from queue and log error
                        await offlineDB.removeFromSyncQueue(operation.id);
                        result.failed++;
                        result.errors.push({
                            operation,
                            error: error instanceof Error ? error.message : 'Unknown error',
                        });
                    } else {
                        // Update retry count and keep in queue
                        await offlineDB.updateSyncQueueItem(operation);
                        result.failed++;
                    }
                }
            }

            result.success = result.failed === 0;
            this.notifyListeners(result);

            return result;
        } finally {
            this.isSyncing = false;
        }
    }

    /**
     * Process a single operation
     */
    private async processOperation(operation: OfflineOperation): Promise<void> {
        if (!supabase) {
            throw new Error('Supabase client not initialized');
        }

        const { type, entity, data } = operation;

        // Get the appropriate Supabase table name
        const tableName = this.getTableName(entity);

        switch (type) {
            case 'create':
            case 'update':
                // Use upsert to handle both create and update
                const { error: upsertError } = await supabase
                    .from(tableName)
                    .upsert(data, { onConflict: 'id' });

                if (upsertError) throw upsertError;
                break;

            case 'delete':
                const { error: deleteError } = await supabase
                    .from(tableName)
                    .delete()
                    .eq('id', data.id);

                if (deleteError) throw deleteError;
                break;

            default:
                throw new Error(`Unknown operation type: ${type}`);
        }
    }

    /**
     * Get Supabase table name from entity type
     */
    private getTableName(entity: OfflineOperation['entity']): string {
        switch (entity) {
            case 'invoice':
                return 'invoices';
            case 'customer':
                return 'customers';
            case 'product':
                return 'products';
            case 'business':
                return 'business_profile';
            case 'settings':
                return 'settings';
            default:
                throw new Error(`Unknown entity type: ${entity}`);
        }
    }

    /**
     * Get pending operations count
     */
    async getPendingCount(userId: string): Promise<number> {
        const queue = await offlineDB.getSyncQueue(userId);
        return queue.length;
    }

    /**
     * Clear all pending operations (use with caution)
     */
    async clearQueue(userId: string): Promise<void> {
        await offlineDB.clearSyncQueue(userId);
    }

    /**
     * Subscribe to sync events
     */
    onSync(callback: (result: SyncResult) => void): () => void {
        this.syncListeners.push(callback);
        return () => {
            this.syncListeners = this.syncListeners.filter(cb => cb !== callback);
        };
    }

    /**
     * Notify all listeners
     */
    private notifyListeners(result: SyncResult): void {
        this.syncListeners.forEach(listener => listener(result));
    }

    /**
     * Check if currently syncing
     */
    get syncing(): boolean {
        return this.isSyncing;
    }
}

// Singleton instance
export const syncQueue = new SyncQueueManager();
