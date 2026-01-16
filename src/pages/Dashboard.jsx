import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  ArrowRight,
  IndianRupee,
} from 'lucide-react';
import { invoiceStorage, businessStorage } from '../utils/storage';
import { formatCurrency, formatDate, getRelativeTime, calculateInvoiceTotals, getStatusColor, getStatusLabel } from '../utils/helpers';

function StatCard({ icon: Icon, label, value, subtext, color, delay }) {
  return (
    <div className="glass rounded-2xl p-6 card-hover animate-slide-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-midnight-400 text-sm font-medium">{label}</p>
          <p className="text-3xl font-display font-bold text-white mt-2">{value}</p>
          {subtext && <p className="text-midnight-400 text-sm mt-1">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const business = businessStorage.get();
  const invoices = invoiceStorage.getAll();

  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    let totalRevenue = 0;
    let pendingAmount = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let overdueCount = 0;
    let thisMonthRevenue = 0;

    invoices.forEach((invoice) => {
      const totals = calculateInvoiceTotals(invoice.items, invoice.taxRate, invoice.discount);
      const invoiceDate = new Date(invoice.date);

      if (invoice.status === 'paid') {
        totalRevenue += totals.total;
        paidCount++;
        if (invoiceDate.getMonth() === thisMonth && invoiceDate.getFullYear() === thisYear) {
          thisMonthRevenue += totals.total;
        }
      } else if (invoice.status === 'pending') {
        pendingAmount += totals.total;
        pendingCount++;
      } else if (invoice.status === 'overdue') {
        pendingAmount += totals.total;
        overdueCount++;
      }
    });

    return {
      totalInvoices: invoices.length,
      totalRevenue,
      pendingAmount,
      paidCount,
      pendingCount,
      overdueCount,
      thisMonthRevenue,
    };
  }, [invoices]);

  const recentInvoices = useMemo(() => {
    return [...invoices]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
  }, [invoices]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">
            Welcome back{business.name ? `, ${business.name.split(' ')[0]}` : ''}!
          </h1>
          <p className="text-midnight-400 mt-1">
            Here's what's happening with your invoices today.
          </p>
        </div>
        <Link to="/invoices/new" className="btn-primary flex items-center gap-2 self-start">
          <Plus className="w-5 h-5" />
          <span>New Invoice</span>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={FileText}
          label="Total Invoices"
          value={stats.totalInvoices}
          subtext={`${stats.paidCount} paid`}
          color="bg-teal-500/20 text-teal-400"
          delay={0}
        />
        <StatCard
          icon={IndianRupee}
          label="Total Revenue"
          value={formatCurrency(stats.totalRevenue, business.currency)}
          subtext={`This month: ${formatCurrency(stats.thisMonthRevenue, business.currency)}`}
          color="bg-gold-500/20 text-gold-400"
          delay={100}
        />
        <StatCard
          icon={Clock}
          label="Pending"
          value={stats.pendingCount}
          subtext={formatCurrency(stats.pendingAmount, business.currency)}
          color="bg-midnight-500/50 text-midnight-300"
          delay={200}
        />
        <StatCard
          icon={AlertCircle}
          label="Overdue"
          value={stats.overdueCount}
          subtext="Need attention"
          color="bg-coral-500/20 text-coral-400"
          delay={300}
        />
      </div>

      {/* Quick Actions & Recent Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="glass rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '400ms' }}>
          <h2 className="text-lg font-display font-semibold text-white mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              to="/invoices/new"
              className="flex items-center gap-3 p-4 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 transition-colors group"
            >
              <div className="p-2 rounded-lg bg-teal-500/20">
                <Plus className="w-5 h-5 text-teal-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">Create Invoice</p>
                <p className="text-sm text-midnight-400">Generate a new invoice</p>
              </div>
              <ArrowRight className="w-5 h-5 text-teal-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            <Link
              to="/products"
              className="flex items-center gap-3 p-4 rounded-xl bg-gold-500/10 hover:bg-gold-500/20 transition-colors group"
            >
              <div className="p-2 rounded-lg bg-gold-500/20">
                <TrendingUp className="w-5 h-5 text-gold-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">Manage Products</p>
                <p className="text-sm text-midnight-400">Add or edit products</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gold-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            <Link
              to="/settings"
              className="flex items-center gap-3 p-4 rounded-xl bg-midnight-600/50 hover:bg-midnight-600 transition-colors group"
            >
              <div className="p-2 rounded-lg bg-midnight-500">
                <CheckCircle className="w-5 h-5 text-midnight-300" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">Business Profile</p>
                <p className="text-sm text-midnight-400">Update your details</p>
              </div>
              <ArrowRight className="w-5 h-5 text-midnight-300 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="lg:col-span-2 glass rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '500ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-display font-semibold text-white">Recent Invoices</h2>
            <Link to="/invoices" className="text-teal-400 text-sm hover:text-teal-300 flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {recentInvoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-midnight-500 mx-auto mb-4" />
              <p className="text-midnight-400">No invoices yet</p>
              <Link to="/invoices/new" className="text-teal-400 text-sm hover:text-teal-300 mt-2 inline-block">
                Create your first invoice
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentInvoices.map((invoice) => {
                const totals = calculateInvoiceTotals(invoice.items, invoice.taxRate, invoice.discount);
                return (
                  <Link
                    key={invoice.id}
                    to={`/invoices/view/${invoice.id}`}
                    className="flex items-center gap-4 p-4 rounded-xl bg-midnight-800/50 hover:bg-midnight-800 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white truncate">{invoice.customerName}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                          {getStatusLabel(invoice.status)}
                        </span>
                      </div>
                      <p className="text-sm text-midnight-400 mt-1">
                        {invoice.invoiceNumber} • {getRelativeTime(invoice.createdAt)}
                      </p>
                    </div>
                    <p className="font-mono font-semibold text-white">
                      {formatCurrency(totals.total, business.currency)}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Empty State for New Users */}
      {!business.name && invoices.length === 0 && (
        <div className="glass rounded-2xl p-8 text-center animate-slide-up" style={{ animationDelay: '600ms' }}>
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center mx-auto mb-4 shadow-glow">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-display font-bold text-white mb-2">Get Started</h2>
          <p className="text-midnight-400 max-w-md mx-auto mb-6">
            Set up your business profile and start creating professional invoices in minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/settings" className="btn-primary flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Set Up Business Profile
            </Link>
            <Link to="/invoices/new" className="btn-secondary flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create First Invoice
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
