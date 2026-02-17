import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeftIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { productsApi } from '../services/api';
import { RootState } from '../store';

interface Variant {
  id: string;
  color: string;
  size: string;
  initial_stock: number;
  generated_sku?: string; // Preview only
}

const AddProductPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useSelector((state: RootState) => state.auth.user);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    brand: '',
    department: '',
    category: '',
    subcategory: '',
    product_type: '',
    images: '',
    tags: '',
    specifications: {} as Record<string, string>,
    is_active: true,
  });

  const [variants, setVariants] = useState<Variant[]>([]);
  const [specKey, setSpecKey] = useState('');
  const [specValue, setSpecValue] = useState('');

  const departments = ['Women', 'Men', 'Kids', 'Electronics', 'Sports', 'Books', 'Home', 'Beauty'];

  const categoriesByDepartment: Record<string, string[]> = {
    Women: ['Clothing', 'Shoes', 'Accessories', 'Jewelry'],
    Men: ['Clothing', 'Shoes', 'Accessories', 'Grooming'],
    Kids: ['Clothing', 'Toys', 'Books', 'Accessories'],
    Electronics: ['Computers', 'Audio', 'Mobile', 'Gaming', 'Cameras'],
    Sports: ['Running', 'Gym', 'Outdoor', 'Team Sports'],
    Books: ['Fiction', 'Non-Fiction', 'Educational', 'Comics'],
    Home: ['Furniture', 'Decor', 'Kitchen', 'Bedding'],
    Beauty: ['Skincare', 'Makeup', 'Haircare', 'Fragrance'],
  };

  // Auto-generate SKU preview (matches backend logic)
  const generateSkuPreview = (productName: string, color?: string, size?: string): string => {
    if (!productName.trim()) return 'PROD';

    // Extract initials and numbers from product name
    const cleaned = productName.replace(/[^a-zA-Z0-9\s]/g, '');
    const words = cleaned.split(/\s+/).filter(Boolean);

    let initials = '';
    let numbers = '';

    words.forEach((word) => {
      if (word[0] && /[a-zA-Z]/.test(word[0])) {
        initials += word[0];
      }
      const wordNumbers = word.match(/\d+/);
      if (wordNumbers) {
        numbers += wordNumbers[0];
      }
    });

    let code = (initials + numbers).substring(0, 10);
    if (code.length < 2) code = code.padEnd(4, 'P');

    const parts = [code.toUpperCase()];

    if (color) {
      const colorCode = color.length <= 5 ? color.substring(0, 3) : color.substring(0, 3);
      parts.push(colorCode.toUpperCase());
    }

    if (size) {
      const sizeMap: Record<string, string> = {
        'extra small': 'XS',
        small: 'S',
        medium: 'M',
        large: 'L',
        'extra large': 'XL',
        xxl: 'XXL',
      };
      const sizeLower = size.toLowerCase().trim();
      const sizeCode = sizeMap[sizeLower] || (size.match(/\d+/) || [size.substring(0, 3)])[0];
      parts.push(sizeCode.toUpperCase());
    }

    return parts.join('-');
  };

  // Update SKU previews when product name or variant attributes change
  useEffect(() => {
    setVariants((prev) =>
      prev.map((v) => ({
        ...v,
        generated_sku: generateSkuPreview(formData.name, v.color, v.size),
      })),
    );
  }, [formData.name]);

  const addVariant = () => {
    const newVariant: Variant = {
      id: Date.now().toString(),
      color: '',
      size: '',
      initial_stock: 0,
      generated_sku: generateSkuPreview(formData.name, '', ''),
    };
    setVariants([...variants, newVariant]);
  };

  const removeVariant = (id: string) => {
    setVariants(variants.filter((v) => v.id !== id));
  };

  const updateVariant = (id: string, field: keyof Variant, value: string | number) => {
    setVariants((prev) =>
      prev.map((v) => {
        if (v.id === id) {
          const updated = { ...v, [field]: value };
          // Regenerate SKU preview
          if (field === 'color' || field === 'size') {
            updated.generated_sku = generateSkuPreview(formData.name, updated.color, updated.size);
          }
          return updated;
        }
        return v;
      }),
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));

      // Reset category when department changes
      if (name === 'department') {
        setFormData((prev) => ({ ...prev, category: '', subcategory: '', product_type: '' }));
      }
    }
  };

  const addSpecification = () => {
    if (specKey && specValue) {
      setFormData((prev) => ({
        ...prev,
        specifications: { ...prev.specifications, [specKey]: specValue },
      }));
      setSpecKey('');
      setSpecValue('');
    }
  };

  const removeSpecification = (key: string) => {
    setFormData((prev) => {
      const newSpecs = { ...prev.specifications };
      delete newSpecs[key];
      return { ...prev, specifications: newSpecs };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.name.trim()) {
      setError('Product name is required');
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError('Valid price is required');
      return;
    }
    if (variants.length === 0) {
      setError('At least one variant is required');
      return;
    }

    // Validate variants
    for (const variant of variants) {
      if (!variant.color && !variant.size) {
        setError('Each variant must have at least color or size specified');
        return;
      }
      if (variant.initial_stock < 0) {
        setError('Initial stock cannot be negative');
        return;
      }
    }

    try {
      setLoading(true);

      // Transform data for API
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        brand: formData.brand.trim() || undefined,
        taxonomy: {
          department: formData.department || undefined,
          category: formData.category || undefined,
          subcategory: formData.subcategory || undefined,
          product_type: formData.product_type || undefined,
        },
        images: formData.images
          ? formData.images
              .split(',')
              .map((img) => img.trim())
              .filter(Boolean)
          : [],
        tags: formData.tags
          ? formData.tags
              .split(',')
              .map((tag) => tag.trim())
              .filter(Boolean)
          : [],
        variants: variants.map((v) => ({
          color: v.color || undefined,
          size: v.size || undefined,
          initial_stock: v.initial_stock,
        })),
        specifications: formData.specifications,
        status: 'active',
      };

      console.log('Creating product with data:', productData);
      await productsApi.create(productData);
      // Invalidate dashboard stats to reflect new product count
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      navigate('/products');
    } catch (err: any) {
      console.error('Product creation error:', err);
      const errorMessage =
        err.response?.data?.error?.message || err.response?.data?.message || err.message || 'Failed to create product';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/products');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/products')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        {/* Basic Information */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Price <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Brand</label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Category Taxonomy */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Department</label>
              <select
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                disabled={!formData.department}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white disabled:opacity-50"
              >
                <option value="">Select Category</option>
                {formData.department &&
                  categoriesByDepartment[formData.department]?.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subcategory</label>
              <input
                type="text"
                name="subcategory"
                value={formData.subcategory}
                onChange={handleInputChange}
                placeholder="e.g., Tops, Laptops, Headphones"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Product Type</label>
              <input
                type="text"
                name="product_type"
                value={formData.product_type}
                onChange={handleInputChange}
                placeholder="e.g., T-Shirts, Gaming Laptops"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Variants */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Product Variants <span className="text-red-500">*</span>
            </h2>
            <button
              type="button"
              onClick={addVariant}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <PlusIcon className="h-4 w-4" />
              Add Variant
            </button>
          </div>

          {variants.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
              <p className="text-gray-500 dark:text-gray-400 mb-2">No variants added yet</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Add variants to define different color/size options with initial stock
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {variants.map((variant, index) => (
                <div
                  key={variant.id}
                  className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900 dark:text-white">Variant {index + 1}</h3>
                    <button
                      type="button"
                      onClick={() => removeVariant(variant.id)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Color</label>
                      <input
                        type="text"
                        value={variant.color}
                        onChange={(e) => updateVariant(variant.id, 'color', e.target.value)}
                        placeholder="e.g., Black, White"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Size</label>
                      <input
                        type="text"
                        value={variant.size}
                        onChange={(e) => updateVariant(variant.id, 'size', e.target.value)}
                        placeholder="e.g., M, 128GB"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Initial Stock
                      </label>
                      <input
                        type="number"
                        value={variant.initial_stock}
                        onChange={(e) => updateVariant(variant.id, 'initial_stock', parseInt(e.target.value) || 0)}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>

                  {variant.generated_sku && (
                    <div className="mt-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded border border-purple-200 dark:border-purple-800">
                      <span className="text-xs text-purple-700 dark:text-purple-300 font-medium">
                        Auto-generated SKU: <code className="font-mono">{variant.generated_sku}</code>
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Media & Metadata */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Media & Metadata</h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Image URLs (comma-separated)
              </label>
              <textarea
                name="images"
                value={formData.images}
                onChange={handleInputChange}
                rows={2}
                placeholder="e.g., https://example.com/image1.jpg, https://example.com/image2.jpg"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                placeholder="e.g., bestseller, new-arrival, sale"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Specifications */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Specifications</h2>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={specKey}
              onChange={(e) => setSpecKey(e.target.value)}
              placeholder="Key (e.g., Material)"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
            />
            <input
              type="text"
              value={specValue}
              onChange={(e) => setSpecValue(e.target.value)}
              placeholder="Value (e.g., Cotton)"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
            />
            <button
              type="button"
              onClick={addSpecification}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Add
            </button>
          </div>

          {Object.entries(formData.specifications).length > 0 && (
            <div className="space-y-2">
              {Object.entries(formData.specifications).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    <strong>{key}:</strong> {value}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeSpecification(key)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Status</h2>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleInputChange}
              className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Active Product</span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProductPage;
