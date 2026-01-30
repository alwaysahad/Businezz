import { useState, useMemo, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  FileText,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  Download,
  Calendar,
  SortAsc,
  SortDesc,
} from 'lucide-react';
import { invoiceStorage, businessStorage, settingsStorage } from '../utils/storage';
import { formatCurrency, formatDate, calculateInvoiceTotals, getStatusColor, getStatusLabel } from '../utils/helpers';
import { downloadInvoicePDF } from '../utils/pdfGenerator';
import type { Invoice, InvoiceStats } from '../types';

type SortField = 'date' | 'amount' | 'customer' | 'number';
type SortOrder = 'asc' | 'desc';
type StatusFilter = 'all' | 'draft' | 'pending' | 'paid' | 'overdue';

function Invoices() {
  const business = businessStorage.get();
  const settings = settingsStorage.get();
  const [invoices, setInvoices] = useState<Invoice[]>(() => invoiceStorage.getAll());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filteredInvoices = useMemo((): Invoice[] => {
    let result = [...invoices];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (inv) =>
          inv.customerName?.toLowerCase().includes(query) ||
          inv.invoiceNumber?.toLowerCase().includes(query) ||
          inv.customerEmail?.toLowerCase().includes(query) ||
          inv.customerPhone?.includes(query)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((inv) => inv.status === statusFilter);
    }

    result.sort((a, b) => {
      let compareA: number | string;
      let compareB: number | string;
      
      if (sortBy === 'date') {
        compareA = new Date(a.createdAt || a.date).getTime();
        compareB = new Date(b.createdAt || b.date).getTime();
      } else if (sortBy === 'amount') {
        const totalsA = calculateInvoiceTotals(a.items, a.taxRate, a.discount);
        const totalsB = calculateInvoiceTotals(b.items, b.taxRate, b.discount);
        compareA = totalsA.total;
        compareB = totalsB.total;
      } else if (sortBy === 'customer') {
        compareA = a.customerName?.toLowerCase() || '';
        compareB = b.customerName?.toLowerCase() || '';
      } else {
        compareA = a.invoiceNumber;
        compareB = b.invoiceNumber;
      }

      if (sortOrder === 'asc') {
        return compareA > compareB ? 1 : -1;
      }
      return compareA < compareB ? 1 : -1;
    });

    return result;
  }, [invoices, searchQuery, statusFilter, sortBy, sortOrder]);

  const stats = useMemo((): InvoiceStats => ({
    total: invoices.length,
    draft: invoices.filter((i) => i.status === 'draft').length,
    pending: invoices.filter((i) => i.status === 'pending').length,
    paid: invoices.filter((i) => i.status === 'paid').length,
    overdue: invoices.filter((i) => i.status === 'overdue').length,
  }), [invoices]);

  const handleDelete = (id: string): void => {
    invoiceStorage.delete(id);
    setInvoices(invoiceStorage.getAll());
    setDeleteConfirm(null);
    setActiveMenu(null);
  };

  const handleDownloadPDF = (invoice: Invoice): void => {
    downloadInvoicePDF(invoice, business, settings);
    setActiveMenu(null);
  };

  const toggleSort = (field: SortField): void => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Invoices</h1>
          <p className="text-midnight-400">{filteredInvoices.length} of {invoices.length} invoices</p>
        </div>
        <Link to="/invoices/new" className="btn-primary flex items-center gap-2 self-start">
          <Plus className="w-5 h-5" />
          <span>New Invoice</span>
        </Link>
      </div>

      {/* Stats Tabs */}
      <div className="flex flex-wrap gap-2">
        {([
          { key: 'all' as const, label: 'All', count: stats.total },
          { key: 'draft' as const, label: 'Draft', count: stats.draft },
          { key: 'pending' as const, label: 'Pending', count: stats.pending },
          { key: 'paid' as const, label: 'Paid', count: stats.paid },
          { key: 'overdue' as const, label: 'Overdue', count: stats.overdue },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              statusFilter === tab.key
                ? 'bg-teal-500/20 text-teal-400'
                : 'bg-midnight-700/50 text-midnight-300 hover:bg-midnight-700'
            }`}
          >
            {tab.label}
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-midnight-800">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-midnight-400" />
          <input
            type="text"
            placeholder="Search invoices..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="input-field pl-12"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => toggleSort('date')}
            className={`btn-secondary flex items-center gap-2 ${sortBy === 'date' ? 'border-teal-500' : ''}`}
          >
            <Calendar className="w-4 h-4" />
            Date
            {sortBy === 'date' && (sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />)}
          </button>
          <button
            onClick={() => toggleSort('amount')}
            className={`btn-secondary flex items-center gap-2 ${sortBy === 'amount' ? 'border-teal-500' : ''}`}
          >
            Amount
            {sortBy === 'amount' && (sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />)}
          </button>
        </div>
      </div>

      {/* Invoices List */}
      {filteredInvoices.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="w-16 h-16 text-midnight-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No invoices found</h3>
          <p className="text-midnight-400 mb-6">
            {searchQuery || statusFilter !== 'all' ? 'Try adjusting your search or filters' : 'Create your first invoice to get started'}
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <Link to="/invoices/new" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create Invoice
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredInvoices.map((invoice) => {
            const totals = calculateInvoiceTotals(invoice.items, invoice.taxRate, invoice.discount);
            return (
              <div key={invoice.id} className="glass rounded-xl p-4 sm:p-6 card-hover animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <Link
                        to={`/invoices/view/${invoice.id}`}
                        className="text-lg font-semibold text-white hover:text-teal-400 transition-colors truncate"
                      >
                        {invoice.customerName}
                      </Link>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                        {getStatusLabel(invoice.status)}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-midnight-400">
                      <span className="font-mono">{invoice.invoiceNumber}</span>
                      <span>•</span>
                      <span>{formatDate(invoice.date)}</span>
                      {invoice.items.length > 0 && (
                        <>
                          <span>•</span>
                          <span>{invoice.items.length} item{invoice.items.length > 1 ? 's' : ''}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-mono font-bold text-white">
                        {formatCurrency(totals.total, business.currency)}
                      </p>
                    </div>

                    <div className="relative">
                      <button
                        onClick={() => setActiveMenu(activeMenu === invoice.id ? null : invoice.id)}
                        className="p-2 rounded-lg hover:bg-midnight-700 transition-colors"
                      >
                        <MoreVertical className="w-5 h-5 text-midnight-400" />
                      </button>

                      {activeMenu === invoice.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)} />
                          <div className="absolute right-0 top-full mt-2 w-48 bg-midnight-800 border border-midnight-600 rounded-xl shadow-lg overflow-hidden z-20">
                            <Link
                              to={`/invoices/view/${invoice.id}`}
                              className="flex items-center gap-3 px-4 py-3 text-white hover:bg-midnight-700 transition-colors"
                              onClick={() => setActiveMenu(null)}
                            >
                              <Eye className="w-4 h-4 text-midnight-400" />
                              View Invoice
                            </Link>
                            <Link
                              to={`/invoices/edit/${invoice.id}`}
                              className="flex items-center gap-3 px-4 py-3 text-white hover:bg-midnight-700 transition-colors"
                              onClick={() => setActiveMenu(null)}
                            >
                              <Edit className="w-4 h-4 text-midnight-400" />
                              Edit Invoice
                            </Link>
                            <button
                              onClick={() => handleDownloadPDF(invoice)}
                              className="flex items-center gap-3 px-4 py-3 text-white hover:bg-midnight-700 transition-colors w-full"
                            >
                              <Download className="w-4 h-4 text-midnight-400" />
                              Download PDF
                            </button>
                            <button
                              onClick={() => {
                                setDeleteConfirm(invoice.id);
                                setActiveMenu(null);
                              }}
                              className="flex items-center gap-3 px-4 py-3 text-coral-400 hover:bg-coral-500/10 transition-colors w-full"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="glass rounded-2xl p-6 max-w-md w-full animate-scale-in">
            <h3 className="text-xl font-semibold text-white mb-2">Delete Invoice?</h3>
            <p className="text-midnight-400 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="btn-danger">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Invoices;
