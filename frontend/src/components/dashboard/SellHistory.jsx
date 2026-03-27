import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { MessageCircle, KeyRound, Send, CheckCircle2, Loader2 } from 'lucide-react';
import OrderStatusBadge from '../order/OrderStatusBadge';
import Button from '../common/Button';
import { formatPrice, formatDate } from '../../utils/helpers';
import orderService from '../../services/orderService';
import otpService from '../../services/otpService';

export default function SellHistory({ orders, onInitiateDelivery, onVerifyOTP, onConfirmOrder }) {
  const [confirmingOrderId, setConfirmingOrderId] = useState(null);

  const handleConfirmOrder = async (orderId) => {
    try {
      setConfirmingOrderId(orderId);
      await orderService.updateStatus(orderId, 'CONFIRMED');
      // Auto-initiate delivery OTP when seller confirms the order
      await otpService.generate(orderId);
      await otpService.sendViaEmail(orderId);
      if (onConfirmOrder) {
        await onConfirmOrder();
      }
    } catch (err) {
      console.error('Failed to confirm order:', err);
    } finally {
      setConfirmingOrderId(null);
    }
  };

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-4xl mb-3">💰</p>
        <p className="text-gray-500 dark:text-gray-400">You haven't sold anything yet.</p>
        <Link to="/sell" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline mt-2 inline-block">
          Sell a product →
        </Link>
      </div>
    );
  }

  // Helper to get the first image from order data
  const getOrderImage = (order) => {
    if (order.product_image) {
      try {
        const images = JSON.parse(order.product_image);
        return images[0] || '/placeholder.svg';
      } catch {
        return order.product_image;
      }
    }
    return '/placeholder.svg';
  };

  return (
    <div className="space-y-4">
      {orders.map((order, i) => (
        <motion.div
          key={order.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="card p-4"
        >
          <div className="flex gap-4">
            <img
              src={getOrderImage(order)}
              alt={order.product_title}
              className="w-20 h-20 rounded-xl object-contain flex-shrink-0 bg-white p-2 border border-gray-100 shadow-sm"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                    {order.product_title}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Buyer: {order.buyer_username} · {formatDate(order.created_at)}
                  </p>
                </div>
                <OrderStatusBadge status={order.order_status} />
              </div>
              <p className="text-lg font-bold gradient-text mt-1">{formatPrice(order.product_price)}</p>
              <div className="flex gap-2 mt-3 flex-wrap">
                {order.order_status === 'PENDING' && (
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

                {order.order_status !== 'CANCELLED' && order.order_status !== 'COMPLETED' && (
                  <Link to={`/chat/${order.id}`}>
                    <Button variant="secondary" size="sm" icon={MessageCircle}>Chat</Button>
                  </Link>
                )}
                {order.order_status === 'CONFIRMED' && (
                  <>
                    <Button variant="primary" size="sm" icon={Send} onClick={() => onInitiateDelivery(order)}>
                      Initiate Delivery
                    </Button>
                    <Button variant="secondary" size="sm" icon={KeyRound} onClick={() => onVerifyOTP(order)}>
                      Enter OTP
                    </Button>
                  </>
                )}
                {order.order_status === 'COMPLETED' && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    ✅ Delivered on {formatDate(order.completed_at)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
