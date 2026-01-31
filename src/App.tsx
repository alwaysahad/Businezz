import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SyncProvider } from './contexts/SyncProvider';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import { Loader2 } from 'lucide-react';

// Lazy load all page components for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Invoices = lazy(() => import('./pages/Invoices'));
const CreateInvoice = lazy(() => import('./pages/CreateInvoice'));
const ViewInvoice = lazy(() => import('./pages/ViewInvoice'));
const Products = lazy(() => import('./pages/Products'));
const Customers = lazy(() => import('./pages/Customers'));
const Settings = lazy(() => import('./pages/Settings'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));

// Loading fallback component
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-teal-400 animate-spin mx-auto mb-4" />
        <p className="text-midnight-400">Loading...</p>
      </div>
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
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              {/* Protected Routes */}
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Suspense fallback={<PageLoader />}>
                        <Routes>
                          <Route path="/" element={<Dashboard />} />
                          <Route path="/invoices" element={<Invoices />} />
                          <Route path="/invoices/new" element={<CreateInvoice />} />
                          <Route path="/invoices/edit/:id" element={<CreateInvoice />} />
                          <Route path="/invoices/view/:id" element={<ViewInvoice />} />
                          <Route path="/products" element={<Products />} />
                          <Route path="/customers" element={<Customers />} />
                          <Route path="/settings" element={<Settings />} />
                        </Routes>
                      </Suspense>
                    </Layout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Suspense>
        </SyncProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
