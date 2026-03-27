import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import SoldRibbon from './SoldRibbon';
import { formatPrice } from '../../utils/helpers';

export default function ProductCard({ product, index = 0 }) {
  const isSold = product.product_status === 'SOLD_OUT' || product.product_status === 'sold' || product.status === 'sold';
  const isFree = product.price === 0;

  // Handle both API format and mock format for images
  const imageUrl = product.image_urls?.[0] || product.image_url || product.images?.[0] || '/placeholder.svg';

  // Handle both API format and mock format for seller info
  const sellerLocation = product.seller_college || product.seller?.campus || 'Campus';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Link
        to={isSold ? '#' : `/product/${product.id}`}
        className={`block group ${isSold ? 'opacity-60 pointer-events-auto cursor-not-allowed' : ''}`}
      >
        <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 transition-all duration-300 hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-700 hover:-translate-y-1">
          {/* Image Container with White Background */}
          <div className="relative overflow-hidden bg-white">
            {/* Square aspect ratio for consistent product photos */}
            <div className="aspect-square p-4 bg-white">
              <img
                src={imageUrl}
                alt={product.title}
                className="w-full h-full object-contain filter drop-shadow hover:drop-shadow-lg transition-all duration-500 group-hover:scale-110"
              />
            </div>

            {/* Gradient Overlay at Bottom */}
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />

            {/* SOLD OUT ribbon — shows when product is SOLD_OUT */}
            {isSold && (
              <div style={{
                position: "absolute", top: 12, left: 12,
                background: "#ef4444", color: "#fff",
                fontSize: 11, fontWeight: 700,
                padding: "3px 10px", borderRadius: 6,
                letterSpacing: "0.06em",
                boxShadow: "0 2px 8px rgba(239,68,68,0.4)",
                zIndex: 2,
              }}>
                SOLD OUT
              </div>
            )}

            {/* Legacy Sold Ribbon (if component exists) */}
            {isSold && <SoldRibbon />}

            {/* Price Tag with Enhanced Style */}
            <div className="absolute bottom-3 right-3">
              <motion.span
                whileHover={{ scale: 1.05 }}
                className={`backdrop-blur-md font-bold text-sm px-4 py-2 rounded-full shadow-2xl border ${
                  isFree
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-emerald-400'
                    : 'bg-white/95 dark:bg-gray-900/95 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700'
                }`}>
                {formatPrice(product.price)}
              </motion.span>
            </div>
          </div>

          {/* Info Section with Better Spacing */}
          <div className="p-5 bg-gradient-to-b from-gray-50/50 to-white dark:from-gray-800/50 dark:to-gray-900">
            <h3 className="font-bold text-gray-900 dark:text-white text-base line-clamp-2 mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors min-h-[3rem]">
              {product.title}
            </h3>

            {/* Campus Location with Icon */}
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg">
              <MapPin size={14} className="flex-shrink-0 text-indigo-500" />
              <span className="font-medium">{sellerLocation}</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
