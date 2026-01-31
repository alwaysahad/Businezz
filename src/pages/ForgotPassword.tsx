import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function ForgotPassword() {
    const { resetPassword } = useAuth();
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { error } = await resetPassword(email);
            if (error) {
                setError(error.message);
            } else {
                setSuccess(true);
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-midnight-900 via-midnight-800 to-midnight-900 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-blue-500 mb-4">
                            <CheckCircle className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-display font-bold text-white mb-2">Check Your Email</h1>
                        <p className="text-midnight-400">
                            We've sent password reset instructions to <strong className="text-white">{email}</strong>
                        </p>
                    </div>

                    <div className="glass rounded-2xl p-8 space-y-4">
                        <p className="text-midnight-300 text-sm">
                            Click the link in the email to reset your password. If you don't see the email, check your spam folder.
                        </p>

                        <Link
                            to="/login"
                            className="btn-primary w-full flex items-center justify-center gap-2"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-midnight-900 via-midnight-800 to-midnight-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 mb-4">
                        <Mail className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-display font-bold text-white mb-2">Forgot Password?</h1>
                    <p className="text-midnight-400">Enter your email to reset your password</p>
                </div>

                {/* Reset Form */}
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
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-midnight-500 pointer-events-none" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input-field pl-11"
                                    placeholder="you@example.com"
                                    required
                                    autoComplete="email"
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
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Mail className="w-5 h-5" />
                                    Send Reset Link
                                </>
                            )}
                        </button>
                    </form>

                    {/* Links */}
                    <div className="mt-6 text-center">
                        <Link
                            to="/login"
                            className="inline-flex items-center gap-2 text-sm text-teal-400 hover:text-teal-300 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Login
                        </Link>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-midnight-500 text-sm mt-8">
                    Remember your password?{' '}
                    <Link to="/login" className="text-teal-400 hover:text-teal-300 transition-colors">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default ForgotPassword;
