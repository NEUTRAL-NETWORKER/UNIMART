import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Shield, AlertTriangle, Users, ShoppingBag, Lock, Scale, FileText, ChevronUp, Ban } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const sections = [
  {
    id: 'eligibility',
    icon: Users,
    title: '1. Eligibility & Account Registration',
    content: [
      'UNIMART is exclusively available to currently enrolled students of recognized educational institutions.',
      'You must register using a valid Student ID Number issued by your institution.',
      'You must provide accurate personal information including your full name, email, phone number, and campus.',
      'Each student may create only one account. Duplicate accounts will be suspended without notice.',
      'You are solely responsible for maintaining the confidentiality of your login credentials.',
      'UNIMART reserves the right to verify your student status at any time and suspend accounts that cannot be verified.',
    ],
  },
  {
    id: 'account',
    icon: Lock,
    title: '2. Account Responsibilities',
    content: [
      'You are responsible for all activity that occurs under your account.',
      'You must not share your account credentials with any other person.',
      'You must immediately notify UNIMART if you suspect unauthorized access to your account.',
      'UNIMART reserves the right to suspend or terminate accounts that violate these terms.',
      'Impersonating another student or providing false identity information is strictly prohibited and may result in permanent ban.',
    ],
  },
  {
    id: 'listing',
    icon: ShoppingBag,
    title: '3. Listing Policies',
    content: [
      'All products listed must be legal to sell and appropriate for a campus environment.',
      'Product descriptions must be accurate and honest. Misrepresenting item condition, features, or functionality is prohibited.',
      'Product images must accurately represent the item being sold. Stock images are not permitted.',
      'Sellers must set fair and reasonable prices. Price gouging or predatory pricing is not tolerated.',
      'Listings for services, rentals, or non-physical goods are not permitted unless explicitly allowed by UNIMART.',
      'UNIMART reserves the right to remove any listing that violates these policies without prior notice.',
    ],
  },
  {
    id: 'prohibited',
    icon: Ban,
    title: '4. Prohibited Items',
    content: [
      'The following categories of items are strictly prohibited from being listed or sold on UNIMART:',
    ],
    list: [
      'Cosmetics & Beauty Products — Skincare, makeup, perfumes, hair products, and personal care items',
      'Clothing & Apparel — T-shirts, jeans, shirts, dresses, jackets, ethnic wear, and all wearable garments',
      'Fashion Accessories — Watches, sunglasses, jewellery, handbags, wallets, belts, and fashion items',
      'Furniture — Desks, chairs, beds, shelves, tables, sofas, and any large household furniture',
      'Musical Instruments — Guitars, keyboards, drums, violins, flutes, and all musical equipment',
      'Food & Beverages — Any consumable food items, drinks, supplements, or perishable goods',
      'Medicines & Pharmaceuticals — Prescription drugs, over-the-counter medicines, and health supplements',
      'Weapons & Hazardous Materials — Knives, firearms, fireworks, chemicals, and any dangerous items',
      'Tobacco & Alcohol — Cigarettes, vapes, e-cigarettes, alcohol, and related products',
      'Counterfeit & Pirated Goods — Fake branded items, pirated software, copied CDs/DVDs, and knockoffs',
      'Stolen Property — Any item that has been illegally obtained or whose ownership cannot be verified',
      'Animals & Pets — Live animals, pet supplies, or any biological specimens',
      'Gift Cards & Vouchers — Pre-loaded cards, coupons, discount vouchers, or digital currency',
    ],
    footer: 'Listing any prohibited item will result in immediate removal of the listing and may lead to account suspension or permanent ban.',
  },
  {
    id: 'transactions',
    icon: Shield,
    title: '5. Transaction Safety & OTP Verification',
    content: [
      'All transactions on UNIMART are facilitated through our secure OTP verification system.',
      'Buyers will receive a unique One-Time Password (OTP) upon purchase confirmation.',
      'The OTP must be shared with the seller only at the time of physical delivery to confirm receipt.',
      'Sellers must verify the OTP before handing over the product. Delivery without OTP verification is at the seller\'s own risk.',
      'UNIMART strongly recommends meeting in public, well-lit areas on campus for all exchanges.',
      'Never share your OTP via chat, text, or phone before the physical meetup.',
      'Any attempt to manipulate or bypass the OTP system will result in immediate account termination.',
    ],
  },
  {
    id: 'privacy',
    icon: FileText,
    title: '6. Privacy & Data Usage',
    content: [
      'UNIMART collects and stores personal data solely for the purpose of providing and improving our services.',
      'Your email address and phone number are kept private and are never displayed publicly on listings.',
      'We do not sell, rent, or share your personal information with third-party marketers.',
      'Chat messages between buyers and sellers are stored securely and may be reviewed in case of disputes.',
      'By using UNIMART, you consent to the collection and processing of your data as described in our Privacy Policy.',
      'You may request deletion of your account and associated data by contacting our support team.',
    ],
  },
  {
    id: 'disputes',
    icon: Scale,
    title: '7. Dispute Resolution',
    content: [
      'In case of a dispute between buyer and seller, UNIMART will act as a neutral mediator.',
      'Both parties must provide evidence (screenshots, chat logs, photos) to support their claims.',
      'UNIMART\'s decision in dispute resolution is final and binding.',
      'Refunds, if applicable, will be processed within 7-14 business days.',
      'Repeated involvement in disputes may affect your account standing and trust score.',
      'UNIMART is not liable for any losses arising from transactions conducted outside our platform.',
    ],
  },
  {
    id: 'liability',
    icon: AlertTriangle,
    title: '8. Limitation of Liability',
    content: [
      'UNIMART serves as a facilitating platform and is not a party to any transaction between users.',
      'We do not guarantee the quality, safety, legality, or authenticity of any listed product.',
      'UNIMART is not responsible for any personal injury, property damage, or financial loss arising from user transactions.',
      'We do not provide insurance for items sold or purchased through the platform.',
      'Users engage in transactions at their own risk and are encouraged to exercise due diligence.',
      'UNIMART\'s total liability, if any, shall not exceed the amount of fees collected from the user in the preceding 12 months.',
    ],
  },
];

export default function TermsAndConditions() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="section-padding page-padding pb-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 gradient-bg rounded-2xl shadow-xl shadow-indigo-500/20 mb-6">
            <Shield size={32} className="text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            Terms & Conditions
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-3 max-w-lg mx-auto">
            Please read these terms carefully before using UNIMART. By creating an account, you agree to be bound by these terms.
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            Last updated: February 17, 2026
          </p>
        </div>

        {/* Table of Contents */}
        <div className="card p-5 mb-8">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Quick Navigation</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <section.icon size={14} />
                {section.title}
              </a>
            ))}
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {sections.map((section, idx) => (
            <motion.div
              key={section.id}
              id={section.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="card p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center flex-shrink-0">
                  <section.icon size={18} className="text-indigo-500" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{section.title}</h2>
              </div>
              <div className="space-y-3 pl-12">
                {section.content.map((paragraph, i) => (
                  <p key={i} className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
                {section.list && (
                  <ul className="space-y-2 mt-2">
                    {section.list.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span className="text-rose-500 mt-0.5 flex-shrink-0">✕</span>
                        <span><strong className="text-gray-700 dark:text-gray-300">{item.split(' — ')[0]}</strong>{item.includes(' — ') ? ` — ${item.split(' — ')[1]}` : ''}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {section.footer && (
                  <div className="mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800/30">
                    <p className="text-xs text-rose-700 dark:text-rose-300 font-medium">
                      ⚠ {section.footer}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Agreement Footer */}
        {!isAuthenticated && (
          <div className="mt-10 text-center">
            <div className="card p-6 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10 border-indigo-200 dark:border-indigo-800/30">
              <p className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">
                By using UNIMART, you acknowledge that you have read, understood, and agree to be bound by these Terms &amp; Conditions.
              </p>
              <div className="flex items-center justify-center gap-3 mt-4">
                <Link
                  to="/register"
                  className="px-6 py-2.5 gradient-bg text-white text-sm font-semibold rounded-xl hover:shadow-lg transition-all"
                >
                  Create Account
                </Link>
                <Link
                  to="/"
                  className="px-6 py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-semibold border border-gray-200 dark:border-gray-700 rounded-xl hover:border-indigo-300 transition-all"
                >
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Scroll to Top */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-8 right-8 w-12 h-12 gradient-bg text-white rounded-full shadow-xl shadow-indigo-500/30 flex items-center justify-center hover:scale-110 transition-transform z-50"
          >
            <ChevronUp size={20} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
