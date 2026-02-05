import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import {
    FileText,
    Zap,
    Shield,
    Cloud,
    Smartphone,
    TrendingUp,
    CheckCircle,
    ArrowRight,
    Sparkles,
    Users,
    BarChart3,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function Landing() {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Redirect logged-in users to dashboard
    useEffect(() => {
        if (user) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-midnight-950 via-midnight-900 to-midnight-950">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-midnight-900/80 backdrop-blur-xl border-b border-midnight-700/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-glow">
                                <FileText className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-brand font-bold text-white tracking-tight">Businezz</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link to="/login" className="text-midnight-300 hover:text-white transition-colors">
                                Login
                            </Link>
                            <Link to="/signup" className="btn-primary">
                                Get Started
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center max-w-4xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 mb-8 animate-slide-up">
                            <Sparkles className="w-4 h-4 text-teal-400" />
                            <span className="text-sm text-teal-400 font-medium">Smart Invoice Generation</span>
                        </div>

                        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold text-white mb-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
                            Create Professional
                            <span className="block bg-gradient-to-r from-teal-400 to-gold-400 bg-clip-text text-transparent">
                                Invoices in Seconds
                            </span>
                        </h1>

                        <p className="text-xl text-midnight-300 mb-8 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '200ms' }}>
                            The modern invoice generator for small businesses and freelancers.
                            Cloud-powered, mobile-ready, and beautifully simple.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '300ms' }}>
                            <Link to="/signup" className="btn-primary text-lg px-8 py-4 flex items-center gap-2">
                                Get Started
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link to="/login" className="btn-secondary text-lg px-8 py-4">
                                Login
                            </Link>
                        </div>

                        <p className="text-sm text-midnight-400 mt-4 animate-slide-up" style={{ animationDelay: '400ms' }}>
                            No credit card required • Free forever plan available
                        </p>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-4">
                            Everything you need to manage invoices
                        </h2>
                        <p className="text-lg text-midnight-300 max-w-2xl mx-auto">
                            Powerful features designed to save you time and help you get paid faster
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="glass rounded-2xl p-8 card-hover">
                            <div className="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center mb-4">
                                <Zap className="w-6 h-6 text-teal-400" />
                            </div>
                            <h3 className="text-xl font-display font-bold text-white mb-2">Lightning Fast</h3>
                            <p className="text-midnight-300">
                                Generate professional PDFs in seconds with our optimized Web Worker technology. No UI freezing, ever.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="glass rounded-2xl p-8 card-hover">
                            <div className="w-12 h-12 rounded-xl bg-gold-500/20 flex items-center justify-center mb-4">
                                <Cloud className="w-6 h-6 text-gold-400" />
                            </div>
                            <h3 className="text-xl font-display font-bold text-white mb-2">Cloud Synced</h3>
                            <p className="text-midnight-300">
                                Access your invoices from anywhere. Real-time sync across all your devices with Supabase.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="glass rounded-2xl p-8 card-hover">
                            <div className="w-12 h-12 rounded-xl bg-coral-500/20 flex items-center justify-center mb-4">
                                <Shield className="w-6 h-6 text-coral-400" />
                            </div>
                            <h3 className="text-xl font-display font-bold text-white mb-2">Secure & Private</h3>
                            <p className="text-midnight-300">
                                Bank-level security with Row Level Security. Your data is encrypted and completely isolated.
                            </p>
                        </div>

                        {/* Feature 4 */}
                        <div className="glass rounded-2xl p-8 card-hover">
                            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4">
                                <Smartphone className="w-6 h-6 text-purple-400" />
                            </div>
                            <h3 className="text-xl font-display font-bold text-white mb-2">Mobile Ready</h3>
                            <p className="text-midnight-300">
                                Share invoices via WhatsApp, email, or SMS directly from your phone. Works perfectly on any device.
                            </p>
                        </div>

                        {/* Feature 5 */}
                        <div className="glass rounded-2xl p-8 card-hover">
                            <div className="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center mb-4">
                                <Users className="w-6 h-6 text-teal-400" />
                            </div>
                            <h3 className="text-xl font-display font-bold text-white mb-2">Customer Management</h3>
                            <p className="text-midnight-300">
                                Store customer details and auto-fill information when creating invoices. Track payment history.
                            </p>
                        </div>

                        {/* Feature 6 */}
                        <div className="glass rounded-2xl p-8 card-hover">
                            <div className="w-12 h-12 rounded-xl bg-gold-500/20 flex items-center justify-center mb-4">
                                <BarChart3 className="w-6 h-6 text-gold-400" />
                            </div>
                            <h3 className="text-xl font-display font-bold text-white mb-2">Smart Analytics</h3>
                            <p className="text-midnight-300">
                                Track revenue, pending payments, and overdue invoices at a glance with beautiful dashboards.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-midnight-900/50">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-6">
                                Built for modern businesses
                            </h2>
                            <p className="text-lg text-midnight-300 mb-8">
                                Stop wasting time on manual invoicing. Focus on what matters - growing your business.
                            </p>

                            <div className="space-y-4">
                                <div className="flex items-start gap-4">
                                    <div className="w-6 h-6 rounded-full bg-teal-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                                        <CheckCircle className="w-4 h-4 text-teal-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-white mb-1">Professional Templates</h4>
                                        <p className="text-midnight-300">Create branded invoices with your logo and custom colors</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-6 h-6 rounded-full bg-teal-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                                        <CheckCircle className="w-4 h-4 text-teal-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-white mb-1">Automatic Calculations</h4>
                                        <p className="text-midnight-300">Tax, discounts, and totals calculated automatically</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-6 h-6 rounded-full bg-teal-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                                        <CheckCircle className="w-4 h-4 text-teal-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-white mb-1">Multi-Currency Support</h4>
                                        <p className="text-midnight-300">Work with clients worldwide in their preferred currency</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-6 h-6 rounded-full bg-teal-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                                        <CheckCircle className="w-4 h-4 text-teal-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-white mb-1">Status Tracking</h4>
                                        <p className="text-midnight-300">Monitor draft, pending, paid, and overdue invoices</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="glass rounded-2xl p-8">
                            <div className="aspect-video bg-gradient-to-br from-teal-500/10 to-gold-500/10 rounded-xl flex items-center justify-center border border-teal-500/20">
                                <TrendingUp className="w-24 h-24 text-teal-400/30" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <div className="glass rounded-3xl p-12 text-center">
                        <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-4">
                            Ready to streamline your invoicing?
                        </h2>
                        <p className="text-lg text-midnight-300 mb-8 max-w-2xl mx-auto">
                            Join thousands of businesses already using Businezz to create professional invoices
                        </p>
                        <div className="flex items-center justify-center">
                            <Link to="/signup" className="btn-primary text-lg px-8 py-4 flex items-center gap-2">
                                Get Started
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-midnight-700/50">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-lg font-brand font-bold text-white tracking-tight">Businezz</span>
                        </div>
                        <p className="text-midnight-400 text-sm">
                            © 2026 Businezz. Made with ❤️ for small businesses and freelancers.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default Landing;
