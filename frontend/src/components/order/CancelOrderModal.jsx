import { useState, useEffect } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import api from '../../services/api';
import orderService from '../../services/orderService';

const CANCELLATION_REASONS = [
  { id: 'changed_mind', label: 'Changed my mind', icon: '🤔' },
  { id: 'found_better', label: 'Found a better deal elsewhere', icon: '💰' },
  { id: 'price_issue', label: 'Price is too high', icon: '📈' },
  { id: 'no_response', label: 'Seller/Buyer not responding', icon: '📵' },
  { id: 'item_issue', label: 'Issue with the item description', icon: '⚠️' },
  { id: 'cant_meet', label: "Can't arrange meetup", icon: '📍' },
  { id: 'wrong_item', label: 'Ordered wrong item', icon: '❌' },
  { id: 'other', label: 'Other reason', icon: '📝' },
];

export default function CancelOrderModal({ isOpen, onClose, order, onCancelled }) {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(null);

  // Test connectivity when modal opens
  useEffect(() => {
    if (isOpen) {
      testConnection();
    }
  }, [isOpen]);

  const testConnection = async () => {
    try {
      const response = await api.get('/auth/profile');
      setConnectionStatus('Connected and authenticated');
    } catch (err) {
      if (err.response?.status === 401) {
        setConnectionStatus('Connected but authentication expired');
      } else if (err.response) {
        setConnectionStatus(`Connected but server error (${err.response.status})`);
      } else {
        setConnectionStatus('Cannot connect to server');
      }
    }
  };

  if (!isOpen) return null;

  const handleCancel = async () => {
    if (!selectedReason) {
      setError('Please select a reason for cancellation');
      return;
    }

    const reason = selectedReason === 'other'
      ? customReason.trim() || 'Other reason (not specified)'
      : CANCELLATION_REASONS.find(r => r.id === selectedReason)?.label || selectedReason;

    setLoading(true);
    setError(null);

    try {
      await orderService.cancel(order.id, reason);
      onCancelled?.();
      onClose();
    } catch (err) {
      let errorMessage = 'Failed to cancel order';

      if (err.response) {
        const status = err.response.status;
        const detail = err.response.data?.detail;

        switch (status) {
          case 401:
            errorMessage = 'Your session has expired. Please refresh the page and log in again.';
            break;
          case 403:
            errorMessage = 'You do not have permission to cancel this order.';
            break;
          case 404:
            errorMessage = 'Order not found or may have been already cancelled.';
            break;
          case 400:
            errorMessage = detail || 'This order cannot be cancelled (may already be completed or cancelled).';
            break;
          default:
            errorMessage = detail || `Server error (${status}). Please try again or contact support.`;
        }
      } else if (err.code === 'ECONNREFUSED' || err.message?.includes('Network Error')) {
        errorMessage = 'Cannot connect to server. Please check if the server is running.';
      } else {
        errorMessage = err.message || 'Network error. Please check your internet connection.';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertTriangle className="text-red-500" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Cancel Order</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Order #{order?.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Product Info */}
          {order?.product_title && (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{order.product_title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">₹{order.product_price}</p>
            </div>
          )}

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Please select a reason for cancelling this order. This will help the other party understand why.
          </p>

          {/* Connection Status */}
          {connectionStatus && (
            <div className={`mb-4 p-2 text-xs rounded-lg ${
              connectionStatus.includes('Connected and authenticated')
                ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                : connectionStatus.includes('Connected but')
                ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300'
                : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
            }`}>
              Status: {connectionStatus}
            </div>
          )}

          {/* Reason Selection */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {CANCELLATION_REASONS.map((reason) => (
              <label
                key={reason.id}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border-2 ${
                  selectedReason === reason.id
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                    : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <input
                  type="radio"
                  name="cancellation_reason"
                  value={reason.id}
                  checked={selectedReason === reason.id}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="sr-only"
                />
                <span className="text-xl">{reason.icon}</span>
                <span className={`text-sm ${
                  selectedReason === reason.id
                    ? 'text-red-700 dark:text-red-300 font-medium'
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {reason.label}
                </span>
                {selectedReason === reason.id && (
                  <span className="ml-auto w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="w-2 h-2 bg-white rounded-full" />
                  </span>
                )}
              </label>
            ))}
          </div>

          {/* Custom Reason Input */}
          {selectedReason === 'other' && (
            <div className="mt-3">
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Please specify your reason..."
                rows={2}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none"
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <p className="mt-3 text-sm text-red-500 flex items-center gap-2">
              <AlertTriangle size={14} />
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all disabled:opacity-50"
          >
            Keep Order
          </button>
          <button
            onClick={handleCancel}
            disabled={loading || !selectedReason}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Cancelling...
              </>
            ) : (
              'Cancel Order'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
