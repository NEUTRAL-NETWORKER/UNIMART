import { useState } from 'react';
import { Key, Mail, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { ORDER_STATUS } from '../../constants';

export default function DeliveryOTPPanel({ order, isSeller, onOrderComplete }) {
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Only show for seller when order is CONFIRMED
  if (!isSeller || order.status !== ORDER_STATUS.CONFIRMED) {
    return null;
  }

  const handleGenerateOTP = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const { data } = await api.post('/otp/generate', { orderId: order.id });
      setGeneratedOtp(data.otp);
      setMessage('OTP generated! Click "Send to Buyer" to email it.');
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to generate OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    setSendingEmail(true);
    setError(null);
    setMessage(null);
    try {
      await api.post('/otp/send-email', { orderId: order.id });
      setMessage('OTP sent to buyer\'s email! Wait for buyer to share the code with you.');
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      setError('Please enter the OTP');
      return;
    }
    setVerifying(true);
    setError(null);
    setMessage(null);
    try {
      await api.post('/otp/verify', { orderId: order.id, otp: otp.trim() });
      setMessage('Transaction completed successfully!');
      setGeneratedOtp(null);
      setOtp('');
      // Notify parent to refresh order
      if (onOrderComplete) {
        onOrderComplete();
      }
    } catch (err) {
      setError(err?.response?.data?.detail || 'Invalid OTP');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="mx-4 mb-3 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-xl border border-indigo-200 dark:border-indigo-800">
      <div className="flex items-center gap-2 mb-3">
        <Key size={18} className="text-indigo-600 dark:text-indigo-400" />
        <h4 className="font-semibold text-sm text-indigo-900 dark:text-indigo-100">
          Delivery Confirmation
        </h4>
      </div>

      <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
        When meeting the buyer, generate an OTP and send it to their email.
        Ask buyer to share the code with you to confirm delivery.
      </p>

      {/* Step 1: Generate OTP */}
      {!generatedOtp && (
        <button
          onClick={handleGenerateOTP}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Key size={16} />
          )}
          {loading ? 'Generating...' : 'Generate Delivery OTP'}
        </button>
      )}

      {/* Step 2: Show OTP + Send Email */}
      {generatedOtp && (
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2 py-3 bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-indigo-300 dark:border-indigo-600">
            <span className="text-2xl font-mono font-bold text-indigo-600 dark:text-indigo-400 tracking-widest">
              {generatedOtp}
            </span>
          </div>

          <button
            onClick={handleSendEmail}
            disabled={sendingEmail}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50"
          >
            {sendingEmail ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Mail size={16} />
            )}
            {sendingEmail ? 'Sending...' : 'Send OTP to Buyer\'s Email'}
          </button>

          {/* Step 3: Verify OTP */}
          <div className="pt-3 border-t border-indigo-200 dark:border-indigo-700">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              After buyer receives OTP, ask them to share it with you:
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                className="flex-1 px-3 py-2 text-center font-mono text-lg tracking-widest bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                onClick={handleVerifyOTP}
                disabled={verifying || otp.length !== 6}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50"
              >
                {verifying ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <CheckCircle size={16} />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      {message && (
        <div className="mt-3 flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
          <CheckCircle size={14} />
          {message}
        </div>
      )}
      {error && (
        <div className="mt-3 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle size={14} />
          {error}
        </div>
      )}
    </div>
  );
}
