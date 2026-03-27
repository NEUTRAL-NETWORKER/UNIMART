import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, User, Calendar, Shield, Tag, ArrowLeft, ShoppingCart } from 'lucide-react';
import Button from '../common/Button';
import Badge from '../common/Badge';
import SoldRibbon from './SoldRibbon';
import { formatPrice, formatDate } from '../../utils/helpers';
import { CATEGORIES, CONDITION_OPTIONS } from '../../constants';

export default function ProductDetails({ product, onOrder, onBack }) {
  const [selectedImage, setSelectedImage] = useState(0);
  const isSold = product.product_status === 'sold' || product.status === 'sold';
  const category = CATEGORIES.find((c) => c.id === product.category);

  // Handle both API format and mock format for images
  const images = product.image_urls?.length > 0
    ? product.image_urls
    : product.images?.length > 0
      ? product.images
      : [product.image_url || '/placeholder.svg'];

  // Extract condition from description if embedded
  let condition = product.condition;
  if (!condition && product.description) {
    const match = product.description.match(/\[Condition: ([^\]]+)\]/);
    if (match) {
      condition = match[1];
    }
  }

  // Clean description by removing condition tag
  const cleanDescription = product.description?.replace(/\[Condition: [^\]]+\]\n\n?/, '') || '';

  // Handle both API format and mock format for seller info
  const sellerUsername = product.seller_username || product.seller?.username || 'Unknown';
  const sellerCampus = product.seller_college || product.seller?.campus || 'Campus';

  // Handle both API format and mock format for dates
  const createdAt = product.created_at || product.createdAt;

  const conditionColorMap = {
    'New': 'emerald',
    'Like New': 'cyan',
    'Excellent': 'indigo',
    'Good': 'amber',
    'Acceptable': 'orange',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto"
    >
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mb-6 group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Back to browse</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Section */}
        <div className="space-y-4">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="relative overflow-hidden bg-white rounded-3xl border border-gray-100 shadow-2xl shadow-indigo-500/10"
          >
            <div className="aspect-square flex items-center justify-center p-8">
              <img
                src={images[selectedImage]}
                alt={product.title}
                className="max-w-full max-h-full object-contain filter drop-shadow-xl transition-transform duration-500 hover:scale-110"
              />
            </div>
            {isSold && <SoldRibbon />}
          </motion.div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden border-2 transition-all duration-300 bg-white shadow-md
                    ${i === selectedImage ? 'border-indigo-500 ring-4 ring-indigo-500/20 scale-105' : 'border-gray-100 opacity-70 hover:opacity-100 hover:scale-105 hover:border-indigo-300'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-contain p-2" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details Section */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {category && (
                <Badge color={category?.color || 'indigo'}>
                  <span className="mr-1">{category?.icon}</span>
                  {category?.name}
                </Badge>
              )}
              {condition && (
                <Badge color={conditionColorMap[condition] || 'gray'}>
                  {condition}
                </Badge>
              )}
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
              {product.title}
            </h1>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold gradient-text">
              {formatPrice(product.price)}
            </span>
            {isSold && (
              <Badge color="rose">SOLD OUT</Badge>
            )}
          </div>

          {/* Description */}
          <div className="card p-6 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800/80 dark:to-gray-900/50 border border-gray-100 dark:border-gray-700/50 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-colors" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 uppercase tracking-wider flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              Description
            </h3>
            <p className="text-[15px] text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap relative z-10">
              {cleanDescription || 'No description provided.'}
            </p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card p-4 flex items-center gap-4 bg-white/50 dark:bg-gray-800/30 hover:bg-white dark:hover:bg-gray-800 transition-colors shadow-sm border border-gray-100/50 dark:border-gray-700/30 group">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <User size={20} className="text-indigo-500" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Seller</p>
                <p className="text-base font-bold text-gray-900 dark:text-white">{sellerUsername}</p>
              </div>
            </div>
            <div className="card p-4 flex items-center gap-4 bg-white/50 dark:bg-gray-800/30 hover:bg-white dark:hover:bg-gray-800 transition-colors shadow-sm border border-gray-100/50 dark:border-gray-700/30 group">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <MapPin size={20} className="text-purple-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Campus</p>
                <p className="text-base font-bold text-gray-900 dark:text-white truncate">{sellerCampus}</p>
              </div>
            </div>
            {createdAt && (
              <div className="card p-4 flex items-center gap-4 bg-white/50 dark:bg-gray-800/30 hover:bg-white dark:hover:bg-gray-800 transition-colors shadow-sm border border-gray-100/50 dark:border-gray-700/30 group">
                <div className="w-12 h-12 rounded-2xl bg-pink-50 dark:bg-pink-900/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Calendar size={20} className="text-pink-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Listed</p>
                  <p className="text-base font-bold text-gray-900 dark:text-white">{formatDate(createdAt)}</p>
                </div>
              </div>
            )}
            {condition && (
              <div className="card p-4 flex items-center gap-4 bg-white/50 dark:bg-gray-800/30 hover:bg-white dark:hover:bg-gray-800 transition-colors shadow-sm border border-gray-100/50 dark:border-gray-700/30 group">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Shield size={20} className="text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Condition</p>
                  <p className="text-base font-bold text-gray-900 dark:text-white">{condition}</p>
                </div>
              </div>
            )}
          </div>


          {/* Order Button */}
          <div className="pt-4">
            <Button
              variant={isSold ? 'secondary' : 'primary'}
              size="xl"
              fullWidth
              disabled={isSold}
              onClick={onOrder}
              icon={ShoppingCart}
              className={`transform transition-all duration-300 ${!isSold && "hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/25"} !rounded-2xl !py-4 text-lg`}
            >
              {isSold ? 'This item has been sold' : 'Place Order'}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
