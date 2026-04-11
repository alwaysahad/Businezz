import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';
import { Skeleton } from './ui/Skeleton';

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
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-midnight-900 via-midnight-800 to-midnight-900">
                <div className="flex flex-col items-center gap-4">
                    <Skeleton className="h-20 w-20 shrink-0 rounded-2xl" />
                    <Skeleton className="h-5 w-32 rounded-lg" />
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
