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
import { UserAvatar } from './UserAvatar';

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  });
  const [userSidebarPreference, setUserSidebarPreference] = useState<boolean | null>(null);

  useEffect(() => {
    const isInvoicePage = location.pathname === '/invoices/new' || location.pathname.startsWith('/invoices/edit/');

    if (isInvoicePage) {
      if (userSidebarPreference === null) {
        setUserSidebarPreference(sidebarCollapsed);
      }
      setSidebarCollapsed(true);
    } else {
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

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const isActive = (path: string): boolean => {
    const { pathname } = location;
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  const handleSignOut = async () => {
    setUserMenuOpen(false);
    await signOut();
    navigate('/login', { replace: true });
  };

  const toggleDesktopSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="min-h-screen flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-midnight-950/70 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 will-change-[width,transform] transition-[width,transform] duration-sidebar ease-sidebar motion-reduce:transition-none motion-reduce:duration-0 group/sidebar ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${sidebarCollapsed ? 'w-72 lg:w-28' : 'w-72'}`}
      >
        <div
          className={`relative flex h-full lg:h-[calc(100%-2rem)] min-h-0 flex-col rounded-none border-r border-white/[0.07] bg-gradient-to-b from-midnight-800/95 via-midnight-900/98 to-midnight-950 shadow-[4px_0_24px_-4px_rgba(0,0,0,0.45)] backdrop-blur-xl lg:m-4 lg:rounded-2xl lg:border lg:border-white/[0.08] lg:shadow-2xl lg:shadow-black/50`}
        >
          {/* Desktop: logo only when sidebar expanded; collapse/expand always */}
          <div
            className={`hidden shrink-0 border-b border-white/[0.06] bg-midnight-950/20 lg:flex lg:items-center lg:rounded-t-2xl ${
              sidebarCollapsed ? 'lg:justify-center lg:px-3 lg:py-2.5' : 'lg:gap-3 lg:px-4 lg:py-3.5'
            }`}
          >
            {!sidebarCollapsed && (
              <Link
                to="/dashboard"
                className="flex min-w-0 flex-1 items-center gap-3 rounded-xl py-0.5 outline-none ring-teal-500/40 transition-colors focus-visible:ring-2"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-teal-700 shadow-md shadow-teal-900/30 ring-1 ring-white/15">
                  <Receipt className="h-5 w-5 shrink-0 text-white" />
                </div>
                <div className="min-w-0 flex flex-col justify-center">
                  <h1 className="font-brand text-lg font-bold leading-tight tracking-tight text-white">Businezz</h1>
                  <p className="mt-0.5 text-2xs font-medium uppercase leading-none tracking-wider text-midnight-400">
                    Smart billing
                  </p>
                </div>
              </Link>
            )}
            <button
              type="button"
              onClick={toggleDesktopSidebar}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-midnight-800/90 p-0 text-midnight-200 shadow-md shadow-black/20 backdrop-blur-sm transition-colors duration-200 ease-sidebar hover:border-teal-500/30 hover:bg-midnight-700 hover:text-white active:scale-[0.96] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500/50 ${
                sidebarCollapsed ? '' : 'lg:shrink-0'
              }`}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4 shrink-0 transition-transform duration-sidebar ease-sidebar" strokeWidth={2} /> : <ChevronLeft className="h-4 w-4 shrink-0 transition-transform duration-sidebar ease-sidebar" strokeWidth={2} />}
            </button>
          </div>

          {/* Primary CTA */}
          <div
            className={`shrink-0 transition-[padding] duration-sidebar ease-sidebar motion-reduce:transition-none ${
              sidebarCollapsed ? 'px-3 pt-2 lg:flex lg:justify-center lg:px-3 lg:pt-1.5' : 'px-3 pt-3'
            }`}
          >
            <Link
              to="/invoices/new"
              onClick={() => setSidebarOpen(false)}
              title={sidebarCollapsed ? 'New invoice' : undefined}
              className={`group/cta relative flex w-full min-w-0 items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-950/40 ring-1 ring-white/10 transition-all duration-sidebar ease-sidebar hover:from-teal-400 hover:to-teal-500 hover:shadow-teal-500/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-400 active:scale-[0.98] ${
                sidebarCollapsed ? 'lg:mx-auto lg:h-10 lg:w-10 lg:p-0' : 'px-4'
              }`}
            >
              <Plus
                className={`shrink-0 text-white transition-transform group-hover/cta:scale-110 ${
                  sidebarCollapsed ? 'h-5 w-5' : 'h-5 w-5'
                }`}
              />
              <span className={`truncate ${sidebarCollapsed ? 'lg:hidden' : ''}`}>New invoice</span>
            </Link>
          </div>

          {/* Nav */}
          <nav
            aria-label="Main navigation"
            className={`min-h-0 flex-1 overflow-y-auto overflow-x-hidden py-4 transition-[padding] duration-sidebar ease-sidebar motion-reduce:transition-none ${
              sidebarCollapsed
                ? 'flex flex-col space-y-2 px-3 lg:items-center lg:space-y-2 lg:px-3'
                : 'space-y-1 px-3'
            }`}
          >
            <p
              className={`mb-2 px-2 text-2xs font-semibold uppercase tracking-widest text-midnight-500 transition-all duration-sidebar ease-sidebar ${
                sidebarCollapsed ? 'lg:h-0 lg:overflow-hidden lg:opacity-0 lg:mb-0' : ''
              }`}
            >
              Workspace
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={`group/nav relative flex items-center gap-3 rounded-xl text-sm font-medium transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500/60 ${
                    sidebarCollapsed
                      ? active
                        ? 'justify-center px-0 py-1 text-white lg:bg-transparent lg:shadow-none lg:ring-0'
                        : 'justify-center px-0 py-1 text-midnight-300 hover:text-white lg:hover:bg-white/[0.04]'
                      : active
                        ? 'bg-gradient-to-r from-teal-500/20 to-teal-600/5 px-3 py-2.5 text-white shadow-inner shadow-teal-950/20 ring-1 ring-teal-500/25'
                        : 'px-3 py-2.5 text-midnight-300 hover:bg-white/[0.04] hover:text-white'
                  }`}
                >
                  <span
                    className={`flex shrink-0 items-center justify-center rounded-xl transition-all ${
                      sidebarCollapsed ? 'h-10 w-10' : 'h-9 w-9 rounded-lg'
                    } ${
                      active
                        ? 'bg-teal-500/25 text-teal-100 ring-1 ring-teal-400/35 shadow-[0_0_0_1px_rgba(45,212,191,0.12)]'
                        : 'bg-white/[0.05] text-midnight-400 group-hover/nav:bg-white/[0.08] group-hover/nav:text-midnight-200'
                    }`}
                  >
                    <Icon
                      className={sidebarCollapsed ? 'h-5 w-5' : 'h-[1.125rem] w-[1.125rem]'}
                      strokeWidth={active ? 2.25 : 2}
                    />
                  </span>
                  <span
                    className={`min-w-0 truncate transition-all duration-sidebar ease-sidebar ${
                      sidebarCollapsed ? 'lg:hidden' : 'flex-1'
                    }`}
                  >
                    {item.label}
                  </span>
                  {active && !sidebarCollapsed && (
                    <span
                      className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-teal-400 shadow-[0_0_12px_rgba(45,212,191,0.45)]"
                      aria-hidden
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer: sync + user */}
          <div
            className={`shrink-0 space-y-3 border-t border-white/[0.06] bg-midnight-950/30 transition-[padding] duration-sidebar ease-sidebar motion-reduce:transition-none lg:rounded-b-2xl ${
              sidebarCollapsed ? 'p-3 lg:px-2.5 lg:py-3' : 'px-3 pb-4 pt-3'
            }`}
          >
            {isSupabaseConfigured && user ? (
              <div className={`space-y-3 ${sidebarCollapsed ? 'lg:flex lg:flex-col lg:items-center' : ''}`}>
                <div
                  className={`flex items-center gap-2 rounded-xl border border-white/[0.08] bg-midnight-900/50 transition-all duration-sidebar ease-sidebar ${
                    sidebarCollapsed
                      ? 'justify-center px-3 py-2 lg:mx-auto lg:h-10 lg:w-10 lg:px-0 lg:py-0'
                      : 'px-3 py-2'
                  }`}
                  title={sidebarCollapsed ? (syncStatus === 'synced' ? 'Synced' : syncStatus === 'syncing' ? 'Syncing' : 'Idle') : undefined}
                >
                  {syncStatus === 'synced' ? (
                    <>
                      <CheckCircle className={`shrink-0 text-emerald-400 ${sidebarCollapsed ? 'h-5 w-5' : 'h-4 w-4'}`} />
                      <span
                        className={`text-2xs font-semibold uppercase tracking-wide text-emerald-400/90 ${
                          sidebarCollapsed ? 'lg:hidden' : ''
                        }`}
                      >
                        Synced
                      </span>
                    </>
                  ) : syncStatus === 'syncing' ? (
                    <>
                      <Cloud className={`shrink-0 animate-pulse text-sky-400 ${sidebarCollapsed ? 'h-5 w-5' : 'h-4 w-4'}`} />
                      <span
                        className={`text-2xs font-semibold uppercase tracking-wide text-sky-400 ${
                          sidebarCollapsed ? 'lg:hidden' : ''
                        }`}
                      >
                        Syncing…
                      </span>
                    </>
                  ) : (
                    <>
                      <Cloud className={`shrink-0 text-midnight-500 ${sidebarCollapsed ? 'h-5 w-5' : 'h-4 w-4'}`} />
                      <span
                        className={`text-2xs font-medium uppercase tracking-wide text-midnight-500 ${
                          sidebarCollapsed ? 'lg:hidden' : ''
                        }`}
                      >
                        Idle
                      </span>
                    </>
                  )}
                </div>

                <div className={`relative ${sidebarCollapsed ? 'lg:flex lg:w-full lg:justify-center' : 'w-full'}`}>
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className={`flex items-center gap-3 rounded-xl border border-white/[0.06] bg-midnight-900/40 text-left transition-colors hover:border-white/[0.1] hover:bg-white/[0.05] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500/50 ${
                      sidebarCollapsed
                        ? 'w-full justify-center px-0 py-2 lg:mx-auto lg:h-10 lg:w-10 lg:shrink-0 lg:p-0'
                        : 'w-full px-2 py-2'
                    }`}
                    title={sidebarCollapsed ? user.email || 'Account' : undefined}
                    aria-expanded={userMenuOpen}
                    aria-haspopup="menu"
                  >
                    <UserAvatar
                      user={user}
                      size="sm"
                      className={`shrink-0 ring-2 ring-white/10 transition-all ${sidebarCollapsed ? '!h-8 !w-8 lg:!h-8 lg:!w-8' : ''}`}
                    />
                    <div className={`min-w-0 flex-1 ${sidebarCollapsed ? 'lg:hidden' : ''}`}>
                      <p className="truncate text-sm font-medium text-white">{user.email}</p>
                      <p className="text-2xs font-medium text-midnight-500">Account</p>
                    </div>
                  </button>

                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} aria-hidden />
                      <div
                        className={`absolute z-50 min-w-[11rem] animate-fade-in rounded-xl border border-white/10 bg-midnight-900/95 py-1 shadow-xl shadow-black/40 backdrop-blur-md ${
                          sidebarCollapsed ? 'bottom-0 left-[calc(100%+10px)] lg:bottom-auto lg:left-full lg:ml-2 lg:mt-0' : 'bottom-full left-0 right-0 mb-2'
                        }`}
                        role="menu"
                      >
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => void handleSignOut()}
                          className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-coral-400 transition-colors hover:bg-coral-500/10"
                        >
                          <LogOut className="h-4 w-4 shrink-0" />
                          Sign out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className={`text-center transition-all duration-sidebar ease-sidebar ${sidebarCollapsed ? 'lg:px-0' : ''}`}>
                {isSupabaseConfigured ? (
                  <div className="space-y-2">
                    <CloudOff className="mx-auto h-6 w-6 text-midnight-600" />
                    <p
                      className={`text-2xs text-midnight-500 transition-all duration-sidebar ease-sidebar ${
                        sidebarCollapsed ? 'lg:h-0 lg:overflow-hidden lg:opacity-0' : ''
                      }`}
                    >
                      Not signed in
                    </p>
                  </div>
                ) : (
                  <p
                    className={`text-2xs leading-relaxed text-midnight-500 transition-all duration-sidebar ease-sidebar ${
                      sidebarCollapsed ? 'lg:h-0 lg:overflow-hidden lg:opacity-0' : ''
                    }`}
                  >
                    Made with care for small businesses
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </aside>

      <main
        className={`flex min-h-screen min-w-0 flex-1 flex-col transition-[margin] duration-sidebar ease-sidebar motion-reduce:transition-none motion-reduce:duration-0 ${
          sidebarCollapsed ? 'lg:ml-28' : 'lg:ml-72'
        }`}
      >
        <header className="safe-area-top sticky top-0 z-30 flex items-center justify-between border-b border-white/[0.06] bg-midnight-900/80 px-4 py-3 backdrop-blur-lg lg:hidden">
          <Link to="/dashboard" className="flex min-w-0 items-center gap-2.5 rounded-lg outline-none ring-teal-500/40 focus-visible:ring-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-teal-700 shadow-md ring-1 ring-white/10">
              <Receipt className="h-5 w-5 text-white" />
            </div>
            <span className="truncate font-brand text-lg font-bold tracking-tight text-white">Businezz</span>
          </Link>
          <div className="flex shrink-0 items-center gap-1">
            {isSupabaseConfigured && user && (
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="relative rounded-xl p-2 text-white transition-colors hover:bg-white/10 active:bg-white/15"
                aria-label="Account menu"
                aria-expanded={userMenuOpen}
              >
                <UserAvatar user={user} size="sm" className="!h-9 !w-9 ring-2 ring-white/15" />
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} aria-hidden />
                    <div className="absolute right-0 top-full z-50 mt-2 min-w-[14rem] animate-fade-in rounded-xl border border-white/10 bg-midnight-900/95 py-1 shadow-xl backdrop-blur-md">
                      <div className="border-b border-white/10 px-3 py-2.5">
                        <p className="truncate text-sm font-medium text-white">{user.email}</p>
                        <p className="text-2xs font-medium text-midnight-500">Account</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleSignOut()}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium text-coral-400 transition-colors hover:bg-coral-500/10"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </button>
            )}
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-xl p-3 text-white transition-colors hover:bg-white/10 active:bg-white/15"
              aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={sidebarOpen}
            >
              {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </header>

        <div className="flex-1 p-3 sm:p-4 lg:p-4 safe-area-bottom">
          <div className="glass min-h-full rounded-2xl border border-white/[0.06] p-4 sm:p-6 lg:p-8 animate-fade-in">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Layout;
