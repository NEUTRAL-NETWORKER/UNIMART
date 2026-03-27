import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, AlertCircle, CheckCircle, MessageCircle, Shield, Hash } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { formatPrice } from '../../utils/helpers';
import { useOrders } from '../../context/OrderContext';
import { useNotifications } from '../../context/NotificationContext';

export default function OrderModal({ isOpen, onClose, product }) {
  const { createOrder } = useOrders();
  const { success, error } = useNotifications();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);

  if (!product) return null;

  const handleOrder = async () => {
    setLoading(true);
    try {
      const newOrder = await createOrder(product.id);
      setPlacedOrder(newOrder);
      setOrderPlaced(true);
      success(`Order placed for "${product.title}"!`);
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Failed to place order. Please try again.';
      error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = () => {
    if (placedOrder) {
      onClose();
      setOrderPlaced(false);
      setPlacedOrder(null);
      navigate(`/chat/${placedOrder.id}`);
    }
  };

  const handleClose = () => {
    setOrderPlaced(false);
    setPlacedOrder(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={orderPlaced ? '' : 'Confirm Order'} size="md">
      <div className="space-y-6">

        {/* ============================================================ */}
        {/* STATE 1: Confirm Order (before placing) */}
        {/* ============================================================ */}
        {!orderPlaced ? (
          <>
            {/* Product Summary */}
            <div className="flex gap-4">
              <img
                src={product.image_urls?.[0] || product.image_url || '/placeholder.svg'}
                alt={product.title}
                className="w-24 h-24 rounded-xl object-contain flex-shrink-0 bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700"
              />
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">{product.title}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{product.seller_college || 'Campus'}</p>
                <p className="text-xl font-bold gradient-text mt-2">{formatPrice(product.price)}</p>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800/30 rounded-xl p-4 space-y-2">
              <h5 className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">What happens next?</h5>
              <ul className="text-xs text-indigo-600 dark:text-indigo-400 space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-800/30 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">1</span>
                  Your order request will be sent to the seller
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-800/30 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">2</span>
                  A private chat will open to coordinate the meetup
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-800/30 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">3</span>
                  The seller will initiate a secure OTP handshake at delivery
                </li>
              </ul>
            </div>

            {/* Privacy Notice */}
            <div className="flex items-start gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/30 rounded-xl">
              <Shield size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                <strong>Privacy Protected:</strong> Your email, phone number, and full name are never shared with the other party. All coordination happens within the app.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="secondary" size="md" fullWidth onClick={handleClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                fullWidth
                loading={loading}
                onClick={handleOrder}
                icon={ShoppingCart}
              >
                Confirm Order
              </Button>
            </div>
          </>
        ) : (
          /* ============================================================ */
          /* STATE 2: Success Dashboard (after placing order) */
          /* ============================================================ */
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            {/* Success Icon */}
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 10, stiffness: 200, delay: 0.1 }}
                className="w-20 h-20 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center mb-4"
              >
                <CheckCircle size={44} className="text-emerald-500" />
              </motion.div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Order Placed Successfully!</h3>
            </div>

            {/* Order Details Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Hash size={12} /> Order ID
                </span>
                <span className="text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  #ORD-{placedOrder?.id?.toString().slice(-6) || '000001'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">Product</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{product.title}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">Price</span>
                <span className="text-sm font-bold gradient-text">{formatPrice(product.price)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">Status</span>
                <span className="text-xs px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 font-medium">
                  Pending Seller Confirmation
                </span>
              </div>
            </motion.div>

            {/* Privacy Banner */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-start gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/30 rounded-xl"
            >
              <Shield size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                <strong>Privacy Protected:</strong> The seller's email, phone, and full name remain hidden. All coordination happens through the in-app chat.
              </p>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-3"
            >
              <Button
                variant="primary"
                size="md"
                fullWidth
                icon={MessageCircle}
                onClick={handleStartChat}
              >
                Start Chat with Seller
              </Button>
              <Button variant="secondary" size="md" fullWidth onClick={handleClose}>
                Back to Dashboard
              </Button>
            </motion.div>
          </motion.div>
        )}

      </div>
    </Modal>
  );
}
