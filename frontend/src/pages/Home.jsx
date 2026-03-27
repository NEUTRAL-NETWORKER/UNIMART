import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Zap, BadgeCheck, Users, Loader2, RefreshCw } from 'lucide-react';
import ProductGrid from '../components/product/ProductGrid';
import ProductFilters from '../components/product/ProductFilters';
import { CATEGORIES } from '../constants';
import api from '../services/api';

export default function Home() {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const [registeredCount, setRegisteredCount] = useState('...');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // FIXED: Declare filters state BEFORE using it in useEffect
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    condition: '',
    sort: 'newest',
    priceMin: '',
    priceMax: '',
    campus: '',
    freeOnly: false,
  });

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/stats');
        setRegisteredCount(data.registeredStudents + "+");
      } catch (err) {
        console.error("Failed to fetch stats", err);
        setRegisteredCount('1,250+');
      }
    };
    fetchStats();
  }, []);

  // Fetch products with filters from API
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (filters.category) params.category = filters.category;
      if (filters.priceMin !== '') params.min_price = filters.priceMin;
      if (filters.priceMax !== '') params.max_price = filters.priceMax;
      if (searchQuery) params.search = searchQuery;

      const { data } = await api.get('/products/', { params });
      setProducts(data);
    } catch (err) {
      console.error('Failed to fetch products', err);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filters.category, filters.priceMin, filters.priceMax]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Condition (from description) — client-side only
    if (filters.condition) {
      result = result.filter((p) => p.description?.includes(`[Condition: ${filters.condition}]`));
    }

    // Campus — client-side only
    if (filters.campus) {
      result = result.filter((p) => p.seller_college === filters.campus);
    }

    // Free Only
    if (filters.freeOnly) {
      result = result.filter((p) => p.price === 0);
    }

    // Sort
    switch (filters.sort) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      case 'newest':
      default:
        result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    return result;
  }, [filters, products]);

  const clearFilters = () => {
    setFilters({ category: '', condition: '', sort: 'newest', priceMin: '', priceMax: '', campus: '', freeOnly: false });
  };

  const stats = [
    { icon: Users, label: 'Registered Students', value: registeredCount, color: 'indigo' },
    { icon: TrendingUp, label: 'Categories', value: CATEGORIES.length, color: 'purple' },
    { icon: Zap, label: 'Quick Deals', value: '24h', color: 'pink' },
    { icon: BadgeCheck, label: 'Students', value: 'Verified', color: 'emerald' },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-indigo-950 to-purple-950 py-16 lg:py-24">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/10 rounded-full blur-3xl" />
        </div>

        <div className="section-padding relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-sm text-white/80 mb-6"
            >
              <Sparkles size={14} className="text-yellow-400" />
              Student-Only Marketplace
            </motion.div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
              Buy & Sell with{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                Campus Students
              </span>
            </h1>
            <p className="text-lg text-gray-300 mt-6 max-w-xl mx-auto">
              The trusted marketplace for university students. Trade textbooks, electronics, notes, and more — safely and privately.
            </p>

          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-3xl mx-auto"
          >
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="text-center p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl"
              >
                <stat.icon size={22} className="mx-auto mb-2 text-indigo-400" />
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Categories Quick Access */}
      <section className="section-padding py-8 -mt-6 relative z-10">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilters({ ...filters, category: filters.category === cat.id ? '' : cat.id })}
              className={`flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-medium transition-all border shadow-sm
                ${filters.category === cat.id
                  ? 'gradient-bg text-white border-transparent shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-indigo-300 hover:shadow-md'
                }`}
            >
              <span className="text-lg">{cat.icon}</span>
              {cat.name}
              {filters.category === cat.id && (
                <span className="ml-1 flex items-center justify-center w-4 h-4 rounded-full bg-white/25 text-white text-xs font-bold leading-none">✕</span>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Products Section */}
      <section className="section-padding pb-20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {searchQuery ? `Results for "${searchQuery}"` : 'Latest Listings'}
          </h2>
          {error && (
            <button
              onClick={fetchProducts}
              className="flex items-center gap-2 text-sm text-indigo-600 hover:underline"
            >
              <RefreshCw size={14} />
              Retry
            </button>
          )}
        </div>

        <ProductFilters
          filters={filters}
          onFilterChange={setFilters}
          onClear={clearFilters}
          totalResults={filteredProducts.length}
        />

        <div className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-gray-500 dark:text-gray-400">{error}</p>
            </div>
          ) : (
            <ProductGrid products={filteredProducts} />
          )}
        </div>
      </section>
    </div>
  );
}
