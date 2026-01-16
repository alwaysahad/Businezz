import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  X,
  Save,
  Phone,
  Mail,
  MapPin,
  FileText,
} from 'lucide-react';
import { customerStorage, invoiceStorage } from '../utils/storage';
import { generateId } from '../utils/helpers';

function Customers() {
  const [customers, setCustomers] = useState(() => customerStorage.getAll());
  const invoices = invoiceStorage.getAll();
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });
  const [errors, setErrors] = useState({});

  const getCustomerInvoiceCount = (customerName) => {
    return invoices.filter((inv) => inv.customerName === customerName).length;
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone?.includes(searchQuery) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openModal = (customer = null) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name,
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
      });
    } else {
      setEditingCustomer(null);
      setFormData({ name: '', phone: '', email: '', address: '' });
    }
    setErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCustomer(null);
    setFormData({ name: '', phone: '', email: '', address: '' });
    setErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Customer name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const customerData = {
      id: editingCustomer?.id || generateId(),
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      address: formData.address.trim(),
    };

    customerStorage.save(customerData);
    setCustomers(customerStorage.getAll());
    closeModal();
  };

  const handleDelete = (id) => {
    customerStorage.delete(id);
    setCustomers(customerStorage.getAll());
    setDeleteConfirm(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Customers</h1>
          <p className="text-midnight-400">{customers.length} customers</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2 self-start">
          <Plus className="w-5 h-5" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-midnight-400" />
        <input
          type="text"
          placeholder="Search customers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-field pl-12"
        />
      </div>

      {/* Customers List */}
      {filteredCustomers.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-16 h-16 text-midnight-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            {searchQuery ? 'No customers found' : 'No customers yet'}
          </h3>
          <p className="text-midnight-400 mb-6">
            {searchQuery ? 'Try adjusting your search' : 'Customers are automatically added when you create invoices'}
          </p>
          {!searchQuery && (
            <button onClick={() => openModal()} className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add Customer
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredCustomers.map((customer) => {
            const invoiceCount = getCustomerInvoiceCount(customer.name);
            return (
              <div key={customer.id} className="glass rounded-xl p-5 card-hover animate-fade-in">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center">
                        <span className="text-teal-400 font-semibold">{customer.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-white truncate">{customer.name}</h3>
                        {invoiceCount > 0 && (
                          <Link
                            to={`/invoices?search=${encodeURIComponent(customer.name)}`}
                            className="text-teal-400 text-sm hover:text-teal-300 flex items-center gap-1"
                          >
                            <FileText className="w-3 h-3" />
                            {invoiceCount} invoice{invoiceCount > 1 ? 's' : ''}
                          </Link>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      {customer.phone && (
                        <div className="flex items-center gap-2 text-midnight-400 text-sm">
                          <Phone className="w-4 h-4" />
                          <a href={`tel:${customer.phone}`} className="hover:text-white">{customer.phone}</a>
                        </div>
                      )}
                      {customer.email && (
                        <div className="flex items-center gap-2 text-midnight-400 text-sm">
                          <Mail className="w-4 h-4" />
                          <a href={`mailto:${customer.email}`} className="hover:text-white truncate">{customer.email}</a>
                        </div>
                      )}
                      {customer.address && (
                        <div className="flex items-start gap-2 text-midnight-400 text-sm">
                          <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{customer.address}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={() => openModal(customer)}
                      className="p-2 text-midnight-400 hover:text-white hover:bg-midnight-700 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(customer.id)}
                      className="p-2 text-midnight-400 hover:text-coral-400 hover:bg-coral-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="glass rounded-2xl p-6 max-w-md w-full animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">
                {editingCustomer ? 'Edit Customer' : 'Add Customer'}
              </h3>
              <button onClick={closeModal} className="p-2 hover:bg-midnight-700 rounded-lg transition-colors">
                <X className="w-5 h-5 text-midnight-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="input-label">Customer Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`input-field ${errors.name ? 'border-coral-500' : ''}`}
                  placeholder="Full name"
                />
                {errors.name && <p className="text-coral-400 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="input-label">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Mobile number"
                />
              </div>

              <div>
                <label className="input-label">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label className="input-label">Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="input-field min-h-[80px] resize-none"
                  placeholder="Full address"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={closeModal} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleSave} className="btn-primary flex-1 flex items-center justify-center gap-2">
                <Save className="w-4 h-4" />
                {editingCustomer ? 'Update' : 'Add Customer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="glass rounded-2xl p-6 max-w-md w-full animate-scale-in">
            <h3 className="text-xl font-semibold text-white mb-2">Delete Customer?</h3>
            <p className="text-midnight-400 mb-6">This customer will be permanently deleted.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="btn-danger">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Customers;
