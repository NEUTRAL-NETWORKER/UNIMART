import { motion } from 'framer-motion';
import { CheckCircle, Package } from 'lucide-react';

export default function DeliveryConfirmation({ order }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-8 space-y-4"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 10, stiffness: 200, delay: 0.2 }}
        className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center shadow-xl shadow-emerald-500/20"
      >
        <CheckCircle size={48} className="text-white" />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
          Delivery Confirmed! 🎉
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          The product has been successfully delivered.
        </p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-emerald-700 dark:text-emerald-300 text-sm font-medium"
      >
        <Package size={16} />
        Order #{order?.id?.slice(-6)}
      </motion.div>
    </motion.div>
  );
}
