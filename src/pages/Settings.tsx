import { useState, type ChangeEvent } from 'react';
import {
  Building2,
  Save,
  Check,
  Upload,
  Trash2,
  FileText,
  HardDrive,
  Cloud,
  CloudOff,
  RefreshCw,
  Download,
  UploadCloud,
  type LucideIcon,
} from 'lucide-react';
import { businessStorage, settingsStorage, cloudSync, isSupabaseConfigured } from '../utils/storage';
import type { Business, Settings as SettingsType } from '../types';

interface Currency {
  symbol: string;
  name: string;
}

interface Tab {
  id: 'business' | 'invoice' | 'sync';
  label: string;
  icon: LucideIcon;
}

const CURRENCIES: Currency[] = [
  { symbol: '₹', name: 'Indian Rupee (INR)' },
  { symbol: '$', name: 'US Dollar (USD)' },
  { symbol: '€', name: 'Euro (EUR)' },
  { symbol: '£', name: 'British Pound (GBP)' },
  { symbol: '¥', name: 'Japanese Yen (JPY)' },
];

const TABS: Tab[] = [
  { id: 'business', label: 'Business Profile', icon: Building2 },
  { id: 'invoice', label: 'Invoice Settings', icon: FileText },
  { id: 'sync', label: 'Cloud Sync', icon: Cloud },
];

function Settings() {
  const [business, setBusiness] = useState<Business>(() => businessStorage.get());
  const [settings, setSettings] = useState<SettingsType>(() => settingsStorage.get());
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'business' | 'invoice' | 'sync'>('business');
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleBusinessChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const { name, value } = e.target;
    setBusiness((prev) => ({ ...prev, [name]: value }));
  };

  const handleSettingsChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value, type } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSave = (): void => {
    businessStorage.save(business);
    settingsStorage.save(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBusiness((prev) => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = (): void => {
    setBusiness((prev) => ({ ...prev, logo: null }));
  };

  const toggleShowLogo = (): void => {
    setSettings((prev) => ({ ...prev, showLogo: !prev.showLogo }));
  };

  const handleSync = async (type: 'upload' | 'download' | 'full'): Promise<void> => {
    setSyncing(true);
    setSyncMessage(null);
    
    try {
      let result;
      switch (type) {
        case 'upload':
          result = await cloudSync.uploadToCloud();
          break;
        case 'download':
          result = await cloudSync.downloadFromCloud();
          break;
        case 'full':
          result = await cloudSync.fullSync();
          break;
      }
      
      setSyncMessage({
        type: result.success ? 'success' : 'error',
        text: result.message,
      });
      
      // Refresh data if download was successful
      if (result.success && (type === 'download' || type === 'full')) {
        setBusiness(businessStorage.get());
        setSettings(settingsStorage.get());
      }
    } catch (error) {
      setSyncMessage({
        type: 'error',
        text: `Sync failed: ${(error as Error).message}`,
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Settings</h1>
          <p className="text-midnight-400">Manage your business profile and settings</p>
        </div>
        <button
          onClick={handleSave}
          className={`btn-primary flex items-center gap-2 self-start transition-all ${saved ? 'bg-teal-600' : ''}`}
        >
          {saved ? (
            <>
              <Check className="w-5 h-5" />
              Saved!
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Changes
            </>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-midnight-700 pb-4">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                activeTab === tab.id
                  ? 'bg-teal-500/20 text-teal-400'
                  : 'text-midnight-400 hover:text-white hover:bg-midnight-700'
              }`}
            >
              <Icon className="w-5 h-5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Business Profile Tab */}
      {activeTab === 'business' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="glass rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Business Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="input-label">Business Name</label>
                  <input
                    type="text"
                    name="name"
                    value={business.name}
                    onChange={handleBusinessChange}
                    className="input-field"
                    placeholder="Your business name"
                  />
                </div>

                <div>
                  <label className="input-label">Address</label>
                  <textarea
                    name="address"
                    value={business.address}
                    onChange={handleBusinessChange}
                    className="input-field min-h-[80px] resize-none"
                    placeholder="Business address"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="input-label">City</label>
                    <input
                      type="text"
                      name="city"
                      value={business.city}
                      onChange={handleBusinessChange}
                      className="input-field"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="input-label">State</label>
                    <input
                      type="text"
                      name="state"
                      value={business.state}
                      onChange={handleBusinessChange}
                      className="input-field"
                      placeholder="State"
                    />
                  </div>
                  <div>
                    <label className="input-label">PIN Code</label>
                    <input
                      type="text"
                      name="pincode"
                      value={business.pincode}
                      onChange={handleBusinessChange}
                      className="input-field"
                      placeholder="PIN Code"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={business.phone}
                      onChange={handleBusinessChange}
                      className="input-field"
                      placeholder="Business phone"
                    />
                  </div>
                  <div>
                    <label className="input-label">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={business.email}
                      onChange={handleBusinessChange}
                      className="input-field"
                      placeholder="business@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="input-label">Tax ID / Registration Number</label>
                  <input
                    type="text"
                    name="taxId"
                    value={business.taxId}
                    onChange={handleBusinessChange}
                    className="input-field font-mono"
                    placeholder="Tax registration number"
                  />
                </div>
              </div>
            </div>

            {/* Storage Info */}
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-teal-500/20">
                  <HardDrive className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Local Storage</p>
                  <p className="text-midnight-400 text-sm">All data is saved locally in your browser</p>
                </div>
              </div>
            </div>
          </div>

          {/* Logo & Currency */}
          <div className="space-y-6">
            <div className="glass rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Business Logo</h2>
              
              {business.logo ? (
                <div className="relative">
                  <img src={business.logo} alt="Business logo" className="w-full h-40 object-contain bg-white rounded-xl" />
                  <button
                    onClick={removeLogo}
                    className="absolute top-2 right-2 p-2 bg-coral-500 text-white rounded-lg hover:bg-coral-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-midnight-600 rounded-xl cursor-pointer hover:border-teal-500/50 transition-colors">
                  <Upload className="w-8 h-8 text-midnight-500 mb-2" />
                  <span className="text-midnight-400 text-sm">Upload logo</span>
                  <span className="text-midnight-500 text-xs mt-1">PNG, JPG up to 2MB</span>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
              )}
            </div>

            <div className="glass rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Currency</h2>
              <div className="space-y-2">
                {CURRENCIES.map((currency) => (
                  <button
                    key={currency.symbol}
                    onClick={() => setBusiness((prev) => ({ ...prev, currency: currency.symbol }))}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                      business.currency === currency.symbol
                        ? 'bg-teal-500/20 text-teal-400'
                        : 'text-midnight-300 hover:bg-midnight-700'
                    }`}
                  >
                    <span className="text-xl font-mono">{currency.symbol}</span>
                    <span className="text-sm">{currency.name}</span>
                    {business.currency === currency.symbol && <Check className="w-4 h-4 ml-auto" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Settings Tab */}
      {activeTab === 'invoice' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Invoice Defaults</h2>
            
            <div className="space-y-4">
              <div>
                <label className="input-label">Invoice Prefix</label>
                <input
                  type="text"
                  name="invoicePrefix"
                  value={settings.invoicePrefix}
                  onChange={handleSettingsChange}
                  className="input-field font-mono"
                  placeholder="INV"
                />
                <p className="text-midnight-500 text-xs mt-1">
                  Your invoices will be numbered like {settings.invoicePrefix}-2026-0001
                </p>
              </div>

              <div>
                <label className="input-label">Default Tax Rate (%)</label>
                <input
                  type="number"
                  name="taxRate"
                  min="0"
                  max="100"
                  value={settings.taxRate}
                  onChange={handleSettingsChange}
                  className="input-field"
                />
              </div>

              <div>
                <label className="input-label">Tax Label</label>
                <input
                  type="text"
                  name="taxLabel"
                  value={settings.taxLabel || ''}
                  onChange={handleSettingsChange}
                  className="input-field"
                  placeholder="e.g., GST, VAT, Tax"
                />
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Invoice Display</h2>
            
            <label className="flex items-center justify-between p-4 bg-midnight-800/50 rounded-xl cursor-pointer">
              <div>
                <p className="text-white font-medium">Show Business Logo</p>
                <p className="text-midnight-400 text-sm">Display your logo on invoices</p>
              </div>
              <div
                className={`w-12 h-7 rounded-full transition-colors ${settings.showLogo ? 'bg-teal-500' : 'bg-midnight-600'}`}
                onClick={toggleShowLogo}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform mt-1 ${settings.showLogo ? 'translate-x-6' : 'translate-x-1'}`} />
              </div>
            </label>
          </div>

          {/* Preview Section */}
          <div className="lg:col-span-2 glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Invoice Preview</h2>
            <div className="bg-white rounded-xl p-6 text-gray-900">
              <div className="flex justify-between items-start border-b border-gray-200 pb-4">
                <div>
                  {settings.showLogo && business.logo && <img src={business.logo} alt="Logo" className="h-12 mb-2" />}
                  <h3 className="font-bold text-lg">{business.name || 'Your Business Name'}</h3>
                  <p className="text-gray-500 text-sm">{business.address || 'Business Address'}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-sm uppercase">Invoice</p>
                  <p className="font-mono font-bold">{settings.invoicePrefix}-2026-0001</p>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                <p>{settings.taxLabel || 'Tax'} Rate: {settings.taxRate}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cloud Sync Tab */}
      {activeTab === 'sync' && (
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Connection Status */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 rounded-xl ${isSupabaseConfigured ? 'bg-teal-500/20' : 'bg-coral-500/20'}`}>
                {isSupabaseConfigured ? (
                  <Cloud className="w-6 h-6 text-teal-400" />
                ) : (
                  <CloudOff className="w-6 h-6 text-coral-400" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Cloud Sync Status</h2>
                <p className={`text-sm ${isSupabaseConfigured ? 'text-teal-400' : 'text-coral-400'}`}>
                  {isSupabaseConfigured ? 'Connected to Supabase' : 'Not Configured'}
                </p>
              </div>
            </div>

            {!isSupabaseConfigured && (
              <div className="bg-midnight-800/50 rounded-xl p-4 space-y-3">
                <p className="text-midnight-300 text-sm">
                  To sync invoices across devices, set up Supabase:
                </p>
                <ol className="text-midnight-400 text-sm list-decimal list-inside space-y-2">
                  <li>Create a free account at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:underline">supabase.com</a></li>
                  <li>Create a new project and run the database schema</li>
                  <li>Add these environment variables to your deployment:
                    <div className="mt-2 bg-midnight-900 rounded-lg p-3 font-mono text-xs">
                      <div>VITE_SUPABASE_URL=your_project_url</div>
                      <div>VITE_SUPABASE_ANON_KEY=your_anon_key</div>
                    </div>
                  </li>
                  <li>Redeploy your application</li>
                </ol>
              </div>
            )}
          </div>

          {/* Sync Actions */}
          {isSupabaseConfigured && (
            <div className="glass rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Sync Actions</h2>
              
              {syncMessage && (
                <div className={`mb-4 p-4 rounded-xl ${
                  syncMessage.type === 'success' ? 'bg-teal-500/20 text-teal-400' : 'bg-coral-500/20 text-coral-400'
                }`}>
                  {syncMessage.text}
                </div>
              )}

              <div className="space-y-4">
                {/* Full Sync */}
                <button
                  onClick={() => handleSync('full')}
                  disabled={syncing}
                  className="w-full flex items-center gap-4 p-4 bg-teal-500/10 hover:bg-teal-500/20 rounded-xl transition-colors disabled:opacity-50"
                >
                  <div className="p-3 rounded-xl bg-teal-500/20">
                    <RefreshCw className={`w-6 h-6 text-teal-400 ${syncing ? 'animate-spin' : ''}`} />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium">Full Sync</p>
                    <p className="text-midnight-400 text-sm">Download from cloud, then upload local changes</p>
                  </div>
                </button>

                {/* Upload to Cloud */}
                <button
                  onClick={() => handleSync('upload')}
                  disabled={syncing}
                  className="w-full flex items-center gap-4 p-4 bg-midnight-800/50 hover:bg-midnight-700/50 rounded-xl transition-colors disabled:opacity-50"
                >
                  <div className="p-3 rounded-xl bg-purple-500/20">
                    <UploadCloud className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium">Upload to Cloud</p>
                    <p className="text-midnight-400 text-sm">Push all local data to cloud storage</p>
                  </div>
                </button>

                {/* Download from Cloud */}
                <button
                  onClick={() => handleSync('download')}
                  disabled={syncing}
                  className="w-full flex items-center gap-4 p-4 bg-midnight-800/50 hover:bg-midnight-700/50 rounded-xl transition-colors disabled:opacity-50"
                >
                  <div className="p-3 rounded-xl bg-blue-500/20">
                    <Download className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium">Download from Cloud</p>
                    <p className="text-midnight-400 text-sm">Get latest data from cloud storage</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* How It Works */}
          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">How Cloud Sync Works</h2>
            <div className="space-y-4 text-midnight-300 text-sm">
              <div className="flex gap-3">
                <div className="p-2 rounded-lg bg-midnight-800 h-fit">
                  <HardDrive className="w-4 h-4 text-midnight-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Local-First</p>
                  <p>Your data is always saved locally in your browser. The app works offline.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="p-2 rounded-lg bg-midnight-800 h-fit">
                  <Cloud className="w-4 h-4 text-midnight-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Cloud Backup</p>
                  <p>When you sync, your data is stored in Supabase (PostgreSQL database).</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="p-2 rounded-lg bg-midnight-800 h-fit">
                  <RefreshCw className="w-4 h-4 text-midnight-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Multi-Device</p>
                  <p>Sync on any device to get your latest invoices, customers, and products.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;
