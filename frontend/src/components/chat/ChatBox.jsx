import { useRef, useEffect } from 'react';
import { Lock } from 'lucide-react';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import ChatHeader from './ChatHeader';
import DeliveryOTPPanel from './DeliveryOTPPanel';

export default function ChatBox({ messages, order, currentUser, otherUser, onSend, readOnly = false, loading = false, onOrderComplete }) {
  const scrollRef = useRef(null);
  const isSeller = order?.seller_register_number === currentUser || order?.seller?.register_number === currentUser;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-xl">
      {/* Header */}
      <ChatHeader order={order} otherUser={otherUser} />

      {/* OTP Panel for Seller (only shows when order is CONFIRMED) */}
      <DeliveryOTPPanel order={order} isSeller={isSeller} onOrderComplete={onOrderComplete} />

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-1 bg-gray-50 dark:bg-gray-900"
        style={{ minHeight: '400px' }}
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
            <div className="text-center">
              <p className="text-4xl mb-2">💬</p>
              <p className="text-sm">Start the conversation!</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.sender === currentUser}
            />
          ))
        )}
      </div>

      {/* Input or Read-Only Banner */}
      {readOnly ? (
        <div className="flex items-center justify-center gap-2 p-4 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <Lock size={14} className="text-gray-400" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This chat is read-only. The order has been completed or cancelled.
          </p>
        </div>
      ) : (
        <ChatInput onSend={onSend} loading={loading} />
      )}
    </div>
  );
}
