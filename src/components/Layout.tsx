import { useState, useEffect, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  LogOut,
  User,
  Cloud,
  CloudOff,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncProvider';
import { isSupabaseConfigured } from '../lib/supabase';

interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/invoices', label: 'Invoices', icon: FileText },
  { path: '/products', label: 'Products', icon: Package },
  { path: '/customers', label: 'Customers', icon: Users },
  { path: '/settings', label: 'Settings', icon: Settings },
];

interface LayoutProps {
  children: ReactNode;
}

function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile sidebar state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Load desktop sidebar state from localStorage
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  });
  const [userSidebarPreference, setUserSidebarPreference] = useState<boolean | null>(null);

  // Auto-collapse sidebar on invoice creation/edit pages
  useEffect(() => {
    const isInvoicePage = location.pathname === '/invoices/new' || location.pathname.startsWith('/invoices/edit/');

    if (isInvoicePage) {
      // Save user's current preference if not already saved
      if (userSidebarPreference === null) {
        setUserSidebarPreference(sidebarCollapsed);
      }
      // Auto-collapse sidebar
      setSidebarCollapsed(true);
    } else {
      // Restore user's preference when leaving invoice pages
      if (userSidebarPreference !== null) {
        setSidebarCollapsed(userSidebarPreference);
        setUserSidebarPreference(null);
      }
    }
  }, [location.pathname]);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { syncStatus } = useSync();

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const isActive = (path: string): boolean => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const toggleDesktopSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
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
        className={`fixed lg:static inset-y-0 left-0 z-50 transform transition-all duration-300 ease-in-out group ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          } ${sidebarCollapsed ? 'lg:w-24' : 'w-72'}`}
      >
        <div className="h-full flex flex-col glass rounded-r-2xl lg:rounded-2xl m-0 lg:m-4 relative">
          {/* Logo */}
          <div className={`p-6 border-b border-white/10 transition-all duration-300 ${sidebarCollapsed ? 'lg:p-4 lg:pb-4' : ''}`}>
            <Link to="/dashboard" className={`flex items-center ${sidebarCollapsed ? 'lg:justify-center' : 'gap-3'}`}>
              <div className={`rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-glow transition-all duration-300 ${sidebarCollapsed ? 'lg:w-12 lg:h-12' : 'w-10 h-10'}`}>
                <Receipt className={`text-white transition-all duration-300 ${sidebarCollapsed ? 'lg:w-6 lg:h-6' : 'w-5 h-5'}`} />
              </div>
              <div className={`transition-all duration-300 overflow-hidden ${sidebarCollapsed ? 'lg:w-0 lg:opacity-0' : 'w-auto opacity-100'}`}>
                <h1 className="text-xl font-brand font-bold text-white whitespace-nowrap tracking-tight">Businezz</h1>
                <p className="text-xs text-midnight-400 whitespace-nowrap">Smart Billing</p>
              </div>
            </Link>
          </div>

          {/* New Invoice Button */}
          <div className={`p-4 transition-all duration-300 ${sidebarCollapsed ? 'lg:px-3 lg:py-4' : ''}`}>
            <Link
              to="/invoices/new"
              className={`flex items-center justify-center gap-2 btn-primary rounded-xl transition-all duration-300 hover:shadow-glow ${sidebarCollapsed ? 'lg:w-12 lg:h-12 lg:p-0 lg:mx-auto' : 'w-full py-3'}
                }`}
              onClick={() => setSidebarOpen(false)}
              title={sidebarCollapsed ? 'New Invoice' : ''}
            >
              <Plus className={`text-white transition-all duration-300 ${sidebarCollapsed ? 'lg:w-6 lg:h-6' : 'w-5 h-5'}`} />
              <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${sidebarCollapsed ? 'lg:w-0 lg:opacity-0' : 'w-auto opacity-100'}`}>New Invoice</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className={`flex-1 py-2 space-y-2 overflow-y-auto transition-all duration-300 ${sidebarCollapsed ? 'lg:px-3' : 'px-4'}`}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-xl transition-all duration-200 ${active
                    ? 'bg-teal-500/20 text-teal-400 shadow-lg shadow-teal-500/10'
                    : 'text-midnight-300 hover:bg-white/5 hover:text-white'
                    } ${sidebarCollapsed ? 'lg:justify-center lg:w-12 lg:h-12 lg:p-0' : 'px-4 py-3'}`}
                  title={sidebarCollapsed ? item.label : ''}
                >
                  <Icon className={`transition-all duration-200 ${active ? 'text-teal-400' : ''} ${sidebarCollapsed ? 'lg:w-6 lg:h-6' : 'w-5 h-5'}`} />
                  <span className={`font-medium transition-all duration-300 overflow-hidden whitespace-nowrap ${sidebarCollapsed ? 'lg:w-0 lg:opacity-0' : 'w-auto opacity-100'}`}>
                    {item.label}
                  </span>
                  {active && !sidebarCollapsed && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-400 lg:block hidden animate-pulse" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Menu / Footer */}
          <div className={`p-4 border-t border-white/10 transition-all duration-300 ${sidebarCollapsed ? 'lg:px-3 lg:py-4' : ''}`}>
            {isSupabaseConfigured && user ? (
              <div className="space-y-3">
                {/* Sync Status */}
                <div className={`flex items-center gap-2 rounded-lg bg-midnight-800/50 transition-all duration-300 ${sidebarCollapsed ? 'lg:justify-center lg:w-12 lg:h-12 lg:mx-auto' : 'px-3 py-2'}
                  }`}>
                  {syncStatus === 'synced' ? (
                    <>
                      <CheckCircle className={`text-teal-400 flex-shrink-0 transition-all duration-300 ${sidebarCollapsed ? 'lg:w-5 lg:h-5' : 'w-4 h-4'}`} />
                      <span className={`text-xs text-teal-400 transition-all duration-300 overflow-hidden whitespace-nowrap ${sidebarCollapsed ? 'lg:w-0 lg:opacity-0' : 'w-auto opacity-100'}`}>
                        Synced
                      </span>
                    </>
                  ) : syncStatus === 'syncing' ? (
                    <>
                      <Cloud className={`text-blue-400 animate-pulse flex-shrink-0 transition-all duration-300 ${sidebarCollapsed ? 'lg:w-5 lg:h-5' : 'w-4 h-4'}`} />
                      <span className={`text-xs text-blue-400 transition-all duration-300 overflow-hidden whitespace-nowrap ${sidebarCollapsed ? 'lg:w-0 lg:opacity-0' : 'w-auto opacity-100'}`}>
                        Syncing...
                      </span>
                    </>
                  ) : (
                    <>
                      <Cloud className={`text-midnight-400 flex-shrink-0 transition-all duration-300 ${sidebarCollapsed ? 'lg:w-5 lg:h-5' : 'w-4 h-4'}`} />
                      <span className={`text-xs text-midnight-400 transition-all duration-300 overflow-hidden whitespace-nowrap ${sidebarCollapsed ? 'lg:w-0 lg:opacity-0' : 'w-auto opacity-100'}`}>
                        Idle
                      </span>
                    </>
                  )}
                </div>

                {/* User Info */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className={`flex items-center gap-3 rounded-lg hover:bg-white/5 transition-all duration-300 ${sidebarCollapsed ? 'lg:justify-center lg:w-12 lg:h-12 lg:mx-auto' : 'w-full px-3 py-2'}
                      }`}
                    title={sidebarCollapsed ? user.email || 'Account' : ''}
                  >
                    <div className={`rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${sidebarCollapsed ? 'lg:w-10 lg:h-10' : 'w-8 h-8'}`}>
                      <User className={`text-white transition-all duration-300 ${sidebarCollapsed ? 'lg:w-5 lg:h-5' : 'w-4 h-4'}`} />
                    </div>
                    <div className={`flex-1 text-left transition-all duration-300 overflow-hidden ${sidebarCollapsed ? 'lg:w-0 lg:opacity-0' : 'w-auto opacity-100'}`}>
                      <p className="text-sm text-white font-medium truncate">{user.email}</p>
                      <p className="text-xs text-midnight-400 whitespace-nowrap">Account</p>
                    </div>
                  </button>

                  {/* Dropdown Menu */}
                  {userMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setUserMenuOpen(false)}
                      />
                      <div className={`absolute z-50 animate-fade-in glass rounded-lg shadow-lg ${sidebarCollapsed
                        ? 'lg:bottom-0 lg:left-[calc(100%+8px)] bottom-full left-0 right-0 mb-2'
                        : 'bottom-full left-0 right-0 mb-2'
                        }`}>
                        <button
                          onClick={handleSignOut}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-coral-400 hover:bg-coral-500/10 transition-colors ${sidebarCollapsed ? 'lg:w-auto' : 'w-full'
                            }`}
                        >
                          <LogOut className="w-4 h-4 flex-shrink-0" />
                          <span className="text-sm font-medium whitespace-nowrap">Sign Out</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className={`text-center transition-all duration-300 ${sidebarCollapsed ? 'lg:px-0' : ''}`}>
                {isSupabaseConfigured ? (
                  <div className="space-y-2">
                    <CloudOff className="w-6 h-6 text-midnight-500 mx-auto" />
                    <p className={`text-xs text-midnight-400 transition-all duration-300 overflow-hidden ${sidebarCollapsed ? 'lg:h-0 lg:opacity-0' : 'h-auto opacity-100'}`}>
                      Not signed in
                    </p>
                  </div>
                ) : (
                  <p className={`text-xs text-midnight-400 transition-all duration-300 overflow-hidden ${sidebarCollapsed ? 'lg:h-0 lg:opacity-0' : 'h-auto opacity-100'}`}>
                    Made with ❤️ for small businesses
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Desktop Sidebar Toggle Button - Integrated into sidebar edge */}
          <button
            onClick={toggleDesktopSidebar}
            className="hidden lg:flex absolute -right-3 top-4 items-center justify-center w-6 h-12 rounded-r-lg glass hover:bg-white/10 transition-all duration-300 shadow-lg opacity-0 group-hover:opacity-100 hover:!opacity-100 border-l-0"
            aria-label="Toggle sidebar"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4 text-white" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-white" />
            )}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-screen lg:p-4">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between p-4 glass safe-area-top sticky top-0 z-30">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <span className="font-brand font-bold text-white text-lg tracking-tight">Businezz</span>
          </Link>
          <div className="flex items-center gap-2">
            {isSupabaseConfigured && user && (
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="p-2 rounded-lg hover:bg-white/10 active:bg-white/20 transition-colors relative"
                aria-label="User menu"
              >
                <User className="w-5 h-5 text-white" />
                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute top-full right-0 mt-2 glass rounded-lg p-2 z-50 animate-fade-in min-w-[200px]">
                      <div className="px-3 py-2 border-b border-white/10 mb-2">
                        <p className="text-sm text-white font-medium truncate">{user.email}</p>
                        <p className="text-xs text-midnight-400">Account</p>
                      </div>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-coral-400 hover:bg-coral-500/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm font-medium">Sign Out</span>
                      </button>
                    </div>
                  </>
                )}
              </button>
            )}
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
          </div>
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
