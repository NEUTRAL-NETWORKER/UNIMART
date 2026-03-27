import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getInitials } from '../../utils/helpers';
import OrderStatusBadge from '../order/OrderStatusBadge';

export default function ChatHeader({ order, otherUser }) {
  const navigate = useNavigate();

  const handleBack = () => {
    // Navigate to orders page instead of browser history
    navigate('/orders');
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
      <button
        onClick={handleBack}
        className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
      >
        <ArrowLeft size={20} />
      </button>
      <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
        {getInitials(otherUser || 'User')}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">{otherUser}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {order?.product?.title}
        </p>
      </div>
      {order && <OrderStatusBadge status={order.status} />}
    </div>
  );
}
