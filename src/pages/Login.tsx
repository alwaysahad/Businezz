import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { Skeleton } from '../components/ui/Skeleton';

function Login() {
    const navigate = useNavigate();
    const { signIn, signInWithGoogle } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    const handleGoogleSignIn = async (): Promise<void> => {
        setError('');
        setGoogleLoading(true);
        try {
            const { error: oauthError } = await signInWithGoogle();
            if (oauthError) {
                setError(oauthError.message);
            }
        } finally {
            setGoogleLoading(false);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { error } = await signIn(email, password);
            if (error) {
                setError(error.message);
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-midnight-900 via-midnight-800 to-midnight-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-blue-500 mb-4">
                        <LogIn className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-display font-bold text-white mb-2">Welcome Back</h1>
                    <p className="text-midnight-400">Sign in to access your invoices</p>
                </div>

                {/* Login Form */}
                <div className="glass rounded-2xl p-8">
                    {isSupabaseConfigured && (
                        <>
                            <GoogleSignInButton
                                onClick={() => void handleGoogleSignIn()}
                                loading={googleLoading}
                                disabled={loading}
                                label="Continue with Google"
                            />
                            <div className="flex items-center gap-3 my-6">
                                <div className="flex-1 h-px bg-midnight-600" />
                                <span className="text-xs text-midnight-500 uppercase tracking-wide">or</span>
                                <div className="flex-1 h-px bg-midnight-600" />
                            </div>
                        </>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="flex items-center gap-3 p-4 bg-coral-500/20 border border-coral-500/30 rounded-xl text-coral-400">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <p className="text-sm">{error}</p>
                            </div>
                        )}

                        <div>
                            <label className="input-label">Email Address</label>
                            <div className="relative">
                                <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-midnight-500 pointer-events-none transition-opacity duration-200 ${email ? 'opacity-0' : 'opacity-100'}`} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input-field pl-11"
                                    placeholder=""
                                    required
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="input-label">Password</label>
                            <div className="relative">
                                <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-midnight-500 pointer-events-none transition-opacity duration-200 ${password ? 'opacity-0' : 'opacity-100'}`} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input-field pl-11"
                                    placeholder=""
                                    required
                                    autoComplete="current-password"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Skeleton className="h-5 w-5 shrink-0 rounded-full" />
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    <LogIn className="w-5 h-5" />
                                    Sign In
                                </>
                            )}
                        </button>
                    </form>

                    {/* Links */}
                    <div className="mt-6 space-y-3 text-center">
                        <Link
                            to="/forgot-password"
                            className="block text-sm text-teal-400 hover:text-teal-300 transition-colors"
                        >
                            Forgot your password?
                        </Link>
                        <div className="text-midnight-400 text-sm">
                            Don't have an account?{' '}
                            <Link to="/signup" className="text-teal-400 hover:text-teal-300 transition-colors font-medium">
                                Sign up
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-midnight-500 text-sm mt-8">
                    Your data is securely synced across all your devices
                </p>
            </div>
        </div>
    );
}

export default Login;
