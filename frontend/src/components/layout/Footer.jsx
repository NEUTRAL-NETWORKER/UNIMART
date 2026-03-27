import { Link } from 'react-router-dom';
import { ShoppingBag, Heart, Send, Mail, Youtube, Facebook, Twitter, Gitlab } from 'lucide-react';
import { CATEGORIES } from '../../constants';

export default function Footer() {
  const vglugSocialLinks = [
    { icon: Send, url: 'https://t.me/vpmglug', label: 'Telegram', color: 'hover:bg-sky-500 hover:text-white' },
    { icon: Mail, url: 'https://www.freelists.org/list/villupuramglug', label: 'Mailing List', color: 'hover:bg-amber-500 hover:text-white' },
    { icon: Youtube, url: 'https://www.youtube.com/channel/UCztecD7qSCgqcb59r0G3GHg', label: 'Youtube', color: 'hover:bg-red-600 hover:text-white' },
    { icon: Facebook, url: 'https://www.facebook.com/vpmglug/', label: 'Facebook', color: 'hover:bg-blue-600 hover:text-white' },
    { icon: Twitter, url: 'http://www.twitter.com/vpmglug', label: 'Twitter', color: 'hover:bg-cyan-500 hover:text-white' },
    { icon: Gitlab, url: 'https://gitlab.com/villupuramglug/', label: 'Gitlab', color: 'hover:bg-orange-500 hover:text-white' },
  ];

  return (
    <footer className="bg-gray-900 dark:bg-black text-gray-400 border-t border-gray-800">
      {/* Main Footer */}
      <div className="section-padding py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/home" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 gradient-bg rounded-xl flex items-center justify-center shadow-lg">
                <ShoppingBag size={20} className="text-white" />
              </div>
              <span className="text-xl font-bold text-white">UNIMART</span>
            </Link>
            <p className="text-sm leading-relaxed mb-6">
              The premier student-only marketplace. Buy and sell textbooks, electronics, and more with
              verified fellow students on campus.
            </p>
            <div className="flex flex-wrap gap-2">
              {vglugSocialLinks.map((social, i) => (
                <a
                  key={i}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  title={social.label}
                  className={`w-8 h-8 rounded-lg bg-gray-800 ${social.color} flex items-center justify-center transition-all hover:scale-110 text-gray-400`}
                >
                  <social.icon size={14} />
                </a>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-white font-semibold mb-4">Categories</h4>
            <ul className="space-y-2.5">
              {CATEGORIES.slice(0, 6).map((cat) => (
                <li key={cat.id}>
                  <Link
                    to={`/home?category=${cat.id}`}
                    className="text-sm hover:text-white transition-colors flex items-center gap-2"
                  >
                    <span>{cat.icon}</span>
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2.5">
              {[
                { to: '/sell', label: 'Sell a Product' },
                { to: '/orders', label: 'My Orders' },
                { to: '/dashboard', label: 'Dashboard' },
                { to: '/help', label: 'Help Center' },
                { to: '/about', label: 'About Us' },
                { to: '/terms', label: 'Terms of Service' },
              ].map((link, i) => (
                <li key={i}>
                  <Link
                    to={link.to}
                    className="text-sm hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-white font-semibold mb-4">Stay Updated</h4>
            <p className="text-sm mb-4">Get notified about new listings and campus deals.</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
              <button className="px-4 py-2.5 gradient-bg text-white text-sm font-semibold rounded-xl hover:shadow-lg transition-all">
                Join
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="section-padding py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-500">
            © 2026 UNIMART. All rights reserved.
          </p>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            Made with <Heart size={12} className="text-rose-500" /> for students everywhere
          </p>
        </div>
      </div>
    </footer>
  );
}
