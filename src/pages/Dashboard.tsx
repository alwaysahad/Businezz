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
  Loader2,
  LayoutDashboard,
  Users,
  ListOrdered,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import {
  formatCurrency,
  getRelativeTime,
  calculateInvoiceTotals,
  getStatusColor,
  getStatusLabel,
  getGreetingNameFromBusinessName,
} from '../utils/helpers';
import type { DashboardStats, Invoice } from '../types';
import { useInvoices, useBusiness } from '../hooks/useData';
import { Skeleton } from '../components/ui/Skeleton';

function customerInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0][0];
    const b = parts[parts.length - 1][0];
    if (a && b) return (a + b).toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase() || '?';
}

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subtext?: string;
  iconWrap: string;
  delay: number;
}

function StatCard({ icon: Icon, label, value, subtext, iconWrap, delay }: StatCardProps) {
  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-midnight-800/40 p-5 sm:p-6 shadow-sm transition-all duration-300 hover:border-teal-500/20 hover:bg-midnight-800/60 hover:shadow-md card-hover animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-midnight-400 text-xs font-medium uppercase tracking-wide">{label}</p>
          <p className="mt-2 text-2xl font-display font-bold tabular-nums text-white sm:text-3xl">{value}</p>
          {subtext && <p className="mt-1.5 text-sm leading-snug text-midnight-300">{subtext}</p>}
        </div>
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 ring-white/10 ${iconWrap}`}
        >
          <Icon className="h-6 w-6" strokeWidth={1.75} />
        </div>
      </div>
    </div>
  );
}

interface QuickActionRowProps {
  to: string;
  title: string;
  description: string;
  icon: LucideIcon;
  highlight?: boolean;
}

function QuickActionRow({ to, title, description, icon: Icon, highlight }: QuickActionRowProps) {
  return (
    <Link
      to={to}
      className={`group flex items-center gap-3 rounded-xl border p-3.5 transition-all hover:border-white/10 hover:bg-white/[0.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500/60 sm:p-4 ${
        highlight
          ? 'border-teal-500/25 bg-teal-500/[0.06] shadow-[inset_0_0_0_1px_rgba(49,151,149,0.12)]'
          : 'border-white/[0.04]'
      }`}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black/20 ring-1 ring-white/10 transition-transform group-hover:scale-105">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-white">{title}</p>
        <p className="text-sm text-midnight-400">{description}</p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-midnight-500 transition-transform group-hover:translate-x-0.5 group-hover:text-teal-400/80" />
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-4 lg:space-y-10 animate-fade-in">
      {/* Hero Skeleton */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-midnight-800/40 p-6 sm:flex sm:items-end sm:justify-between sm:p-8">
        <div className="relative max-w-xl">
          <Skeleton className="h-6 w-24 mb-4 rounded-full" />
          <Skeleton className="h-10 w-64 sm:w-96 mb-3" />
          <Skeleton className="h-5 w-48 sm:w-80" />
        </div>
        <div className="mt-6 shrink-0 sm:mt-0 sm:ml-6">
          <Skeleton className="h-12 w-full sm:w-32" />
        </div>
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/[0.06] bg-midnight-800/40 p-5 sm:p-6 flex justify-between items-start">
            <div className="flex-1">
              <Skeleton className="h-3 w-16 mb-4" />
              <Skeleton className="h-8 w-24 mb-3" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-12 w-12 rounded-2xl shrink-0" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
        {/* Quick actions skeleton */}
        <section className="lg:col-span-5 xl:col-span-4">
          <div className="glass h-full rounded-2xl border border-white/[0.04] p-5 sm:p-6">
            <Skeleton className="h-6 w-32 mb-6" />
            <div className="flex flex-col gap-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3.5 border border-white/[0.04] rounded-xl">
                  <Skeleton className="h-11 w-11 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Recent invoices skeleton */}
        <section className="lg:col-span-7 xl:col-span-8">
          <div className="glass h-full rounded-2xl border border-white/[0.04] p-5 sm:p-6">
            <div className="mb-5 flex justify-between">
               <Skeleton className="h-6 w-36" />
               <Skeleton className="h-5 w-16" />
            </div>
            <ul className="divide-y divide-white/[0.06]">
              {[...Array(6)].map((_, i) => (
                <li key={i} className="flex items-center gap-3 py-3.5 pl-1 pr-2 sm:gap-4 sm:py-4">
                  <Skeleton className="h-11 w-11 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <div className="shrink-0">
                    <Skeleton className="h-5 w-20" />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}

function Dashboard() {
  const { business, loading: businessLoading } = useBusiness();
  const { invoices, loading: invoicesLoading } = useInvoices();
  const loading = businessLoading || invoicesLoading;

  const stats = useMemo((): DashboardStats => {
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

  const recentInvoices = useMemo((): Invoice[] => {
    return [...invoices]
      .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
      .slice(0, 6);
  }, [invoices]);

  const greetingName = getGreetingNameFromBusinessName(business.name);
  const welcomeLine = greetingName ? `Welcome back, ${greetingName}!` : 'Welcome back!';

  if (loading && invoices.length === 0) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-4 lg:space-y-10">
      {/* Hero */}
      <header className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-midnight-800/90 via-midnight-900/40 to-midnight-950/80 p-6 sm:flex sm:items-end sm:justify-between sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-teal-500/15 blur-3xl sm:-right-8 sm:-top-20" />
        <div className="pointer-events-none absolute bottom-0 left-1/4 h-32 w-32 rounded-full bg-gold-500/5 blur-2xl" />
        <div className="relative max-w-xl">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-midnight-300">
            <LayoutDashboard className="h-3.5 w-3.5 text-teal-400" aria-hidden />
            Overview
          </div>
          <h1 className="font-display text-3xl font-bold leading-tight text-white sm:text-4xl">{welcomeLine}</h1>
          <p className="mt-2 max-w-md text-midnight-300">
            Track revenue, pending amounts, and open invoices at a glance. Create a new invoice in one tap.
          </p>
        </div>
        <div className="relative mt-6 shrink-0 sm:mt-0 sm:ml-6">
          <Link
            to="/invoices/new"
            className="btn-primary inline-flex w-full items-center justify-center gap-2 px-6 py-3.5 text-base shadow-lg shadow-teal-900/20 sm:w-auto"
          >
            <Plus className="h-5 w-5" aria-hidden />
            New invoice
          </Link>
        </div>
      </header>

      {/* Stats */}
      <section aria-labelledby="dashboard-stats-heading" className="space-y-3">
        <h2 id="dashboard-stats-heading" className="sr-only">
          Invoice statistics
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={FileText}
            label="Total invoices"
            value={stats.totalInvoices}
            subtext={`${stats.paidCount} paid`}
            iconWrap="bg-teal-500/15 text-teal-300"
            delay={0}
          />
          <StatCard
            icon={IndianRupee}
            label="Total revenue"
            value={formatCurrency(stats.totalRevenue, business.currency)}
            subtext={`This month: ${formatCurrency(stats.thisMonthRevenue, business.currency)}`}
            iconWrap="bg-gold-500/15 text-gold-300"
            delay={80}
          />
          <StatCard
            icon={Clock}
            label="Pending"
            value={stats.pendingCount}
            subtext={`Outstanding ${formatCurrency(stats.pendingAmount, business.currency)}`}
            iconWrap="bg-midnight-600/80 text-midnight-200"
            delay={160}
          />
          <StatCard
            icon={AlertCircle}
            label="Overdue"
            value={stats.overdueCount}
            subtext={stats.overdueCount === 0 ? 'You’re all caught up' : 'Needs follow-up'}
            iconWrap="bg-coral-500/15 text-coral-300"
            delay={240}
          />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
        {/* Quick actions */}
        <section
          className="lg:col-span-5 xl:col-span-4"
          aria-labelledby="quick-actions-heading"
        >
          <div className="glass h-full rounded-2xl border border-white/[0.04] p-5 sm:p-6 animate-slide-up" style={{ animationDelay: '320ms' }}>
            <div className="mb-5 flex items-center justify-between gap-2">
              <h2 id="quick-actions-heading" className="font-display text-lg font-semibold text-white">
                Quick actions
              </h2>
            </div>
            <div className="flex flex-col gap-2">
              <QuickActionRow
                to="/invoices/new"
                title="Create invoice"
                description="New bill for a customer"
                icon={Plus}
                highlight
              />
              <QuickActionRow
                to="/invoices"
                title="All invoices"
                description="Search, filter, and manage"
                icon={ListOrdered}
              />
              <QuickActionRow
                to="/products"
                title="Products"
                description="Pricing and catalog"
                icon={TrendingUp}
              />
              <QuickActionRow
                to="/customers"
                title="Customers"
                description="Contacts and details"
                icon={Users}
              />
              <QuickActionRow
                to="/settings"
                title="Business & settings"
                description="Logo, tax, profile"
                icon={CheckCircle}
              />
            </div>
          </div>
        </section>

        {/* Recent invoices */}
        <section className="lg:col-span-7 xl:col-span-8" aria-labelledby="recent-invoices-heading">
          <div className="glass h-full rounded-2xl border border-white/[0.04] p-5 sm:p-6 animate-slide-up" style={{ animationDelay: '400ms' }}>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h2 id="recent-invoices-heading" className="font-display text-lg font-semibold text-white">
                Recent invoices
              </h2>
              <Link
                to="/invoices"
                className="inline-flex items-center gap-1 text-sm font-medium text-teal-400 transition-colors hover:text-teal-300"
              >
                View all
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>

            {recentInvoices.length === 0 ? (
              <div className="rounded-xl border border-dashed border-midnight-600 py-14 text-center">
                <FileText className="mx-auto mb-3 h-12 w-12 text-midnight-600" aria-hidden />
                <p className="text-midnight-400">No invoices yet</p>
                <Link
                  to="/invoices/new"
                  className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-teal-400 hover:text-teal-300"
                >
                  Create your first invoice
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-white/[0.06]">
                {recentInvoices.map((invoice) => {
                  const totals = calculateInvoiceTotals(invoice.items, invoice.taxRate, invoice.discount);
                  return (
                    <li key={invoice.id}>
                      <Link
                        to={`/invoices/view/${invoice.id}`}
                        className="group flex items-center gap-3 rounded-xl py-3.5 pl-1 pr-2 transition-colors hover:bg-white/[0.03] sm:gap-4 sm:py-4"
                      >
                        <div
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-midnight-600 to-midnight-700 text-xs font-bold text-white ring-1 ring-white/10"
                          aria-hidden
                        >
                          {customerInitials(invoice.customerName)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate font-medium text-white">{invoice.customerName}</p>
                            <span
                              className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(invoice.status)}`}
                            >
                              {getStatusLabel(invoice.status)}
                            </span>
                          </div>
                          <p className="mt-0.5 text-sm text-midnight-400">
                            <span className="font-mono text-midnight-300">{invoice.invoiceNumber}</span>
                            <span className="mx-1.5 text-midnight-600">·</span>
                            {getRelativeTime(invoice.createdAt || '')}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="font-mono text-sm font-semibold text-white tabular-nums sm:text-base">
                            {formatCurrency(totals.total, business.currency)}
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 shrink-0 text-midnight-600 transition-colors group-hover:text-teal-400/90 sm:ml-1" aria-hidden />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </div>

      {/* Empty onboarding */}
      {!business.name && invoices.length === 0 && !loading && (
        <div
          className="glass rounded-2xl border border-teal-500/20 p-8 text-center animate-slide-up sm:p-10"
          style={{ animationDelay: '480ms' }}
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 shadow-glow">
            <TrendingUp className="h-8 w-8 text-white" aria-hidden />
          </div>
          <h2 className="font-display text-2xl font-bold text-white">Get started</h2>
          <p className="mx-auto mt-2 max-w-md text-midnight-300">
            Add your business details and issue your first invoice in minutes.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link to="/settings" className="btn-primary inline-flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Set up business profile
            </Link>
            <Link to="/invoices/new" className="btn-secondary inline-flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create first invoice
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
