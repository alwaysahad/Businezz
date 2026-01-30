import { useState, type ChangeEvent } from 'react';
import {
  Building2,
  Save,
  Check,
  Upload,
  Trash2,
  FileText,
  HardDrive,
  type LucideIcon,
} from 'lucide-react';
import { businessStorage, settingsStorage } from '../utils/storage';
import type { Business, Settings as SettingsType } from '../types';

interface Currency {
  symbol: string;
  name: string;
}

interface Tab {
  id: 'business' | 'invoice';
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
];

function Settings() {
  const [business, setBusiness] = useState<Business>(() => businessStorage.get());
  const [settings, setSettings] = useState<SettingsType>(() => settingsStorage.get());
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'business' | 'invoice'>('business');

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
    </div>
  );
}

export default Settings;
