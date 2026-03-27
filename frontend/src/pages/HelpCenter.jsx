import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ChevronDown, ChevronUp, HelpCircle, MessageCircle, Shield, Package, CreditCard, AlertCircle } from 'lucide-react';

const faqs = [
  {
    category: 'Getting Started',
    icon: HelpCircle,
    questions: [
      {
        q: 'How do I create an account?',
        a: 'Click the Register button and enter your Student ID, username, campus, and password. Your Student ID is required for verification.',
      },
      {
        q: 'Who can use UNIMART?',
        a: 'UNIMART is exclusively for verified university students. You must have a valid Student ID to register and use the platform.',
      },
      {
        q: 'Is it free to use?',
        a: 'Yes! UNIMART is completely free for all students. There are no listing fees or commission charges.',
      },
    ],
  },
  {
    category: 'Buying & Selling',
    icon: Package,
    questions: [
      {
        q: 'How do I list a product?',
        a: 'Navigate to "Sell" from the navigation menu. Fill in the product details including title, description, price, category, condition, and upload photos.',
      },
      {
        q: 'How do I buy a product?',
        a: 'Browse products, click on one you like, and click "Place Order". This sends a request to the seller and unlocks private chat.',
      },
      {
        q: 'Can I negotiate prices?',
        a: 'Yes! After placing an order, you can chat with the seller to negotiate prices and arrange delivery details.',
      },
    ],
  },
  {
    category: 'Delivery & OTP',
    icon: Shield,
    questions: [
      {
        q: 'What is the OTP system?',
        a: 'The OTP (One-Time Password) system ensures secure delivery. After the seller confirms an order, the seller generates a 6-digit OTP and sends it to the buyer\'s email. During meetup, the buyer shares that code with the seller to complete delivery.',
      },
      {
        q: 'How does delivery work?',
        a: 'UNIMART facilitates peer-to-peer delivery. After placing an order, use the chat to arrange a meeting time and place on campus.',
      },
      {
        q: 'What happens after OTP verification?',
        a: 'Once the seller enters the correct OTP, the product is marked as SOLD and moved to the sell history. The transaction is complete!',
      },
    ],
  },
  {
    category: 'Privacy & Safety',
    icon: Shield,
    questions: [
      {
        q: 'Is my personal information safe?',
        a: 'Absolutely. UNIMART never displays your email, phone number, or full name. Only your username and campus are visible to other users.',
      },
      {
        q: 'Can anyone message me?',
        a: 'No. Chat is only available after an order has been placed. There is no unsolicited messaging on UNIMART.',
      },
      {
        q: 'How do I report a problem?',
        a: 'Contact our support team through this Help Center. We take all reports seriously and respond within 24 hours.',
      },
    ],
  },
];

function FAQItem({ question }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <span className="text-sm font-medium text-gray-900 dark:text-white">{question.q}</span>
        {open ? (
          <ChevronUp size={18} className="text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronDown size={18} className="text-gray-400 flex-shrink-0" />
        )}
      </button>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="px-5 pb-4"
        >
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{question.a}</p>
        </motion.div>
      )}
    </div>
  );
}

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFaqs = faqs.map((section) => ({
    ...section,
    questions: section.questions.filter(
      (q) =>
        q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.a.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((section) => section.questions.length > 0);

  return (
    <div className="section-padding page-padding">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 mx-auto gradient-bg rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/20 mb-4">
            <HelpCircle size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Help Center</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Find answers to common questions about UNIMART
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search for help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-11 !py-4 text-base"
          />
        </div>

        {/* FAQ Sections */}
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-gray-500 dark:text-gray-400">No results found. Try a different search.</p>
          </div>
        ) : (
          filteredFaqs.map((section, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <section.icon size={18} className="text-indigo-500" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{section.category}</h2>
              </div>
              <div className="space-y-2">
                {section.questions.map((q, j) => (
                  <FAQItem key={j} question={q} />
                ))}
              </div>
            </motion.div>
          ))
        )}

        {/* Contact Card */}
        <div className="card p-6 text-center bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10 border-indigo-200 dark:border-indigo-800/30">
          <MessageCircle size={28} className="mx-auto text-indigo-500 mb-3" />
          <h3 className="font-bold text-gray-900 dark:text-white">Still need help?</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-1">
            Our support team is available 24/7 to assist you.
          </p>
          <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium mb-4">
            VGLUG Foundation Support: <a href="mailto:villupuramglug@gmail.com" className="underline hover:text-indigo-800 dark:hover:text-indigo-300">villupuramglug@gmail.com</a>
          </p>
          <a href="mailto:villupuramglug@gmail.com" className="btn-primary text-sm inline-block">
            Contact Support
          </a>
        </div>
      </motion.div>
    </div>
  );
}
