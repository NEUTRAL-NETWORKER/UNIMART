// Mock data constants for UNIMART

export const CATEGORIES = [
  { id: 'textbooks',           name: 'Textbooks',               icon: '📚', color: 'indigo'  },
  { id: 'notes',               name: 'Notes & Study Material',   icon: '📝', color: 'purple'  },
  { id: 'electronics',         name: 'Electronics & Gadgets',    icon: '💻', color: 'cyan'    },
  { id: 'lab_equipment',       name: 'Lab Coats & Equipment',    icon: '🥼', color: 'teal'    },
  { id: 'stationery',          name: 'Stationery & Supplies',    icon: '✏️', color: 'amber'   },
  { id: 'drafting',            name: 'Drafting & Drawing Tools', icon: '📐', color: 'blue'    },
  { id: 'calculators',         name: 'Calculators & Instruments',icon: '🔢', color: 'slate'   },
  { id: 'sports',              name: 'Sports Equipment',         icon: '⚽', color: 'emerald' },
  { id: 'bicycles',            name: 'Bicycles & Transport',     icon: '🚲', color: 'lime'    },
  { id: 'room_essentials',     name: 'Room & Hostel Essentials', icon: '🛏️', color: 'orange'  },
  { id: 'clothing',            name: 'Clothing & Uniforms',      icon: '👕', color: 'rose'    },
  { id: 'musical_instruments', name: 'Musical Instruments',      icon: '🎸', color: 'fuchsia' },
  { id: 'other',               name: 'Other',                    icon: '📦', color: 'gray'    },
];

export const CAMPUSES = [
  // Top Institutes
  'IIT Madras',
  'NIT Tiruchirappalli',
  'Anna University, Chennai',
  'Madras University',
  'Bharathiar University, Coimbatore',
  'Bharathidasan University, Tiruchirappalli',
  // Private Universities
  'VIT, Vellore',
  'SRM Institute of Science and Technology, Chennai',
  'SASTRA Deemed University, Thanjavur',
  'Amrita Vishwa Vidyapeetham, Coimbatore',
  'Vel Tech Rangarajan Dr. Sagunthala R&D Institute, Chennai',
  'Hindustan Institute of Technology and Science, Chennai',
  'Kalasalingam Academy of Research and Education, Srivilliputhur',
  'Shanmugha Arts Science Technology & Research Academy (SASTRA), Thanjavur',
  // Engineering Colleges
  'PSG College of Technology, Coimbatore',
  'College of Engineering, Guindy (CEG), Chennai',
  'Thiagarajar College of Engineering, Madurai',
  'Government College of Technology, Coimbatore',
  'Kongu Engineering College, Erode',
  'Mepco Schlenk Engineering College, Sivakasi',
  'Sri Sivasubramaniya Nadar College of Engineering, Kalavakkam',
  'Kumaraguru College of Technology, Coimbatore',
  'Sri Venkateswara College of Engineering, Sriperumbudur',
  'Rajalakshmi Engineering College, Chennai',
  'St. Joseph\'s College of Engineering, Chennai',
  'RMK Engineering College, Chennai',
  'Sathyabama Institute of Science and Technology, Chennai',
  'Saveetha Engineering College, Chennai',
  // Arts & Science Colleges
  'Loyola College, Chennai',
  'Madras Christian College, Chennai',
  'Presidency College, Chennai',
  'PSG College of Arts & Science, Coimbatore',
  'The American College, Madurai',
  'Bishop Heber College, Tiruchirappalli',
  'St. Xavier\'s College, Palayamkottai',
  'Ethiraj College for Women, Chennai',
  // Medical Colleges
  'Madras Medical College, Chennai',
  'Stanley Medical College, Chennai',
  'Kilpauk Medical College, Chennai',
  'Government Medical College, Coimbatore',
  // Law Colleges
  'Dr. Ambedkar Government Law College, Chennai',
  'School of Excellence in Law, Chennai',
];

export const STUDENT_REGISTRY = {};

// Helper to mask email: "alex.doe@gmail.com" -> "ale***oe@gmail.com"
export const maskEmail = (email) => {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  const visiblePrefix = local.slice(0, 3);
  const visibleSuffix = local.length > 3 ? local.slice(-2) : '';
  return visiblePrefix + '***' + visibleSuffix + '@' + domain;
};

export const ORDER_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

export const ORDER_STATUS_LABELS = {
  PENDING: { label: 'Pending', color: 'amber' },
  CONFIRMED: { label: 'Confirmed', color: 'cyan' },
  COMPLETED: { label: 'Delivered', color: 'emerald' },
  CANCELLED: { label: 'Cancelled', color: 'rose' },
};

export const MOCK_USER = null;

export const MOCK_PRODUCTS = [];

export const MOCK_ORDERS = [];

export const MOCK_MESSAGES = [];


export const CONDITION_OPTIONS = ['New', 'Like New', 'Excellent', 'Good', 'Acceptable'];

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
];
