import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SyncProvider } from './contexts/SyncProvider';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import Layout from './components/Layout';
import OfflineIndicator from './components/OfflineIndicator';
import { Skeleton } from './components/ui/Skeleton';

// Lazy load all page components for code splitting
const Landing = lazy(() => import('./pages/Landing'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Invoices = lazy(() => import('./pages/Invoices'));
const Trash = lazy(() => import('./pages/Trash'));
const CreateInvoice = lazy(() => import('./pages/CreateInvoice'));
const ViewInvoice = lazy(() => import('./pages/ViewInvoice'));
const Products = lazy(() => import('./pages/Products'));
const Customers = lazy(() => import('./pages/Customers'));
const Settings = lazy(() => import('./pages/Settings'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));

// Loading fallback component
function PageLoader() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 p-4">
      <Skeleton className="h-14 w-14 shrink-0 rounded-2xl" />
      <Skeleton className="h-4 w-36 rounded-lg" />
      <Skeleton className="h-3 w-28 rounded-lg" />
    </div>
  );
}

function App() {
  // useEffect removed

  return (
    <Router>
      <AuthProvider>
        <SyncProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
              <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
              <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Suspense fallback={<PageLoader />}>
                        <Dashboard />
                      </Suspense>
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/invoices/*"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Suspense fallback={<PageLoader />}>
                        <Routes>
                          <Route path="/" element={<Invoices />} />
                          <Route path="/new" element={<CreateInvoice />} />
                          <Route path="/edit/:id" element={<CreateInvoice />} />
                          <Route path="/view/:id" element={<ViewInvoice />} />
                          <Route path="/trash" element={<Trash />} />
                        </Routes>
                      </Suspense>
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/products"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Suspense fallback={<PageLoader />}>
                        <Products />
                      </Suspense>
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customers"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Suspense fallback={<PageLoader />}>
                        <Customers />
                      </Suspense>
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Suspense fallback={<PageLoader />}>
                        <Settings />
                      </Suspense>
                    </Layout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Suspense>

          {/* Offline Indicator - Shows on all pages */}
          <OfflineIndicator />
        </SyncProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
