import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, MapPin, ShoppingCart, Package, BadgeCheck, Pencil, Camera, Mail, Phone, GraduationCap, X, Check, Info, Lock, Save, Tag, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrderContext';
import HistoryTabs from '../components/dashboard/HistoryTabs';
import BuyHistory from '../components/dashboard/BuyHistory';
import SellHistory from '../components/dashboard/SellHistory';
import MyProducts from '../components/dashboard/MyProducts';
import OTPModal from '../components/order/OTPModal';
import Badge from '../components/common/Badge';
import { getInitials, formatDate } from '../utils/helpers';
import api from '../services/api';

const REFRESH_INTERVAL = 30000; // 30 seconds

export default function Dashboard() {
  const { user, updateProfile } = useAuth();
  const { getOrdersByBuyer, getOrdersBySeller } = useOrders();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'buy');
  const [otpModal, setOtpModal] = useState({ open: false, order: null, mode: 'generate' });

  // Orders state
  const [buyOrders, setBuyOrders] = useState([]);
  const [sellOrders, setSellOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Products state
  const [myProductsCount, setMyProductsCount] = useState(0);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Fetch counts from APIs + auto-refresh every 30s
  const fetchCounts = useCallback(async () => {
    try {
      const [buyData, sellData, prodRes] = await Promise.all([
        getOrdersByBuyer(),
        getOrdersBySeller(),
        api.get('/products/my'),
      ]);
      setBuyOrders(buyData || []);
      setSellOrders(sellData || []);
      setMyProductsCount(prodRes.data?.length || 0);
    } catch (error) {
      console.error('Failed to fetch dashboard counts:', error);
    } finally {
      setLoadingOrders(false);
      setLoadingProducts(false);
    }
  }, [getOrdersByBuyer, getOrdersBySeller]);

  useEffect(() => {
    fetchCounts(); // initial fetch

    const interval = setInterval(fetchCounts, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchCounts]);

  // Callback when a product is deleted
  const handleProductDeleted = () => {
    setMyProductsCount((prev) => Math.max(0, prev - 1));
  };

  // Profile picture
  const fileInputRef = useRef(null);

  // Info popover
  const [showInfoPopover, setShowInfoPopover] = useState(false);
  const infoRef = useRef(null);

  // Edit Profile Modal (opens from pencil icon next to username)
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    username: user?.username || '',
    email: user?.personalMailId || '',
    phone: user?.phoneNumber || '',
  });

  // Close popover on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (infoRef.current && !infoRef.current.contains(e.target)) {
        setShowInfoPopover(false);
      }
    };
    if (showInfoPopover) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showInfoPopover]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateProfile({ profile_picture_url: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  // Edit Profile Modal - avatar upload
  const editAvatarRef = useRef(null);
  const handleEditAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateProfile({ profile_picture_url: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditSave = () => {
    updateProfile({
      username: editForm.username.trim() || user.username,
      personal_mail_id: editForm.email.trim() || user.personalMailId,
      phone_number: editForm.phone.trim() || user.phoneNumber,
    });
    setShowEditModal(false);
  };

  const openEditModal = () => {
    setEditForm({
      username: user?.username || '',
      email: user?.personalMailId || '',
      phone: user?.phoneNumber || '',
    });
    setShowEditModal(true);
  };

  return (
    <div className="section-padding page-padding">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto space-y-8"
      >
        {/* Profile Header */}
        <div className="card p-6 lg:p-8 relative">
          {/* Info Icon — absolute positioned */}
          <div ref={infoRef} className="absolute" style={{ top: '15px', right: '15px' }}>
            <button
              onClick={() => setShowInfoPopover(!showInfoPopover)}
              className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
              title="Account Info"
            >
              <Info size={16} />
            </button>

            {/* Info Popover */}
            <AnimatePresence>
              {showInfoPopover && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-10 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 z-50"
                >
                  <div className="absolute -top-2 right-3 w-4 h-4 bg-white dark:bg-gray-800 border-l border-t border-gray-200 dark:border-gray-700 rotate-45" />
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Info size={14} className="text-indigo-500" />
                    Account Info
                  </h4>
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400 w-28 shrink-0">Registration Date</span>
                      <span className="text-xs font-semibold text-gray-900 dark:text-white">Joined: 28 Feb 2026</span>
                    </div>
                    <div className="h-px bg-gray-100 dark:bg-gray-700" />
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400 w-28 shrink-0">Username Changes</span>
                      <span className="text-xs font-semibold text-gray-900 dark:text-white">
                        {user?.usernameChangeCount || 0}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-center text-center sm:text-left gap-5 sm:gap-6 relative">
            {/* Avatar with upload */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 sm:w-20 sm:h-20 gradient-bg rounded-2xl flex items-center justify-center text-white text-3xl sm:text-2xl font-bold shadow-lg shadow-indigo-500/20 overflow-hidden">
                {user?.profilePictureUrl ? (
                  <img src={user.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  getInitials(user?.username || 'U')
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer"
              >
                <Camera size={20} className="text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>

            <div className="flex-1 min-w-0 w-full flex flex-col items-center sm:items-start">
              {/* Username with edit pencil (opens full edit modal) + verified badge */}
              <div className="flex items-center justify-center sm:justify-start gap-2 w-full flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate max-w-full">{user?.username}</h1>
                {user?.verified && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full shrink-0">
                    <BadgeCheck size={14} />
                    Verified
                  </span>
                )}
                <button
                  onClick={openEditModal}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 transition-all shrink-0"
                  title="Edit Profile"
                >
                  <Pencil size={14} />
                </button>
              </div>

              {/* Name */}
              {user?.name && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{user.name}</p>
              )}

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-2 mt-3 sm:mt-2 text-sm text-gray-500 dark:text-gray-400">
                {user?.university && (
                  <span className="flex items-center gap-1.5">
                    <GraduationCap size={14} className="shrink-0 text-indigo-500" />
                    <span className="truncate max-w-[200px] sm:max-w-none">{user.university}</span>
                  </span>
                )}
                {user?.college && (
                  <span className="flex items-center gap-1.5">
                    <MapPin size={14} className="shrink-0 text-purple-500" />
                    <span className="truncate max-w-[200px] sm:max-w-none">{user.college}</span>
                  </span>
                )}
                {user?.department && (
                  <span className="flex items-center gap-1.5">
                    <User size={14} className="shrink-0 text-pink-500" />
                    <span className="truncate max-w-[200px] sm:max-w-none">{user.department}</span>
                  </span>
                )}
              </div>

              {/* Contact & ID Info */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mt-3 sm:mt-2.5 text-xs text-gray-500 dark:text-gray-400">
                {user?.personalMailId && (
                  <span className="flex items-center gap-1.5 bg-gray-50/80 dark:bg-gray-800/80 px-2.5 py-1.5 rounded-lg border border-gray-100 dark:border-gray-700/50">
                    <Mail size={12} className="text-gray-400 shrink-0" />
                    <span className="truncate max-w-[180px] sm:max-w-none">{user.personalMailId}</span>
                  </span>
                )}
                {user?.phoneNumber && (
                  <span className="flex items-center gap-1.5 bg-gray-50/80 dark:bg-gray-800/80 px-2.5 py-1.5 rounded-lg border border-gray-100 dark:border-gray-700/50 shrink-0 whitespace-nowrap">
                    <Phone size={12} className="text-gray-400 shrink-0" />
                    +91 {user.phoneNumber}
                  </span>
                )}
                {user?.studentId && (
                  <span className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-500/20 shrink-0" title="Register Number">
                    <GraduationCap size={12} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span className="font-semibold text-indigo-700 dark:text-indigo-400">{user.studentId}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stats — 3 columns */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
            <div className="text-center">
              <div className="w-10 h-10 mx-auto rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mb-2">
                <ShoppingCart size={18} className="text-indigo-500" />
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {loadingOrders ? <Loader2 size={18} className="animate-spin mx-auto" /> : buyOrders.length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Purchases</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 mx-auto rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center mb-2">
                <Package size={18} className="text-purple-500" />
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {loadingOrders ? <Loader2 size={18} className="animate-spin mx-auto" /> : sellOrders.length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Sales</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-2">
                <Tag size={18} className="text-emerald-500" />
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {loadingProducts ? <Loader2 size={18} className="animate-spin mx-auto" /> : myProductsCount}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">My Products</p>
            </div>
          </div>
        </div>

        {/* History Section */}
        <div>
          <HistoryTabs
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
          <div className="mt-4">
            {loadingOrders ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              </div>
            ) : activeTab === 'buy' ? (
              <BuyHistory
                orders={buyOrders}
              />
            ) : activeTab === 'sell' ? (
              <SellHistory
                orders={sellOrders}
                onConfirmOrder={fetchCounts}
                onInitiateDelivery={(order) => setOtpModal({ open: true, order, mode: 'generate' })}
                onVerifyOTP={(order) => setOtpModal({ open: true, order, mode: 'verify' })}
              />
            ) : (
              <MyProducts onProductDeleted={handleProductDeleted} />
            )}
          </div>
        </div>
      </motion.div>

      {/* OTP Modal */}
      <OTPModal
        isOpen={otpModal.open}
        onClose={() => setOtpModal({ open: false, order: null, mode: 'generate' })}
        order={otpModal.order}
        mode={otpModal.mode}
        onVerified={fetchCounts}
      />

      {/* ═══════════ EDIT PROFILE MODAL ═══════════ */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Edit Profile</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
                {/* SECTION A: Official - Fixed */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Lock size={14} className="text-gray-400" />
                    <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Official Records (Fixed)</h3>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { label: 'University', value: user?.university || 'N/A', icon: GraduationCap },
                      { label: 'College', value: user?.college || 'N/A', icon: MapPin },
                      { label: 'Department', value: user?.department || 'N/A', icon: User },
                    ].map((field) => (
                      <div key={field.label} className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 opacity-60">
                        <field.icon size={14} className="text-gray-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider">{field.label}</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{field.value}</p>
                        </div>
                        <Lock size={12} className="text-gray-300 dark:text-gray-600 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* SECTION B: User - Editable */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Pencil size={14} className="text-indigo-500" />
                    <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Editable Fields</h3>
                  </div>

                  {/* Profile Picture */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative group">
                      <div className="w-16 h-16 gradient-bg rounded-xl flex items-center justify-center text-white text-xl font-bold overflow-hidden">
                        {user?.profilePictureUrl ? (
                          <img src={user.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          getInitials(user?.username || 'U')
                        )}
                      </div>
                      <button
                        onClick={() => editAvatarRef.current?.click()}
                        className="absolute inset-0 rounded-xl bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer"
                      >
                        <Camera size={16} className="text-white" />
                      </button>
                      <input
                        ref={editAvatarRef}
                        type="file"
                        accept="image/*"
                        onChange={handleEditAvatarUpload}
                        className="hidden"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Profile Picture</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Click photo to change</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Username */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Username</label>
                      <div className="relative">
                        <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={editForm.username}
                          onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                        />
                      </div>
                    </div>

                    {/* Mail ID */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Mail ID</label>
                      <div className="relative">
                        <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                        />
                      </div>
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Phone Number</label>
                      <div className="relative">
                        <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="tel"
                          value={editForm.phone}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100 dark:border-gray-800">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSave}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/25 transition-all"
                >
                  <Save size={14} />
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
