import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, MessageCircle, KeyRound, Send, Loader2, XCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import OrderStatusBadge from '../components/order/OrderStatusBadge';
import OTPModal from '../components/order/OTPModal';
import CancelOrderModal from '../components/order/CancelOrderModal';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { formatPrice, formatDate } from '../utils/helpers';
import { ORDER_STATUS } from '../constants';
import orderService from '../services/orderService';
import otpService from '../services/otpService';

// Helper to extract first image URL from product_image (stored as JSON string)
function getOrderImage(order) {
  if (order.product_image) {
    try {
      const images = JSON.parse(order.product_image);
      return images[0] || '/placeholder.svg';
    } catch {
      return order.product_image;
    }
  }
  return '/placeholder.svg';
}

export default function Orders() {
  const { user } = useAuth();
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [otpModal, setOtpModal] = useState({ open: false, order: null, mode: 'generate' });
  const [cancelModal, setCancelModal] = useState({ open: false, order: null });
  const [confirmingOrderId, setConfirmingOrderId] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const [buyRes, sellRes] = await Promise.all([
        orderService.getByBuyer(),
        orderService.getBySeller(),
      ]);
      // Merge buy and sell orders, deduplicate by id
      const buyOrders = (buyRes.data || []).map((o) => ({ ...o, _role: 'buyer' }));
      const sellOrders = (sellRes.data || []).map((o) => ({ ...o, _role: 'seller' }));
      const merged = [...buyOrders];
      sellOrders.forEach((so) => {
        if (!merged.find((o) => o.id === so.id)) {
          merged.push(so);
        }
      });
      // Sort by created_at descending
      merged.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setAllOrders(merged);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleOtpModalClose = () => {
    setOtpModal({ open: false, order: null, mode: 'generate' });
    // Refresh orders to reflect any status changes
    fetchOrders();
  };

  const handleCancelModalClose = () => {
    setCancelModal({ open: false, order: null });
  };

  const handleOrderCancelled = () => {
    // Refresh orders after successful cancellation
    fetchOrders();
  };

  const handleConfirmOrder = async (orderId) => {
    try {
      setConfirmingOrderId(orderId);
      await orderService.updateStatus(orderId, ORDER_STATUS.CONFIRMED);
      // Auto-initiate delivery OTP when seller confirms the order
      await otpService.generate(orderId);
      await otpService.sendViaEmail(orderId);
      await fetchOrders();
    } catch (err) {
      console.error('Failed to confirm order:', err);
    } finally {
      setConfirmingOrderId(null);
    }
  };

  const filteredOrders = statusFilter === 'all'
    ? allOrders
    : allOrders.filter((o) => o.order_status === statusFilter);

  const statusOptions = [
    { value: 'all', label: 'All' },
    { value: ORDER_STATUS.PENDING, label: 'Pending' },
    { value: ORDER_STATUS.CONFIRMED, label: 'Confirmed' },
    { value: ORDER_STATUS.COMPLETED, label: 'Delivered' },
    { value: ORDER_STATUS.CANCELLED, label: 'Cancelled' },
  ];

  return (
    <div className="section-padding page-padding">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Orders</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              {loading ? '...' : `${allOrders.length} total orders`}
            </p>
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setStatusFilter(option.value)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all border
                ${statusFilter === option.value
                  ? 'gradient-bg text-white border-transparent shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-indigo-500" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-16">
            <Package size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No orders found</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
              {statusFilter === 'all' ? "You haven't placed or received any orders yet." : "No orders with this status."}
            </p>
            <Link to="/home" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
              Browse products →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order, i) => {
              const isBuyer = order._role === 'buyer';
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="card p-5"
                >
                  <div className="flex flex-col sm:flex-row gap-4">
                    <img
                      src={getOrderImage(order)}
                      alt={order.product_title}
                      className="w-full sm:w-28 h-28 rounded-xl object-contain bg-white dark:bg-gray-800 p-2 border border-gray-100 dark:border-gray-700 shadow-sm flex-shrink-0"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {order.product_title}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            {isBuyer
                              ? `Seller: ${order.seller_username}`
                              : `Buyer: ${order.buyer_username}`}
                            {' · '}{formatDate(order.created_at)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge color={isBuyer ? 'cyan' : 'purple'}>
                            {isBuyer ? 'Buying' : 'Selling'}
                          </Badge>
                          <OrderStatusBadge status={order.order_status} />
                        </div>
                      </div>
                      <p className="text-xl font-bold gradient-text mt-2">
                        {formatPrice(order.product_price)}
                      </p>

                      <div className="flex flex-wrap gap-2 mt-3">
                        {/* Seller: Confirm Order — required to move PENDING -> CONFIRMED */}
                        {!isBuyer && order.order_status === ORDER_STATUS.PENDING && (
                          <Button
                            variant="success"
                            size="sm"
                            icon={confirmingOrderId === order.id ? Loader2 : CheckCircle2}
                            loading={confirmingOrderId === order.id}
                            onClick={() => handleConfirmOrder(order.id)}
                          >
                            Confirm Order
                          </Button>
                        )}

                        {/* Chat button — available while order is active */}
                        {order.order_status !== ORDER_STATUS.CANCELLED &&
                          order.order_status !== ORDER_STATUS.COMPLETED && (
                            <Link to={`/chat/${order.id}`}>
                              <Button variant="secondary" size="sm" icon={MessageCircle}>Chat</Button>
                            </Link>
                          )}

                        {/* Buyer/Seller: Cancel Order — available for PENDING and CONFIRMED orders */}
                        {(order.order_status === ORDER_STATUS.PENDING || order.order_status === ORDER_STATUS.CONFIRMED) && (
                          <Button
                            variant="danger"
                            size="sm"
                            icon={XCircle}
                            onClick={() => setCancelModal({ open: true, order })}
                          >
                            Cancel Order
                          </Button>
                        )}

                        {/* Seller: Initiate Delivery — generates OTP & emails buyer */}
                        {!isBuyer && order.order_status === ORDER_STATUS.CONFIRMED && (
                          <Button
                            variant="primary"
                            size="sm"
                            icon={Send}
                            onClick={() => setOtpModal({ open: true, order, mode: 'generate' })}
                          >
                            Initiate Delivery
                          </Button>
                        )}

                        {/* Seller: Enter OTP received from buyer — also shown for CONFIRMED */}
                        {!isBuyer && order.order_status === ORDER_STATUS.CONFIRMED && (
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={KeyRound}
                            onClick={() => setOtpModal({ open: true, order, mode: 'verify' })}
                          >
                            Enter OTP
                          </Button>
                        )}

                        {/* Buyer: Waiting indicator when order is confirmed */}
                        {isBuyer && order.order_status === ORDER_STATUS.PENDING && (
                          <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 px-3 py-1.5">
                            ⏳ Waiting for seller confirmation
                          </span>
                        )}

                        {/* Buyer: Waiting indicator when order is confirmed */}
                        {isBuyer && order.order_status === ORDER_STATUS.CONFIRMED && (
                          <span className="text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1 px-3 py-1.5">
                            📧 Waiting for seller to initiate delivery
                          </span>
                        )}

                        {/* Completed indicator */}
                        {order.order_status === ORDER_STATUS.COMPLETED && (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 px-3 py-1.5">
                            ✅ Delivered on {formatDate(order.completed_at)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      <OTPModal
        isOpen={otpModal.open}
        onClose={handleOtpModalClose}
        order={otpModal.order}
        mode={otpModal.mode}
        onVerified={fetchOrders}
      />

      <CancelOrderModal
        isOpen={cancelModal.open}
        onClose={handleCancelModalClose}
        order={cancelModal.order}
        onCancelled={handleOrderCancelled}
      />
    </div>
  );
}
