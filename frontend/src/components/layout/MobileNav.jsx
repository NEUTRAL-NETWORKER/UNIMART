import { Link, useLocation } from 'react-router-dom';
import { Home, Search, PlusCircle, Package, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function MobileNav() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) return null;

  const links = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/?search=true', icon: Search, label: 'Search' },
    { to: '/sell', icon: PlusCircle, label: 'Sell' },
    { to: '/orders', icon: Package, label: 'Orders' },
    { to: '/dashboard', icon: User, label: 'Profile' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 safe-area-bottom">
      <div className="flex items-center justify-around py-2">
        {links.map((link) => {
          const isActive = location.pathname === link.to || (link.to === '/' && location.pathname === '/');
          return (
            <Link
              key={link.label}
              to={link.to}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200
                ${isActive
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
            >
              <link.icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
