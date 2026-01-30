import { useState, type ChangeEvent } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  X,
  Save,
} from 'lucide-react';
import { productStorage, businessStorage } from '../utils/storage';
import { generateId, formatCurrency } from '../utils/helpers';
import type { Product, ProductFormData, FormErrors } from '../types';

const UNITS = ['piece', 'kg', 'g', 'liter', 'ml', 'dozen', 'box', 'pack', 'unit', 'hour', 'service'] as const;

function Products() {
  const business = businessStorage.get();
  const [products, setProducts] = useState<Product[]>(() => productStorage.getAll());
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: '',
    unit: 'piece',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openModal = (product: Product | null = null): void => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price.toString(),
        unit: product.unit || 'piece',
      });
    } else {
      setEditingProduct(null);
      setFormData({ name: '', description: '', price: '', unit: 'piece' });
    }
    setErrors({});
    setShowModal(true);
  };

  const closeModal = (): void => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData({ name: '', description: '', price: '', unit: 'piece' });
    setErrors({});
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }
    if (!formData.price || parseFloat(formData.price) < 0) {
      newErrors.price = 'Valid price is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = (): void => {
    if (!validateForm()) return;
    
    const productData: Product = {
      id: editingProduct?.id || generateId(),
      name: formData.name.trim(),
      description: formData.description.trim(),
      price: parseFloat(formData.price),
      unit: formData.unit,
    };

    productStorage.save(productData);
    setProducts(productStorage.getAll());
    closeModal();
  };

  const handleDelete = (id: string): void => {
    productStorage.delete(id);
    setProducts(productStorage.getAll());
    setDeleteConfirm(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Products & Services</h1>
          <p className="text-midnight-400">{products.length} items</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2 self-start">
          <Plus className="w-5 h-5" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-midnight-400" />
        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-field pl-12"
        />
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-16 h-16 text-midnight-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            {searchQuery ? 'No products found' : 'No products yet'}
          </h3>
          <p className="text-midnight-400 mb-6">
            {searchQuery ? 'Try adjusting your search' : 'Add products to quickly add them to invoices'}
          </p>
          {!searchQuery && (
            <button onClick={() => openModal()} className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add Product
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <div key={product.id} className="glass rounded-xl p-5 card-hover animate-fade-in">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white truncate">{product.name}</h3>
                  {product.description && (
                    <p className="text-midnight-400 text-sm mt-1 line-clamp-2">{product.description}</p>
                  )}
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl font-mono font-bold text-teal-400">
                      {formatCurrency(product.price, business.currency)}
                    </span>
                    {product.unit && (
                      <span className="text-midnight-400 text-sm">/ {product.unit}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 ml-2">
                  <button
                    onClick={() => openModal(product)}
                    className="p-2 text-midnight-400 hover:text-white hover:bg-midnight-700 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(product.id)}
                    className="p-2 text-midnight-400 hover:text-coral-400 hover:bg-coral-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="glass rounded-2xl p-6 max-w-md w-full animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">
                {editingProduct ? 'Edit Product' : 'Add Product'}
              </h3>
              <button onClick={closeModal} className="p-2 hover:bg-midnight-700 rounded-lg transition-colors">
                <X className="w-5 h-5 text-midnight-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="input-label">Product Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`input-field ${errors.name ? 'border-coral-500' : ''}`}
                  placeholder="e.g., Notebook, Pen, Cake"
                />
                {errors.name && <p className="text-coral-400 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="input-label">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="input-field min-h-[80px] resize-none"
                  placeholder="Brief description of the product"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Price *</label>
                  <input
                    type="number"
                    name="price"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={handleInputChange}
                    className={`input-field ${errors.price ? 'border-coral-500' : ''}`}
                    placeholder="0.00"
                  />
                  {errors.price && <p className="text-coral-400 text-sm mt-1">{errors.price}</p>}
                </div>

                <div>
                  <label className="input-label">Unit</label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                    className="input-field"
                  >
                    {UNITS.map((unit) => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={closeModal} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleSave} className="btn-primary flex-1 flex items-center justify-center gap-2">
                <Save className="w-4 h-4" />
                {editingProduct ? 'Update' : 'Add Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="glass rounded-2xl p-6 max-w-md w-full animate-scale-in">
            <h3 className="text-xl font-semibold text-white mb-2">Delete Product?</h3>
            <p className="text-midnight-400 mb-6">This product will be permanently deleted.</p>
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

export default Products;
