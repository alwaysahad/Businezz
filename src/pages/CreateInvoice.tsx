import { useState, useEffect, useMemo, type ChangeEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Plus,
  Trash2,
  Save,
  Eye,
  ArrowLeft,
  User,
  Loader2,
} from 'lucide-react';
import { generateId, formatCurrency, formatDate, calculateInvoiceTotals } from '../utils/helpers';
import type { Invoice, InvoiceItem, Customer, Product, FormErrors } from '../types';
import { useInvoices, useInvoice, useCustomers, useProducts, useBusiness, useSettings } from '../hooks/useData';

function CreateInvoice() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const { invoice: existingInvoice, loading: invoiceLoading } = useInvoice(id);
  const { invoices } = useInvoices(); // For next number calculation
  const { customers } = useCustomers();
  const { products } = useProducts();
  const { business } = useBusiness();
  const { settings } = useSettings();
  const { saveInvoice } = useInvoices();

  const [invoice, setInvoice] = useState<Invoice>({
    id: generateId(),
    invoiceNumber: '', // Will be set once invoices load or settings load
    date: formatDate(new Date(), 'input'),
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    items: [{ id: generateId(), name: '', quantity: 1, price: 0 }],
    taxRate: 0,
    discount: 0,
    notes: '',
    status: 'draft',
    user_id: '', // Will be set by Supabase
  });

  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form data
  useEffect(() => {
    if (isEditing) {
      if (existingInvoice) {
        setInvoice({
          ...existingInvoice,
          date: formatDate(existingInvoice.date, 'input'),
        });
      }
    } else {
      // Create mode: Set defaults once dependencies are loaded
      if (business && settings && invoices) {
        // Calculate next invoice number
        const prefix = settings.invoicePrefix || 'INV';
        const currentYear = new Date().getFullYear();
        const yearPrefix = `${prefix}-${currentYear}-`;

        // Simple auto-increment logic based on existing invoices
        // This might not be perfect in concurrent environments but works for single user
        const existingNumbers = invoices
          .map(inv => inv.invoiceNumber)
          .filter(num => num.startsWith(yearPrefix))
          .map(num => parseInt(num.split('-').pop() || '0'))
          .filter(n => !isNaN(n));

        const maxNum = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
        const nextNum = (maxNum + 1).toString().padStart(4, '0');
        const nextInvoiceNumber = `${yearPrefix}${nextNum}`;

        setInvoice(prev => ({
          ...prev,
          invoiceNumber: prev.invoiceNumber || nextInvoiceNumber,
          taxRate: prev.taxRate || business.taxRate || settings.taxRate || 0,
        }));
      }
    }
  }, [isEditing, existingInvoice, business, settings, invoices]);

  const totals = useMemo(() => {
    return calculateInvoiceTotals(invoice.items, invoice.taxRate, invoice.discount);
  }, [invoice.items, invoice.taxRate, invoice.discount]);

  const filteredCustomers = useMemo((): Customer[] => {
    if (!customerSearch) return customers.slice(0, 5);
    return customers.filter(c =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone?.includes(customerSearch)
    ).slice(0, 5);
  }, [customers, customerSearch]);

  const filteredProducts = useMemo((): Product[] => {
    if (!productSearch) return products.slice(0, 5);
    return products.filter(p =>
      p.name.toLowerCase().includes(productSearch.toLowerCase())
    ).slice(0, 5);
  }, [products, productSearch]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const { name, value } = e.target;
    setInvoice(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleItemChange = (itemId: string, field: keyof InvoiceItem, value: string | number): void => {
    setInvoice(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === itemId ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addItem = (): void => {
    setInvoice(prev => ({
      ...prev,
      items: [...prev.items, { id: generateId(), name: '', quantity: 1, price: 0 }],
    }));
  };

  const removeItem = (itemId: string): void => {
    if (invoice.items.length > 1) {
      setInvoice(prev => ({
        ...prev,
        items: prev.items.filter(item => item.id !== itemId),
      }));
    }
  };

  const selectCustomer = (customer: Customer): void => {
    setInvoice(prev => ({
      ...prev,
      customerName: customer.name,
      customerEmail: customer.email || '',
      customerPhone: customer.phone || '',
      customerAddress: customer.address || '',
    }));
    setShowCustomerDropdown(false);
    setCustomerSearch('');
  };

  const selectProduct = (product: Product, itemId: string): void => {
    setInvoice(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === itemId
          ? { ...item, name: product.name, price: product.price }
          : item
      ),
    }));
    setShowProductDropdown(null);
    setProductSearch('');
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!invoice.customerName.trim()) {
      newErrors.customerName = 'Customer name is required';
    }
    if (invoice.items.some(item => !item.name.trim())) {
      newErrors.items = 'All items must have a name';
    }
    if (invoice.items.some(item => item.quantity <= 0)) {
      newErrors.items = 'Quantity must be greater than 0';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (status: 'draft' | 'pending' = 'draft') => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const invoiceToSave: Invoice = {
        ...invoice,
        status,
        date: new Date(invoice.date).toISOString(),
      };

      await saveInvoice(invoiceToSave);

      // Note: Customer saving is implicitly handled if you want to reuse them, 
      // but here we are just saving the invoice. 
      // If we want to auto-save new customers to the 'customers' table, 
      // we'd need to call saveCustomer from useCustomers hook.
      // For now, removing implicit customer creation to keep it simple 
      // and avoid circular dependency or complex logic in UI.
      // Users should add customers in Customers tab or we can add a "Save Customer" button later.

      navigate(`/invoices/view/${invoice.id}`);
    } catch (error) {
      console.error('Failed to save invoice:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing && invoiceLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-teal-400 animate-spin mx-auto mb-4" />
          <p className="text-midnight-400">Loading invoice...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2.5 -ml-1 rounded-lg hover:bg-midnight-700 active:bg-midnight-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-midnight-300" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-display font-bold text-white truncate">
              {isEditing ? 'Edit Invoice' : 'Create Invoice'}
            </h1>
            <p className="text-midnight-400 text-sm">{invoice.invoiceNumber || 'Generating number...'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => handleSave('draft')}
            disabled={isSaving}
            className="btn-secondary flex items-center justify-center gap-2 flex-1 sm:flex-none"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Draft</span>
          </button>
          <button
            onClick={() => handleSave('pending')}
            disabled={isSaving}
            className="btn-primary flex items-center justify-center gap-2 flex-1 sm:flex-none"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
            <span>Save & Preview</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Details */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-teal-400" />
              <h2 className="text-lg font-semibold text-white">Customer Details</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative sm:col-span-2">
                <label className="input-label">Customer Name *</label>
                <div className="relative">
                  <input
                    type="text"
                    name="customerName"
                    value={invoice.customerName}
                    onChange={(e) => {
                      handleInputChange(e);
                      setCustomerSearch(e.target.value);
                      setShowCustomerDropdown(true);
                    }}
                    onFocus={() => setShowCustomerDropdown(true)}
                    className={`input-field ${errors.customerName ? 'border-coral-500' : ''}`}
                    placeholder="Enter customer name"
                  />
                  {showCustomerDropdown && filteredCustomers.length > 0 && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowCustomerDropdown(false)}
                      />
                      <div className="absolute z-20 w-full mt-1 bg-midnight-800 border border-midnight-600 rounded-xl shadow-lg overflow-hidden">
                        {filteredCustomers.map((customer) => (
                          <button
                            key={customer.id}
                            type="button"
                            onClick={() => selectCustomer(customer)}
                            className="w-full px-4 py-3 text-left hover:bg-midnight-700 transition-colors"
                          >
                            <p className="text-white font-medium">{customer.name}</p>
                            {customer.phone && (
                              <p className="text-midnight-400 text-sm">{customer.phone}</p>
                            )}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                {errors.customerName && (
                  <p className="text-coral-400 text-sm mt-1">{errors.customerName}</p>
                )}
              </div>

              <div>
                <label className="input-label">Phone</label>
                <input
                  type="tel"
                  name="customerPhone"
                  value={invoice.customerPhone}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Phone number"
                />
              </div>

              <div>
                <label className="input-label">Email</label>
                <input
                  type="email"
                  name="customerEmail"
                  value={invoice.customerEmail}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Email address"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="input-label">Address</label>
                <textarea
                  name="customerAddress"
                  value={invoice.customerAddress}
                  onChange={handleInputChange}
                  className="input-field min-h-[60px] resize-none"
                  placeholder="Customer address"
                />
              </div>
            </div>
          </div>

          {/* Invoice Items - Tabular Form */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Items</h2>
              <button
                type="button"
                onClick={addItem}
                className="text-teal-400 hover:text-teal-300 flex items-center gap-1 text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>

            {errors.items && (
              <p className="text-coral-400 text-sm mb-4">{errors.items}</p>
            )}

            {/* Table Header */}
            <div className="hidden sm:grid sm:grid-cols-12 gap-2 pb-2 border-b border-midnight-600 mb-2">
              <div className="col-span-1 text-midnight-400 text-xs font-medium">#</div>
              <div className="col-span-5 text-midnight-400 text-xs font-medium">Item Name</div>
              <div className="col-span-2 text-midnight-400 text-xs font-medium text-center">Qty</div>
              <div className="col-span-2 text-midnight-400 text-xs font-medium text-right">Price</div>
              <div className="col-span-2 text-midnight-400 text-xs font-medium text-right">Amount</div>
            </div>

            {/* Table Rows */}
            <div className="space-y-2">
              {invoice.items.map((item, index) => (
                <div
                  key={item.id}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2 py-2 border-b border-midnight-700/50 items-center"
                >
                  {/* Row Number */}
                  <div className="hidden sm:flex col-span-1 text-midnight-400 text-sm items-center">
                    {index + 1}
                  </div>

                  {/* Item Name */}
                  <div className="sm:col-span-5 relative">
                    <label className="sm:hidden text-midnight-400 text-xs mb-1 block">Item Name</label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => {
                        handleItemChange(item.id, 'name', e.target.value);
                        setProductSearch(e.target.value);
                        setShowProductDropdown(item.id);
                      }}
                      onFocus={() => setShowProductDropdown(item.id)}
                      className="w-full bg-midnight-800/50 border border-midnight-600 rounded-lg px-3 py-2 text-white text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 transition-all"
                      placeholder="Enter item name"
                    />
                    {showProductDropdown === item.id && filteredProducts.length > 0 && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setShowProductDropdown(null)}
                        />
                        <div className="absolute z-20 w-full mt-1 bg-midnight-800 border border-midnight-600 rounded-xl shadow-lg overflow-hidden">
                          {filteredProducts.map((product) => (
                            <button
                              key={product.id}
                              type="button"
                              onClick={() => selectProduct(product, item.id)}
                              className="w-full px-4 py-2 text-left hover:bg-midnight-700 transition-colors flex justify-between items-center"
                            >
                              <span className="text-white text-sm">{product.name}</span>
                              <span className="text-teal-400 font-mono text-sm">
                                {formatCurrency(product.price, business.currency)}
                              </span>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Quantity */}
                  <div className="sm:col-span-2">
                    <label className="sm:hidden text-midnight-400 text-xs mb-1 block">Qty</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 0)}
                      className="w-full bg-midnight-800/50 border border-midnight-600 rounded-lg px-3 py-2 text-white text-sm text-center focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 transition-all"
                    />
                  </div>

                  {/* Price */}
                  <div className="sm:col-span-2">
                    <label className="sm:hidden text-midnight-400 text-xs mb-1 block">Price</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.price}
                      onChange={(e) => handleItemChange(item.id, 'price', parseFloat(e.target.value) || 0)}
                      className="w-full bg-midnight-800/50 border border-midnight-600 rounded-lg px-3 py-2 text-white text-sm text-right focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 transition-all font-mono"
                    />
                  </div>

                  {/* Amount & Delete */}
                  <div className="sm:col-span-2 flex items-center justify-between sm:justify-end gap-2">
                    <div className="sm:hidden text-midnight-400 text-xs">Amount:</div>
                    <span className="text-white font-mono text-sm font-semibold">
                      {formatCurrency(item.quantity * item.price, business.currency)}
                    </span>
                    {invoice.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="p-1.5 text-coral-400 hover:bg-coral-500/20 rounded-lg transition-colors ml-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add Item Button */}
            <button
              type="button"
              onClick={addItem}
              className="mt-4 w-full py-2.5 border-2 border-dashed border-midnight-600 rounded-xl text-midnight-400 hover:text-teal-400 hover:border-teal-500/50 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>

          {/* Notes */}
          <div className="glass rounded-2xl p-6">
            <label className="input-label">Notes</label>
            <textarea
              name="notes"
              value={invoice.notes}
              onChange={handleInputChange}
              className="input-field min-h-[80px] resize-none"
              placeholder="Add any notes..."
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="glass rounded-2xl p-6 sticky top-4">
            <h2 className="text-lg font-semibold text-white mb-4">Invoice Details</h2>

            <div className="space-y-4">
              <div>
                <label className="input-label">Invoice Number</label>
                <input
                  type="text"
                  name="invoiceNumber"
                  value={invoice.invoiceNumber}
                  onChange={handleInputChange}
                  className="input-field font-mono"
                />
              </div>

              <div>
                <label className="input-label">Invoice Date</label>
                <input
                  type="date"
                  name="date"
                  value={invoice.date}
                  onChange={handleInputChange}
                  className="input-field"
                />
              </div>

              <div>
                <label className="input-label">{settings.taxLabel || 'Tax'} Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  name="taxRate"
                  value={invoice.taxRate}
                  onChange={handleInputChange}
                  className="input-field"
                />
              </div>

              <div>
                <label className="input-label">Discount (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  name="discount"
                  value={invoice.discount}
                  onChange={handleInputChange}
                  className="input-field"
                />
              </div>
            </div>

            {/* Totals */}
            <div className="mt-6 pt-6 border-t border-midnight-600 space-y-3">
              <div className="flex justify-between text-midnight-300">
                <span>Subtotal</span>
                <span className="font-mono">{formatCurrency(totals.subtotal, business.currency)}</span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between text-midnight-300">
                  <span>Discount ({invoice.discount}%)</span>
                  <span className="font-mono text-coral-400">-{formatCurrency(totals.discountAmount, business.currency)}</span>
                </div>
              )}
              {invoice.taxRate > 0 && (
                <div className="flex justify-between text-midnight-300">
                  <span>{settings.taxLabel || 'Tax'} ({invoice.taxRate}%)</span>
                  <span className="font-mono">{formatCurrency(totals.taxAmount, business.currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold pt-3 border-t border-midnight-600">
                <span className="text-white">Total</span>
                <span className="font-mono text-teal-400">{formatCurrency(totals.total, business.currency)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

export default CreateInvoice;
