import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, RefreshCcw, ArrowLeft, Trash2, AlertTriangle, Clock } from 'lucide-react';
import { useTrashInvoices, useBusiness } from '../hooks/useData';
import { formatDate, formatCurrency, calculateInvoiceTotals } from '../utils/helpers';
import { Skeleton } from '../components/ui/Skeleton';

const RETENTION_DAYS = 30;

function getDeletionInfo(deletedAt: string | null | undefined) {
  if (!deletedAt) return { daysAgo: 0, daysRemaining: RETENTION_DAYS, progress: 0 };
  const diffMs = Date.now() - new Date(deletedAt).getTime();
  const daysAgo = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, RETENTION_DAYS - daysAgo);
  const progress = Math.min(100, (daysAgo / RETENTION_DAYS) * 100);
  return { daysAgo, daysRemaining, progress };
}

function TrashSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-8 w-40" />
          </div>
          <Skeleton className="h-4 w-64 ml-10" />
        </div>
      </div>

      {/* Trash List */}
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass rounded-xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1">
                <Skeleton className="h-6 w-48 mb-3" />
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-28" />
                </div>
                {/* Retention progress */}
                <div className="mt-4 flex items-center gap-2">
                  <Skeleton className="h-3 w-3 rounded-full" />
                  <Skeleton className="h-1.5 w-[200px] rounded-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <div className="flex items-center gap-6 mt-4 sm:mt-0">
                <Skeleton className="h-8 w-28" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-9 w-24 rounded-lg" />
                  <Skeleton className="h-9 w-24 rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Trash() {
  const { invoices, loading, restoreInvoice, hardDeleteInvoice, emptyTrash } = useTrashInvoices();
  const { business } = useBusiness();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [emptyConfirm, setEmptyConfirm] = useState(false);
  const [emptyingTrash, setEmptyingTrash] = useState(false);

  const handleRestore = async (id: string) => {
    setRestoringId(id);
    try {
      await restoreInvoice(id);
    } catch (err) {
      console.error('Failed to restore invoice', err);
    } finally {
      setRestoringId(null);
    }
  };

  const handleHardDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await hardDeleteInvoice(id);
    } catch (err) {
      console.error('Failed to hard delete invoice', err);
    } finally {
      setDeletingId(null);
      setDeleteConfirm(null);
    }
  };

  const handleEmptyTrash = async () => {
    setEmptyingTrash(true);
    try {
      await emptyTrash();
    } catch (err) {
      console.error('Failed to empty trash', err);
    } finally {
      setEmptyingTrash(false);
      setEmptyConfirm(false);
    }
  };

  if (loading && invoices.length === 0) {
    return <TrashSkeleton />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link to="/invoices" className="p-2 -ml-2 rounded-lg text-midnight-400 hover:text-white hover:bg-midnight-800 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
              <Trash2 className="w-6 h-6 text-midnight-400" />
              Trash Bin
            </h1>
            {invoices.length > 0 && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-coral-500/20 text-coral-400">
                {invoices.length}
              </span>
            )}
          </div>
          <p className="text-midnight-400 ml-10">Invoices here will be permanently deleted after 30 days.</p>
        </div>

        {invoices.length > 0 && (
          <button
            onClick={() => setEmptyConfirm(true)}
            className="btn-secondary flex items-center gap-2 border-coral-500/30 hover:border-coral-500 hover:bg-coral-500/10 text-coral-400 transition-colors self-start"
          >
            <Trash2 className="w-4 h-4" />
            Empty Trash
          </button>
        )}
      </div>

      {invoices.length === 0 ? (
        <div className="text-center py-16">
          <Trash2 className="w-16 h-16 text-midnight-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Trash is empty</h3>
          <p className="text-midnight-400">No deleted invoices found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((invoice) => {
            const totals = calculateInvoiceTotals(invoice.items, invoice.taxRate, invoice.discount);
            const { daysAgo, daysRemaining, progress } = getDeletionInfo(invoice.deletedAt);
            const isUrgent = daysRemaining <= 5;

            return (
              <div key={invoice.id} className={`glass rounded-xl p-4 sm:p-6 transition-all duration-200 ${(restoringId === invoice.id || deletingId === invoice.id) ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="text-lg font-semibold text-white mb-2 truncate">
                      {invoice.customerName}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-midnight-400">
                      <span className="font-mono">{invoice.invoiceNumber}</span>
                      <span>·</span>
                      <span>{formatDate(invoice.date)}</span>
                      <span>·</span>
                      <span className="text-coral-400">
                        {daysAgo === 0 ? 'Deleted today' : `Deleted ${daysAgo} day${daysAgo !== 1 ? 's' : ''} ago`}
                      </span>
                    </div>

                    {/* Retention countdown bar */}
                    <div className="mt-3 flex items-center gap-2">
                      <Clock className={`w-3.5 h-3.5 flex-shrink-0 ${isUrgent ? 'text-coral-400' : 'text-midnight-500'}`} />
                      <div className="flex-1 max-w-[200px]">
                        <div className="h-1.5 rounded-full bg-midnight-700 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${isUrgent ? 'bg-coral-500' : 'bg-amber-500/70'}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                      <span className={`text-xs font-medium ${isUrgent ? 'text-coral-400' : 'text-midnight-500'}`}>
                        {daysRemaining === 0
                          ? 'Expiring soon'
                          : `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} left`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-2xl font-mono font-bold text-white">
                        {formatCurrency(totals.total, business.currency)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRestore(invoice.id)}
                        disabled={restoringId === invoice.id}
                        className="btn-secondary flex items-center gap-2 py-2 px-3 border-teal-500/30 hover:border-teal-500 hover:bg-teal-500/10 text-teal-400 transition-colors"
                        title="Restore"
                      >
                        {restoringId === invoice.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
                        <span className="hidden sm:inline">Restore</span>
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(invoice.id)}
                        disabled={deletingId === invoice.id}
                        className="btn-secondary flex items-center gap-2 py-2 px-3 border-coral-500/30 hover:border-coral-500 hover:bg-coral-500/10 text-coral-400 transition-colors"
                        title="Delete Forever"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Single Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="glass rounded-2xl p-6 max-w-md w-full animate-scale-in">
            <h3 className="text-xl font-semibold text-white mb-2">Delete Forever?</h3>
            <p className="text-midnight-400 mb-6">This invoice will be permanently deleted and cannot be recovered.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="btn-secondary"
                disabled={deletingId !== null}
              >
                Cancel
              </button>
              <button
                onClick={() => handleHardDelete(deleteConfirm)}
                className="btn-danger flex items-center gap-2"
                disabled={deletingId !== null}
              >
                {deletingId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {deletingId ? 'Deleting...' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty Trash Confirmation Modal */}
      {emptyConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="glass rounded-2xl p-6 max-w-md w-full animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-coral-500/20">
                <AlertTriangle className="w-5 h-5 text-coral-400" />
              </div>
              <h3 className="text-xl font-semibold text-white">Empty Trash?</h3>
            </div>
            <p className="text-midnight-400 mb-6">
              All {invoices.length} invoice{invoices.length !== 1 ? 's' : ''} in trash will be permanently deleted. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setEmptyConfirm(false)}
                className="btn-secondary"
                disabled={emptyingTrash}
              >
                Cancel
              </button>
              <button
                onClick={handleEmptyTrash}
                className="btn-danger flex items-center gap-2"
                disabled={emptyingTrash}
              >
                {emptyingTrash ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {emptyingTrash ? 'Emptying...' : 'Empty Trash'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
