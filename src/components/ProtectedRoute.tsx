import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';
import { Skeleton } from './ui/Skeleton';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { user, loading } = useAuth();

    // If Supabase is not configured, allow access (local-only mode)
    if (!isSupabaseConfigured) {
        return <>{children}</>;
    }

    // Show loading state while checking authentication
    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-midnight-900 via-midnight-800 to-midnight-900">
                <div className="flex w-full max-w-xs flex-col items-center gap-4 px-6">
                    <Skeleton className="h-20 w-20 shrink-0 rounded-2xl" />
                    <Skeleton className="h-6 w-40 rounded-lg" />
                    <Skeleton className="h-4 w-48 rounded-lg" />
                </div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}

export default ProtectedRoute;
