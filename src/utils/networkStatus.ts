/**
 * Network status utilities for detecting online/offline state
 */

export type NetworkStatus = 'online' | 'offline' | 'unknown';

export interface NetworkStatusListener {
    (status: NetworkStatus): void;
}

class NetworkStatusManager {
    private listeners: NetworkStatusListener[] = [];
    private currentStatus: NetworkStatus = 'unknown';

    constructor() {
        this.init();
    }

    private init(): void {
        // Set initial status
        this.currentStatus = navigator.onLine ? 'online' : 'offline';

        // Listen for online/offline events
        window.addEventListener('online', this.handleOnline);
        window.addEventListener('offline', this.handleOffline);
    }

    private handleOnline = (): void => {
        console.log('Network: Online');
        this.updateStatus('online');
    };

    private handleOffline = (): void => {
        console.log('Network: Offline');
        this.updateStatus('offline');
    };

    private updateStatus(status: NetworkStatus): void {
        if (this.currentStatus !== status) {
            this.currentStatus = status;
            this.notifyListeners(status);
        }
    }

    private notifyListeners(status: NetworkStatus): void {
        this.listeners.forEach(listener => listener(status));
    }

    /**
     * Get current network status
     */
    getStatus(): NetworkStatus {
        return this.currentStatus;
    }

    /**
     * Check if currently online
     */
    isOnline(): boolean {
        return this.currentStatus === 'online';
    }

    /**
     * Check if currently offline
     */
    isOffline(): boolean {
        return this.currentStatus === 'offline';
    }

    /**
     * Subscribe to network status changes
     */
    subscribe(listener: NetworkStatusListener): () => void {
        this.listeners.push(listener);
        // Immediately notify with current status
        listener(this.currentStatus);

        // Return unsubscribe function
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    /**
     * Cleanup event listeners
     */
    destroy(): void {
        window.removeEventListener('online', this.handleOnline);
        window.removeEventListener('offline', this.handleOffline);
        this.listeners = [];
    }
}

// Singleton instance
export const networkStatus = new NetworkStatusManager();
