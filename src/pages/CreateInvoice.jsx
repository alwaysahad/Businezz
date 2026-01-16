import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Plus,
  Trash2,
  Save,
  Eye,
  ArrowLeft,
  User,
} from 'lucide-react';
import { invoiceStorage, businessStorage, customerStorage, productStorage, settingsStorage } from '../utils/storage';
import { generateId, formatCurrency, formatDate, calculateInvoiceTotals } from '../utils/helpers';

function CreateInvoice() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const business = businessStorage.get();
  const settings = settingsStorage.get();
  const customers = customerStorage.getAll();
  const products = productStorage.getAll();

  const [invoice, setInvoice] = useState({
    id: generateId(),
    invoiceNumber: invoiceStorage.getNextInvoiceNumber(),
    date: formatDate(new Date(), 'input'),
    dueDate: formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'input'),
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    items: [{ id: generateId(), name: '', quantity: 1, price: 0 }],
    taxRate: business.taxRate || settings.taxRate || 0,
    discount: 0,
    notes: '',
    status: 'draft',
  });

  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEditing) {
      const existingInvoice = invoiceStorage.getById(id);
      if (existingInvoice) {
        setInvoice({
          ...existingInvoice,
          date: formatDate(existingInvoice.date, 'input'),
          dueDate: existingInvoice.dueDate ? formatDate(existingInvoice.dueDate, 'input') : '',
        });
      } else {
        navigate('/invoices');
      }
    }
  }, [id, isEditing, navigate]);

  const totals = useMemo(() => {
    return calculateInvoiceTotals(invoice.items, invoice.taxRate, invoice.discount);
  }, [invoice.items, invoice.taxRate, invoice.discount]);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customers.slice(0, 5);
    return customers.filter(c =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone?.includes(customerSearch)
    ).slice(0, 5);
  }, [customers, customerSearch]);

  const filteredProducts = useMemo(() => {
    if (!productSearch) return products.slice(0, 5);
    return products.filter(p =>
      p.name.toLowerCase().includes(productSearch.toLowerCase())
    ).slice(0, 5);
  }, [products, productSearch]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInvoice(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleItemChange = (itemId, field, value) => {
    setInvoice(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === itemId ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addItem = () => {
    setInvoice(prev => ({
      ...prev,
      items: [...prev.items, { id: generateId(), name: '', quantity: 1, price: 0 }],
    }));
  };

  const removeItem = (itemId) => {
    if (invoice.items.length > 1) {
      setInvoice(prev => ({
        ...prev,
        items: prev.items.filter(item => item.id !== itemId),
      }));
    }
  };

  const selectCustomer = (customer) => {
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

  const selectProduct = (product, itemId) => {
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

  const validateForm = () => {
    const newErrors = {};
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

  const handleSave = (status = 'draft') => {
    if (!validateForm()) return;

    const invoiceToSave = {
      ...invoice,
      status,
      date: new Date(invoice.date).toISOString(),
      dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString() : null,
    };

    invoiceStorage.save(invoiceToSave);

    if (invoice.customerName && !customers.find(c => c.name === invoice.customerName)) {
      customerStorage.save({
        id: generateId(),
        name: invoice.customerName,
        email: invoice.customerEmail,
        phone: invoice.customerPhone,
        address: invoice.customerAddress,
      });
    }

    navigate(`/invoices/view/${invoice.id}`);
  };

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
            <p className="text-midnight-400 text-sm">{invoice.invoiceNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => handleSave('draft')}
            className="btn-secondary flex items-center justify-center gap-2 flex-1 sm:flex-none"
          >
            <Save className="w-4 h-4" />
            <span>Save Draft</span>
          </button>
          <button
            onClick={() => handleSave('pending')}
            className="btn-primary flex items-center justify-center gap-2 flex-1 sm:flex-none"
          >
            <Eye className="w-4 h-4" />
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
                    <div className="absolute z-10 w-full mt-1 bg-midnight-800 border border-midnight-600 rounded-xl shadow-lg overflow-hidden">
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
                      <div className="absolute z-10 w-full mt-1 bg-midnight-800 border border-midnight-600 rounded-xl shadow-lg overflow-hidden">
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
            <label className="input-label">Notes / Payment Terms</label>
            <textarea
              name="notes"
              value={invoice.notes}
              onChange={handleInputChange}
              className="input-field min-h-[80px] resize-none"
              placeholder="Add any notes or payment instructions..."
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
                <label className="input-label">Due Date</label>
                <input
                  type="date"
                  name="dueDate"
                  value={invoice.dueDate}
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

      {/* Click outside to close dropdowns */}
      {(showCustomerDropdown || showProductDropdown) && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => {
            setShowCustomerDropdown(false);
            setShowProductDropdown(null);
          }}
        />
      )}
    </div>
  );
}

export default CreateInvoice;
