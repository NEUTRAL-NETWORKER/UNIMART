import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Eye, Loader2, RefreshCw, Trash2, AlertTriangle, X } from 'lucide-react';
import Badge from '../common/Badge';
import { formatPrice } from '../../utils/helpers';
import { CATEGORIES } from '../../constants';
import { useNotifications } from '../../context/NotificationContext';
import api from '../../services/api';

export default function MyProducts({ onProductDeleted }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, product: null });
  const [deleting, setDeleting] = useState(false);
  const { success, error: showError } = useNotifications();

  const fetchMyProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/products/my');
      setProducts(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyProducts();
  }, []);

  const handleDeleteClick = (product) => {
    setDeleteModal({ open: true, product });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.product) return;

    setDeleting(true);
    try {
      await api.delete(`/products/${deleteModal.product.id}`);
      // Remove from local state
      setProducts((prev) => prev.filter((p) => p.id !== deleteModal.product.id));
      success('Product deleted successfully');
      setDeleteModal({ open: false, product: null });
      // Notify parent component if callback provided
      if (onProductDeleted) {
        onProductDeleted();
      }
    } catch (err) {
      showError(err.response?.data?.detail || 'Failed to delete product');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    if (!deleting) {
      setDeleteModal({ open: false, product: null });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-3">{error}</p>
        <button
          onClick={fetchMyProducts}
          className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:underline"
        >
          <RefreshCw size={14} />
          Try again
        </button>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-4xl mb-3">📦</p>
        <p className="text-gray-500 dark:text-gray-400">You haven't listed any products yet.</p>
        <Link to="/sell" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline mt-2 inline-block">
          Sell a product →
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {products.map((product, i) => {
          const category = CATEGORIES.find((c) => c.id === product.category);
          const isSold = product.product_status === 'SOLD_OUT' || product.product_status === 'sold';
          const isReserved = product.product_status === 'RESERVED';
          const imageUrl = product.image_urls?.[0] || product.image_url || '/placeholder.svg';

          return (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: i * 0.05 }}
              className="card p-4"
            >
              <div className="flex gap-4">
                <img
                  src={imageUrl}
                  alt={product.title}
                  className="w-20 h-20 rounded-xl object-contain flex-shrink-0 bg-white p-2 border border-gray-100 shadow-sm"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                        {product.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {category && (
                          <Badge color={category?.color || 'gray'}>
                            {category?.icon} {category?.name}
                          </Badge>
                        )}
                        <Badge color={isSold ? 'rose' : isReserved ? 'amber' : 'emerald'}>
                          {isSold ? 'Sold' : isReserved ? 'Reserved' : 'Available'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <p className="text-lg font-bold gradient-text mt-1">{formatPrice(product.price)}</p>
                  <div className="flex gap-2 mt-3">
                    {!isSold && (
                      <Link
                        to={`/product/${product.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                      >
                        <Eye size={14} />
                        View
                      </Link>
                    )}
                    {!isSold && !isReserved && (
                      <button
                        onClick={() => handleDeleteClick(product)}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 px-3 py-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    )}
                    {isReserved && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                        Order pending
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={handleDeleteCancel}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center gap-3 p-5 border-b border-gray-100 dark:border-gray-800">
                <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                  <AlertTriangle size={20} className="text-rose-600 dark:text-rose-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete Product</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">This action cannot be undone</p>
                </div>
                <button
                  onClick={handleDeleteCancel}
                  disabled={deleting}
                  className="ml-auto p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 transition-all disabled:opacity-50"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <img
                    src={deleteModal.product?.image_urls?.[0] || deleteModal.product?.image_url || '/placeholder.svg'}
                    alt={deleteModal.product?.title}
                    className="w-16 h-16 rounded-lg object-contain bg-white p-2 border border-gray-100 shadow-sm"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                      {deleteModal.product?.title}
                    </h4>
                    <p className="text-lg font-bold gradient-text mt-1">
                      {formatPrice(deleteModal.product?.price)}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                  Are you sure you want to delete this product? This will permanently remove it from your listings and it will no longer be visible to other students.
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100 dark:border-gray-800">
                <button
                  onClick={handleDeleteCancel}
                  disabled={deleting}
                  className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-500/25 transition-all disabled:opacity-50"
                >
                  {deleting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Delete Product
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
