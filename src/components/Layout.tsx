import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Package,
  Users,
  Settings,
  Menu,
  X,
  Plus,
  Receipt,
  type LucideIcon,
} from 'lucide-react';

interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/invoices', label: 'Invoices', icon: FileText },
  { path: '/products', label: 'Products', icon: Package },
  { path: '/customers', label: 'Customers', icon: Users },
  { path: '/settings', label: 'Settings', icon: Settings },
];

interface LayoutProps {
  children: ReactNode;
}

function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string): boolean => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out lg:transform-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-full flex flex-col glass rounded-r-2xl lg:rounded-2xl m-0 lg:m-4">
          {/* Logo */}
          <div className="p-6 border-b border-white/10">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-glow">
                <Receipt className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-display font-bold text-white">InvoiceFlow</h1>
                <p className="text-xs text-midnight-400">Smart Billing</p>
              </div>
            </Link>
          </div>

          {/* New Invoice Button */}
          <div className="p-4">
            <Link
              to="/invoices/new"
              className="flex items-center justify-center gap-2 w-full btn-primary py-3"
              onClick={() => setSidebarOpen(false)}
            >
              <Plus className="w-5 h-5" />
              <span>New Invoice</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    active
                      ? 'bg-teal-500/20 text-teal-400'
                      : 'text-midnight-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${active ? 'text-teal-400' : ''}`} />
                  <span className="font-medium">{item.label}</span>
                  {active && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-400" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-white/10">
            <div className="text-center">
              <p className="text-xs text-midnight-400">
                Made with ❤️ for small businesses
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-screen lg:p-4">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between p-4 glass safe-area-top sticky top-0 z-30">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-white text-lg">InvoiceFlow</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-3 -mr-1 rounded-lg hover:bg-white/10 active:bg-white/20 transition-colors"
            aria-label="Toggle menu"
          >
            {sidebarOpen ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <Menu className="w-6 h-6 text-white" />
            )}
          </button>
        </header>

        {/* Page content */}
        <div className="flex-1 p-3 sm:p-4 lg:p-0 safe-area-bottom">
          <div className="glass rounded-2xl min-h-full p-4 sm:p-6 lg:p-8 animate-fade-in">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Layout;
