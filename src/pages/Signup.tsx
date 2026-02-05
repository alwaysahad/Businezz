import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { uploadLocalDataToCloud } from '../utils/migrationHelper';

function Signup() {
    const navigate = useNavigate();
    const { signUp } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            const { error } = await signUp(email, password);

            if (error) {
                setError(error.message);
            } else {
                // After successful signup, migrate local data to cloud
                try {
                    await uploadLocalDataToCloud();
                } catch (syncError) {
                    console.error('Failed to sync local data:', syncError);
                    // Don't show error to user, they can sync manually later
                }

                // Navigate to dashboard
                navigate('/');
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
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 mb-4">
                        <UserPlus className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-display font-bold text-white mb-2">Create Account</h1>
                    <p className="text-midnight-400">Start managing your invoices across all devices</p>
                </div>

                {/* Signup Form */}
                <div className="glass rounded-2xl p-8">
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
                                    autoComplete="new-password"
                                    minLength={6}
                                />
                            </div>
                            <p className="text-midnight-500 text-xs mt-1">At least 6 characters</p>
                        </div>

                        <div>
                            <label className="input-label">Confirm Password</label>
                            <div className="relative">
                                <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-midnight-500 pointer-events-none transition-opacity duration-200 ${confirmPassword ? 'opacity-0' : 'opacity-100'}`} />
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="input-field pl-11"
                                    placeholder=""
                                    required
                                    autoComplete="new-password"
                                />
                            </div>
                        </div>

                        {/* Features List */}
                        <div className="bg-midnight-800/50 rounded-xl p-4 space-y-2">
                            <div className="flex items-center gap-2 text-sm text-midnight-300">
                                <CheckCircle className="w-4 h-4 text-teal-400" />
                                <span>Sync across all your devices</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-midnight-300">
                                <CheckCircle className="w-4 h-4 text-teal-400" />
                                <span>Secure cloud backup</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-midnight-300">
                                <CheckCircle className="w-4 h-4 text-teal-400" />
                                <span>Access from anywhere</span>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Creating account...
                                </>
                            ) : (
                                <>
                                    <UserPlus className="w-5 h-5" />
                                    Create Account
                                </>
                            )}
                        </button>
                    </form>

                    {/* Links */}
                    <div className="mt-6 text-center">
                        <div className="text-midnight-400 text-sm">
                            Already have an account?{' '}
                            <Link to="/login" className="text-teal-400 hover:text-teal-300 transition-colors font-medium">
                                Sign in
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-midnight-500 text-sm mt-8">
                    By signing up, you agree to our Terms of Service and Privacy Policy
                </p>
            </div>
        </div>
    );
}

export default Signup;
