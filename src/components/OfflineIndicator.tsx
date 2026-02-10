import { Wifi, WifiOff, Cloud, Loader2, AlertCircle } from 'lucide-react';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { useState } from 'react';
import SyncStatus from '../components/SyncStatus';

export default function OfflineIndicator() {
    const { isOnline, isSyncing, pendingCount, sync, error } = useOfflineSync();
    const [showDetails, setShowDetails] = useState(false);

    const handleClick = () => {
        setShowDetails(true);
    };

    const handleManualSync = () => {
        if (isOnline && !isSyncing) {
            sync();
        }
    };

    return (
        <>
            <div className="fixed bottom-4 right-4 z-40">
                <button
                    onClick={handleClick}
                    className={`
            flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg
            transition-all duration-300 hover:scale-105
            ${isOnline
                            ? 'glass text-teal-400 border border-teal-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                        }
          `}
                    title={isOnline ? 'Online' : 'Offline - Click for details'}
                >
                    {isSyncing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isOnline ? (
                        <Wifi className="w-4 h-4" />
                    ) : (
                        <WifiOff className="w-4 h-4" />
                    )}

                    <span className="text-sm font-medium">
                        {isSyncing ? 'Syncing...' : isOnline ? 'Online' : 'Offline'}
                    </span>

                    {pendingCount > 0 && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-400 text-xs font-semibold">
                            <Cloud className="w-3 h-3" />
                            {pendingCount}
                        </span>
                    )}

                    {error && (
                        <AlertCircle className="w-4 h-4 text-coral-400" />
                    )}
                </button>

                {/* Quick sync button when online and has pending items */}
                {isOnline && pendingCount > 0 && !isSyncing && (
                    <button
                        onClick={handleManualSync}
                        className="mt-2 w-full glass text-teal-400 border border-teal-500/30 px-4 py-2 rounded-xl text-sm font-medium hover:bg-teal-500/10 transition-colors flex items-center justify-center gap-2"
                    >
                        <Cloud className="w-4 h-4" />
                        Sync Now
                    </button>
                )}
            </div>

            {showDetails && (
                <SyncStatus onClose={() => setShowDetails(false)} />
            )}
        </>
    );
}
