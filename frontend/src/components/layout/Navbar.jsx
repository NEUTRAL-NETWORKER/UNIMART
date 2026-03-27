import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Menu,
  X,
  ShoppingBag,
  Plus,
  Home,
  User,
  Package,
  ShoppingCart,
  History,
  HelpCircle,
  LogOut,
  Sun,
  Moon,
  ChevronDown,
  BadgeCheck,
  Tag,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { getInitials } from "../../utils/helpers";
import NotificationBell from "../common/NotificationBell";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setShowMobileMenu(false);
    setShowDropdown(false);
  }, [location.pathname]);

  // Auto-open mobile search if search param is present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("search") === "true" && window.innerWidth < 768) {
      setShowMobileMenu(true);
      // Short delay to allow animation/render
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 300);
    }
  }, [location.search]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/home?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navLinks = [
    { to: "/home", label: "Browse", icon: ShoppingBag },
    { to: "/sell", label: "Sell", icon: Plus },
    { to: "/orders", label: "Orders", icon: Package },
  ];

  const dropdownItems = [
    { label: "My Profile", icon: User, action: () => navigate("/dashboard") },
    {
      label: "My Products",
      icon: Tag,
      action: () => navigate("/dashboard?tab=products"),
    },
    { label: "My Orders", icon: Package, action: () => navigate("/orders") },
    {
      label: "Buy History",
      icon: ShoppingCart,
      action: () => navigate("/dashboard?tab=buy"),
    },
    {
      label: "Sell History",
      icon: History,
      action: () => navigate("/dashboard?tab=sell"),
    },
    { label: "Help Center", icon: HelpCircle, action: () => navigate("/help") },
  ];

  const isLinkActive = (link) => {
    if (link.exact) return location.pathname === link.to && !location.search;
    if (link.to.includes("?"))
      return location.pathname + location.search === link.to;
    return location.pathname === link.to;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 glass border-b border-white/10 dark:border-gray-800/50">
      <div className="section-padding">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/home" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-9 h-9 gradient-bg rounded-xl flex items-center justify-center shadow-lg">
              <ShoppingBag size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold gradient-text hidden sm:block">
              UNIMART
            </span>
          </Link>

          {/* Search Bar - Desktop */}
          {isAuthenticated && (
            <form
              onSubmit={handleSearch}
              className="hidden md:flex flex-1 max-w-md mx-6"
            >
              <div className="relative w-full">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                />
              </div>
            </form>
          )}

          {/* Right Side */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                {/* Nav Links - Desktop */}
                <div className="hidden md:flex items-center gap-1">
                  {navLinks.map((link) => (
                    <Link
                      key={link.label}
                      to={link.to}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300
                        ${
                          isLinkActive(link)
                            ? "gradient-bg text-white shadow-md"
                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                        }`}
                    >
                      <link.icon size={16} />
                      {link.label}
                    </Link>
                  ))}
                </div>

                {/* Notification Bell */}
                <NotificationBell />

                {/* Mobile Search Toggle */}
                <button
                  onClick={() => {
                    setShowMobileMenu(!showMobileMenu);
                    if (!showMobileMenu) {
                      setTimeout(() => searchInputRef.current?.focus(), 300);
                    }
                  }}
                  className="md:hidden p-2 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                >
                  <Search size={22} />
                </button>

                {/* Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                  >
                    <div className="w-8 h-8 gradient-bg rounded-lg flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                      {user?.profilePictureUrl ? (
                        <img
                          src={user.profilePictureUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        getInitials(user?.username || "U")
                      )}
                    </div>
                    <span className="hidden lg:flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                      {user?.username}
                      {user?.verified && (
                        <BadgeCheck size={16} className="text-blue-500" />
                      )}
                    </span>
                    <ChevronDown
                      size={14}
                      className={`hidden lg:block text-gray-400 transition-transform duration-200 ${showDropdown ? "rotate-180" : ""}`}
                    />
                  </button>

                  <AnimatePresence>
                    {showDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden"
                      >
                        {/* Profile Header */}
                        <div className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-b border-gray-100 dark:border-gray-700">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                              {user?.username}
                            </p>
                            {user?.verified && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded-full">
                                <BadgeCheck size={12} />
                                Verified
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {user?.campus}
                          </p>
                          <p className="text-xs text-indigo-600 dark:text-indigo-400 font-mono mt-1">
                            {user?.studentId}
                          </p>
                        </div>

                        {/* Menu Items */}
                        <div className="py-2">
                          {dropdownItems.map((item, index) => (
                            <button
                              key={index}
                              onClick={() => {
                                setShowDropdown(false);
                                item.action();
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                              <item.icon size={16} className="text-gray-400" />
                              {item.label}
                            </button>
                          ))}
                        </div>

                        {/* Theme Toggle */}
                        <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700">
                          <button
                            onClick={toggleTheme}
                            className="w-full flex items-center gap-3 px-0 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                          >
                            {darkMode ? (
                              <Sun size={16} className="text-amber-500" />
                            ) : (
                              <Moon size={16} className="text-indigo-500" />
                            )}
                            {darkMode ? "Light Mode" : "Dark Mode"}
                          </button>
                        </div>

                        {/* Logout */}
                        <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-0 py-2 text-sm text-rose-600 dark:text-rose-400 hover:text-rose-700 transition-colors"
                          >
                            <LogOut size={16} />
                            Logout
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Mobile Menu Toggle */}
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="md:hidden p-2 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                >
                  {showMobileMenu ? <X size={22} /> : <Menu size={22} />}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                >
                  {darkMode ? (
                    <Sun size={20} className="text-amber-500" />
                  ) : (
                    <Moon size={20} className="text-indigo-500" />
                  )}
                </button>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn-primary text-sm !py-2 !px-5"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {showMobileMenu && isAuthenticated && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden border-t border-gray-100 dark:border-gray-800"
            >
              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="p-3">
                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
                  />
                </div>
              </form>

              {/* Mobile Nav Links */}
              <div className="px-3 pb-3 space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    to={link.to}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                      ${
                        isLinkActive(link)
                          ? "gradient-bg text-white"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                  >
                    <link.icon size={18} />
                    {link.label}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
