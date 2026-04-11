import { Navigate } from 'react-router-dom';
import { Receipt } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';

interface PublicRouteProps {
    children: React.ReactNode;
}

function PublicRoute({ children }: PublicRouteProps) {
    const { user, loading } = useAuth();

    // If Supabase is not configured, allow access (local-only mode)
    if (!isSupabaseConfigured) {
        return <>{children}</>;
    }

    // Show loading state while checking authentication
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-midnight-900 via-midnight-800 to-midnight-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 mb-6 animate-pulse">
                        <Receipt className="w-10 h-10 text-white" />
                    </div>
                </div>
            </div>
        );
    }

    // Redirect to dashboard if logged in
    if (user) {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
}

export default PublicRoute;
