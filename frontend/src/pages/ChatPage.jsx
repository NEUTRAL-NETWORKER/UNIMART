import { useParams } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Shield, Loader2 } from 'lucide-react';
import ChatBox from '../components/chat/ChatBox';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrderContext';
import { useChat } from '../context/ChatContext';
import { ORDER_STATUS } from '../constants';

export default function ChatPage() {
  const { orderId } = useParams();
  const { user } = useAuth();
  const { getOrderById } = useOrders();
  const { messages, loadMessages, sendMessage, loading: chatLoading } = useChat();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch order and messages
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const orderData = await getOrderById(orderId);
      setOrder(orderData);
      await loadMessages(orderId);
    } catch (err) {
      console.error('Failed to load chat:', err);
      setError(err?.response?.data?.detail || 'Failed to load chat');
    } finally {
      setLoading(false);
    }
  }, [orderId, getOrderById, loadMessages]);

  // Fetch data when page loads
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="section-padding page-padding text-center flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-indigo-500 mb-4" />
        <p className="text-gray-500 dark:text-gray-400">Loading chat...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="section-padding page-padding text-center">
        <p className="text-6xl mb-4">🔒</p>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Chat Unavailable</h2>
        <p className="text-gray-500 dark:text-gray-400">
          {error || "This chat doesn't exist or the order was not found. You can only chat after placing an order."}
        </p>
      </div>
    );
  }

  const isBuyer = order.buyer_register_number === user?.studentId;
  const otherUser = isBuyer ? order.seller_username : order.buyer_username;
  const otherUserProfilePicture = isBuyer
    ? order.seller_profile_picture_url
    : order.buyer_profile_picture_url;
  const orderMessages = messages[orderId] || [];

  // Chat is read-only when the order is completed or cancelled
  const isReadOnly = order.order_status === ORDER_STATUS.COMPLETED || order.order_status === ORDER_STATUS.CANCELLED;

  const handleSend = async (text) => {
    if (!isReadOnly) {
      await sendMessage(orderId, text);
    }
  };

  // Format order for ChatBox component
  const formattedOrder = {
    ...order,
    status: order.order_status,
    product: order.product || { title: order.product_title },
    buyer: {
      username: order.buyer_username,
      profilePictureUrl: order.buyer_profile_picture_url,
    },
    seller: {
      username: order.seller_username,
      profilePictureUrl: order.seller_profile_picture_url,
    },
  };

  return (
    <div className="section-padding py-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto"
        style={{ height: 'calc(100vh - 120px)' }}
      >
        {/* Privacy Banner */}
        <div className="flex items-center gap-2 mb-3 px-2">
          <Shield size={14} className="text-emerald-500" />
          <p className="text-xs text-emerald-600 dark:text-emerald-400">
            <strong>Privacy Protected</strong> — Personal contact details (email/phone) are never shared. Coordinate through this chat only.
          </p>
        </div>

        <ChatBox
          messages={orderMessages}
          order={formattedOrder}
          currentUser={user?.studentId}
          otherUser={otherUser}
          otherUserProfilePicture={otherUserProfilePicture}
          onSend={handleSend}
          readOnly={isReadOnly}
          loading={chatLoading}
        />
      </motion.div>
    </div>
  );
}
