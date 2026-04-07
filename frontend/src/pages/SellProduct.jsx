import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Camera, Tag, FileText, IndianRupee, Layers, Upload, Gift, Loader2 } from 'lucide-react';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { CATEGORIES, CONDITION_OPTIONS } from '../constants';
import api from '../services/api';

export default function SellProduct() {
  const { user } = useAuth();
  const { success, error: showError } = useNotifications();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [isFree, setIsFree] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    condition: '',
    images: [],
  });
  const [errors, setErrors] = useState({});
  const [previewImages, setPreviewImages] = useState([]);

  const validate = () => {
    const errs = {};
    if (!formData.title.trim()) errs.title = 'Product title is required';
    if (!formData.description.trim()) errs.description = 'Description is required';
    if (!isFree && (!formData.price || isNaN(formData.price) || Number(formData.price) <= 0)) errs.price = 'Enter a valid price';
    if (!formData.category) errs.category = 'Select a category';
    if (!formData.condition) errs.condition = 'Select condition';
    return errs;
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const previews = files.map((file) => URL.createObjectURL(file));
    setPreviewImages((prev) => [...prev, ...previews].slice(0, 4));
    setFormData((prev) => ({ ...prev, images: [...prev.images, ...files].slice(0, 4) }));
  };

  const removeImage = (index) => {
    URL.revokeObjectURL(previewImages[index]);
    setPreviewImages((prev) => prev.filter((_, i) => i !== index));
    setFormData((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setLoading(true);

    try {
      let imageUrls = [];

      // Upload images to Cloudinary if any
      if (formData.images.length > 0) {
        setUploadingImages(true);
        const uploadFormData = new FormData();
        formData.images.forEach((file) => {
          uploadFormData.append('files', file);
        });

        const uploadResponse = await api.post('/upload/images', uploadFormData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        imageUrls = uploadResponse.data.urls;
        setUploadingImages(false);
      }

      // Build description with condition info
      const fullDescription = formData.condition
        ? `[Condition: ${formData.condition}]\n\n${formData.description}`
        : formData.description;

      const productData = {
        title: formData.title.trim(),
        description: fullDescription.trim(),
        price: isFree ? 0 : Number(formData.price),
        category: formData.category,
        image_urls: imageUrls.length > 0 ? imageUrls : null,
      };

      await api.post('/products', productData);
      success('Product listed successfully!');
      navigate('/dashboard');
    } catch (err) {
      const message = err.response?.data?.detail || err.message || 'Failed to list product. Please try again.';
      showError(message);
      setUploadingImages(false);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
    setErrors({ ...errors, [field]: '' });
  };

  const handlePriceChange = (value) => {
    const sanitized = value.replace(/[^\d]/g, '');
    updateField('price', sanitized);
  };

  const toggleFree = () => {
    setIsFree(!isFree);
    if (!isFree) {
      setFormData({ ...formData, price: '0' });
      setErrors({ ...errors, price: '' });
    } else {
      setFormData({ ...formData, price: '' });
    }
  };

  return (
    <div className="section-padding page-padding">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto space-y-8"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sell a Product</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            List your item for other students on {user?.campus || 'campus'}.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Product Images <span className="text-gray-400">(max 4)</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {previewImages.map((img, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 group bg-white dark:bg-gray-800">
                  <img src={img} alt="" className="w-full h-full object-contain p-3" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all"
                  >
                    <span className="text-white text-xs font-medium">Remove</span>
                  </button>
                </div>
              ))}
              {previewImages.length < 4 && (
                <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all">
                  <Camera size={24} className="text-gray-400" />
                  <span className="text-xs text-gray-400">Add Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Title */}
          <Input
            label="Product Title"
            name="title"
            placeholder="e.g. Calculus Textbook 8th Edition"
            value={formData.title}
            onChange={(e) => updateField('title', e.target.value)}
            error={errors.title}
            icon={Tag}
            required
          />

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <FileText size={18} className="absolute left-3 top-3 text-gray-400" />
              <textarea
                placeholder="Describe your product, condition, and what's included..."
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={4}
                className="input-field pl-10 resize-none"
              />
            </div>
            {errors.description && <p className="text-sm text-rose-500">⚠ {errors.description}</p>}
          </div>

          {/* Price Section */}
          <div className="space-y-3">
            {/* Free Toggle */}
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${isFree ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${isFree ? 'translate-x-6' : 'translate-x-0'}`} />
              </div>
              <div className="flex items-center gap-2">
                <Gift size={18} className={`${isFree ? 'text-emerald-500' : 'text-gray-400'} transition-colors`} />
                <span className={`text-sm font-medium ${isFree ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-400'} transition-colors`}>
                  Give away for free
                </span>
              </div>
              <input type="checkbox" checked={isFree} onChange={toggleFree} className="hidden" />
            </label>

            {/* Price Input */}
            {!isFree && (
              <Input
                label="Price (₹)"
                name="price"
                type="text"
                placeholder="0"
                value={formData.price}
                onChange={(e) => handlePriceChange(e.target.value)}
                error={errors.price}
                icon={IndianRupee}
                required
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
              />
            )}
            {isFree && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30">
                <Gift size={16} className="text-emerald-600 dark:text-emerald-400" />
                <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
                  This product will be listed as <strong>Free</strong>
                </p>
              </div>
            )}
          </div>

          {/* Category & Condition Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Category <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Layers size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  value={formData.category}
                  onChange={(e) => updateField('category', e.target.value)}
                  className="input-field pl-10 appearance-none"
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
              </div>
              {errors.category && <p className="text-sm text-rose-500">⚠ {errors.category}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Condition <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.condition}
                onChange={(e) => updateField('condition', e.target.value)}
                className="input-field appearance-none"
              >
                <option value="">Select condition</option>
                {CONDITION_OPTIONS.map((cond) => (
                  <option key={cond} value={cond}>{cond}</option>
                ))}
              </select>
              {errors.condition && <p className="text-sm text-rose-500">⚠ {errors.condition}</p>}
            </div>
          </div>

          {/* Listing Preview Notice */}
          <div className="card p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10 border-indigo-200 dark:border-indigo-800/30">
            <p className="text-sm text-indigo-700 dark:text-indigo-300">
              <strong>📍 Listing Campus:</strong> {user?.campus || 'Your Campus'}
            </p>
            <p className="text-xs text-indigo-600/70 dark:text-indigo-400/70 mt-1">
              Your product will be visible to all students. Your email and phone will remain private.
            </p>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            variant="primary"
            size="xl"
            fullWidth
            loading={loading}
            icon={Upload}
          >
            {uploadingImages ? 'Uploading images...' : 'List Product'}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
