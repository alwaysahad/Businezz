import { X, Cloud, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { Skeleton } from './ui/Skeleton';

interface SyncStatusProps {
    onClose: () => void;
}

export default function SyncStatus({ onClose }: SyncStatusProps) {
    const { isOnline, isSyncing, pendingCount, lastSyncResult, sync, error, clearError } = useOfflineSync();

    const handleManualSync = () => {
        if (isOnline && !isSyncing) {
            sync();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
            <div className="glass rounded-2xl p-6 max-w-md w-full animate-scale-in">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                        <Cloud className="w-6 h-6 text-teal-400" />
                        Sync Status
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-midnight-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-midnight-400" />
                    </button>
                </div>

                {/* Connection Status */}
                <div className="mb-6">
                    <div className={`
            flex items-center gap-3 p-4 rounded-xl
            ${isOnline
                            ? 'bg-teal-500/10 border border-teal-500/30'
                            : 'bg-amber-500/10 border border-amber-500/30'
                        }
          `}>
                        {isOnline ? (
                            <>
                                <CheckCircle className="w-5 h-5 text-teal-400" />
                                <div>
                                    <p className="text-teal-400 font-medium">Connected</p>
                                    <p className="text-midnight-400 text-sm">You're online and ready to sync</p>
                                </div>
                            </>
                        ) : (
                            <>
                                <AlertCircle className="w-5 h-5 text-amber-400" />
                                <div>
                                    <p className="text-amber-400 font-medium">Offline</p>
                                    <p className="text-midnight-400 text-sm">Changes will sync when you're back online</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Pending Operations */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-white font-medium">Pending Changes</h4>
                        <span className={`
              px-3 py-1 rounded-full text-sm font-semibold
              ${pendingCount > 0
                                ? 'bg-teal-500/20 text-teal-400'
                                : 'bg-midnight-700 text-midnight-400'
                            }
            `}>
                            {pendingCount} {pendingCount === 1 ? 'item' : 'items'}
                        </span>
                    </div>

                    {pendingCount > 0 ? (
                        <p className="text-midnight-400 text-sm">
                            You have {pendingCount} pending {pendingCount === 1 ? 'change' : 'changes'} that will be synced to the cloud.
                        </p>
                    ) : (
                        <p className="text-midnight-400 text-sm">
                            All changes are synced. You're up to date!
                        </p>
                    )}
                </div>

                {/* Last Sync Result */}
                {lastSyncResult && (
                    <div className="mb-6">
                        <h4 className="text-white font-medium mb-3">Last Sync</h4>
                        <div className={`
              p-4 rounded-xl border
              ${lastSyncResult.success
                                ? 'bg-teal-500/10 border-teal-500/30'
                                : 'bg-coral-500/10 border-coral-500/30'
                            }
            `}>
                            {lastSyncResult.success ? (
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-teal-400 mt-0.5" />
                                    <div>
                                        <p className="text-teal-400 font-medium">Sync Successful</p>
                                        <p className="text-midnight-400 text-sm mt-1">
                                            {lastSyncResult.processed} {lastSyncResult.processed === 1 ? 'item' : 'items'} synced
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-start gap-3">
                                    <XCircle className="w-5 h-5 text-coral-400 mt-0.5" />
                                    <div>
                                        <p className="text-coral-400 font-medium">Sync Issues</p>
                                        <p className="text-midnight-400 text-sm mt-1">
                                            {lastSyncResult.processed} synced, {lastSyncResult.failed} failed
                                        </p>
                                        {lastSyncResult.errors.length > 0 && (
                                            <div className="mt-2 space-y-1">
                                                {lastSyncResult.errors.slice(0, 3).map((err, idx) => (
                                                    <p key={idx} className="text-xs text-coral-300">
                                                        • {err.error}
                                                    </p>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-coral-500/10 border border-coral-500/30">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-coral-400 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-coral-400 font-medium">Error</p>
                                <p className="text-midnight-400 text-sm mt-1">{error}</p>
                            </div>
                            <button
                                onClick={clearError}
                                className="p-1 hover:bg-coral-500/20 rounded transition-colors"
                            >
                                <X className="w-4 h-4 text-coral-400" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="btn-secondary flex-1"
                    >
                        Close
                    </button>
                    {isOnline && pendingCount > 0 && (
                        <button
                            onClick={handleManualSync}
                            disabled={isSyncing}
                            className="btn-primary flex-1 flex items-center justify-center gap-2"
                        >
                            {isSyncing ? (
                                <Skeleton className="h-4 w-4 shrink-0 rounded-full" />
                            ) : (
                                <RefreshCw className="h-4 w-4" />
                            )}
                            {isSyncing ? 'Syncing...' : 'Sync Now'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
