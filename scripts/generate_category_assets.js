const fs = require('fs');
const path = require('path');

const targetDir = path.resolve(__dirname, '../client/public/assets/categories');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// 20 Categories with beautiful tailored SVG representations
const categories = [
  {
    slug: 'paan-corner',
    title: 'Paan Corner',
    bg: '#ECFDF5',
    accent: '#059669',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
      <rect width="100" height="100" rx="24" fill="#ECFDF5"/>
      <path d="M50 20 C32 30 25 50 28 68 C30 78 40 82 50 82 C60 82 70 78 72 68 C75 50 68 30 50 20 Z" fill="#10B981" stroke="#047857" stroke-width="2.5"/>
      <path d="M50 25 L50 80" stroke="#065F46" stroke-width="2" stroke-linecap="round"/>
      <path d="M50 40 Q40 48 34 52" stroke="#065F46" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M50 40 Q60 48 66 52" stroke="#065F46" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M50 56 Q38 62 35 68" stroke="#065F46" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M50 56 Q62 62 65 68" stroke="#065F46" stroke-width="1.8" stroke-linecap="round"/>
      <circle cx="50" cy="58" r="7" fill="#DC2626"/>
      <circle cx="47" cy="55" r="3.5" fill="#FBBF24"/>
      <circle cx="53" cy="55" r="3" fill="#F87171"/>
      <circle cx="50" cy="62" r="2.5" fill="#FDE047"/>
    </svg>`
  },
  {
    slug: 'dairy-bread-eggs',
    title: 'Dairy, Bread & Eggs',
    bg: '#FEF3C7',
    accent: '#D97706',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
      <rect width="100" height="100" rx="24" fill="#FEF3C7"/>
      <!-- Milk Bottle -->
      <path d="M30 35 L30 30 Q30 28 35 28 L41 28 Q46 28 46 30 L46 35 C46 38 49 42 50 45 L50 74 Q50 78 46 78 L30 78 Q26 78 26 74 L26 45 C27 42 30 38 30 35 Z" fill="#FFFFFF" stroke="#D97706" stroke-width="2.5"/>
      <rect x="32" y="24" width="12" height="4" rx="2" fill="#3B82F6"/>
      <rect x="29" y="52" width="18" height="14" rx="2" fill="#60A5FA"/>
      <circle cx="38" cy="59" r="3.5" fill="#FFFFFF"/>
      <!-- Bread Slice -->
      <path d="M52 46 C52 40 60 38 66 38 C72 38 80 40 80 46 L80 72 Q80 76 76 76 L56 76 Q52 76 52 72 Z" fill="#FDE68A" stroke="#B45309" stroke-width="2.5"/>
      <path d="M56 50 C56 46 62 44 66 44 C70 44 76 46 76 50 L76 70 Q76 72 73 72 L59 72 Q56 72 56 70 Z" fill="#FEF3C7"/>
      <!-- Egg -->
      <path d="M68 62 C63 62 60 67 60 73 C60 78 64 82 68 82 C72 82 76 78 76 73 C76 67 73 62 68 62 Z" fill="#FFFFFF" stroke="#D97706" stroke-width="2"/>
    </svg>`
  },
  {
    slug: 'fruits-vegetables',
    title: 'Fruits & Vegetables',
    bg: '#DCFCE7',
    accent: '#16A34A',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
      <rect width="100" height="100" rx="24" fill="#DCFCE7"/>
      <!-- Apple -->
      <circle cx="40" cy="58" r="18" fill="#EF4444"/>
      <path d="M40 40 C40 34 45 30 46 26" stroke="#78350F" stroke-width="3" stroke-linecap="round"/>
      <path d="M44 32 Q54 28 54 36 Q46 38 44 32 Z" fill="#22C55E"/>
      <!-- Carrot -->
      <path d="M72 32 L48 76 Q46 79 43 76 L40 73 Q37 70 40 68 L64 36 Z" fill="#F97316"/>
      <path d="M68 32 C72 26 78 22 84 20 M68 32 C74 28 80 30 84 28 M68 32 C70 24 74 18 78 16" stroke="#15803D" stroke-width="2.5" stroke-linecap="round"/>
      <!-- Leaves -->
      <circle cx="68" cy="65" r="15" fill="#22C55E" opacity="0.85"/>
      <path d="M64 54 Q68 76 74 74" stroke="#15803D" stroke-width="2"/>
    </svg>`
  },
  {
    slug: 'cold-drinks-juices',
    title: 'Cold Drinks & Juices',
    bg: '#E0F2FE',
    accent: '#0284C7',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
      <rect width="100" height="100" rx="24" fill="#E0F2FE"/>
      <!-- Soda Can -->
      <rect x="25" y="36" width="22" height="42" rx="4" fill="#DC2626" stroke="#991B1B" stroke-width="2"/>
      <ellipse cx="36" cy="36" rx="11" ry="3.5" fill="#E5E7EB" stroke="#991B1B" stroke-width="1.5"/>
      <ellipse cx="36" cy="78" rx="11" ry="3.5" fill="#991B1B"/>
      <path d="M28 50 Q36 54 44 50" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
      <!-- Juice Glass with Straw -->
      <path d="M54 38 L58 76 Q59 80 68 80 Q77 80 78 76 L82 38 Z" fill="#F59E0B" stroke="#D97706" stroke-width="2"/>
      <line x1="68" y1="20" x2="62" y2="46" stroke="#EF4444" stroke-width="3" stroke-linecap="round"/>
      <circle cx="66" cy="52" r="3" fill="#FDE68A" opacity="0.7"/>
      <circle cx="72" cy="62" r="2.5" fill="#FDE68A" opacity="0.7"/>
      <circle cx="62" cy="68" r="2" fill="#FDE68A" opacity="0.7"/>
    </svg>`
  },
  {
    slug: 'snacks-munchies',
    title: 'Snacks & Munchies',
    bg: '#FFEDD5',
    accent: '#EA580C',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
      <rect width="100" height="100" rx="24" fill="#FFEDD5"/>
      <!-- Chips Bag -->
      <path d="M28 30 L48 30 L44 76 L24 76 Z" fill="#EA580C" stroke="#C2410C" stroke-width="2.5"/>
      <polygon points="28,30 38,24 48,30" fill="#F97316"/>
      <rect x="27" y="46" width="18" height="12" rx="2" fill="#FEF08A"/>
      <path d="M29 52 Q36 55 43 52" stroke="#EA580C" stroke-width="2"/>
      <!-- Triangle Nacho Chip -->
      <polygon points="62,38 82,72 50,68" fill="#FBBF24" stroke="#D97706" stroke-width="2.5" stroke-linejoin="round"/>
      <circle cx="64" cy="56" r="1.5" fill="#D97706"/>
      <circle cx="70" cy="62" r="1.5" fill="#D97706"/>
      <circle cx="58" cy="60" r="1.5" fill="#D97706"/>
    </svg>`
  },
  {
    slug: 'breakfast-instant-food',
    title: 'Breakfast & Instant Food',
    bg: '#FEF9C3',
    accent: '#CA8A04',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
      <rect width="100" height="100" rx="24" fill="#FEF9C3"/>
      <!-- Cereal / Noodle Bowl -->
      <ellipse cx="50" cy="54" rx="30" ry="12" fill="#EAB308" stroke="#CA8A04" stroke-width="2"/>
      <path d="M20 54 C20 74 34 82 50 82 C66 82 80 74 80 54 Z" fill="#3B82F6" stroke="#1D4ED8" stroke-width="2.5"/>
      <!-- Steam / Noodles -->
      <path d="M38 44 Q44 34 40 26 M50 44 Q56 34 52 26 M62 44 Q68 34 64 26" stroke="#F59E0B" stroke-width="2.5" stroke-linecap="round"/>
      <ellipse cx="50" cy="54" rx="22" ry="8" fill="#FEF08A"/>
      <circle cx="45" cy="54" r="3" fill="#10B981"/>
      <circle cx="55" cy="52" r="3.5" fill="#EF4444"/>
    </svg>`
  },
  {
    slug: 'sweet-tooth',
    title: 'Sweet Tooth',
    bg: '#FCE7F3',
    accent: '#DB2777',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
      <rect width="100" height="100" rx="24" fill="#FCE7F3"/>
      <!-- Cupcake / Pastry -->
      <path d="M34 56 L38 80 L62 80 L66 56 Z" fill="#D97706" stroke="#92400E" stroke-width="2"/>
      <path d="M28 56 C26 44 40 40 44 44 C46 36 56 34 60 40 C66 38 74 46 72 56 Z" fill="#F472B6" stroke="#DB2777" stroke-width="2.5"/>
      <circle cx="50" cy="34" r="5" fill="#EF4444"/>
      <!-- Chocolate Bar -->
      <rect x="58" y="22" width="22" height="32" rx="3" fill="#78350F" transform="rotate(15 58 22)"/>
      <rect x="62" y="26" width="6" height="8" fill="#92400E" transform="rotate(15 58 22)"/>
    </svg>`
  },
  {
    slug: 'bakery-biscuits',
    title: 'Bakery & Biscuits',
    bg: '#FFF7ED',
    accent: '#EA580C',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
      <rect width="100" height="100" rx="24" fill="#FFF7ED"/>
      <!-- Croissant -->
      <path d="M24 64 C24 44 44 32 64 36 C74 38 80 46 76 56 C72 64 64 66 56 64 C48 62 42 66 36 70 C30 74 24 72 24 64 Z" fill="#F59E0B" stroke="#B45309" stroke-width="2.5"/>
      <!-- Biscuit / Cookie -->
      <circle cx="66" cy="66" r="16" fill="#D97706" stroke="#92400E" stroke-width="2"/>
      <circle cx="60" cy="62" r="2" fill="#78350F"/>
      <circle cx="68" cy="60" r="2" fill="#78350F"/>
      <circle cx="72" cy="68" r="2" fill="#78350F"/>
      <circle cx="62" cy="70" r="2" fill="#78350F"/>
    </svg>`
  },
  {
    slug: 'tea-coffee-milk-drinks',
    title: 'Tea, Coffee & Milk Drinks',
    bg: '#FEF3C7',
    accent: '#B45309',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
      <rect width="100" height="100" rx="24" fill="#FEF3C7"/>
      <!-- Hot Tea Cup -->
      <path d="M26 44 L30 74 Q31 78 40 78 L56 78 Q65 78 66 74 L70 44 Z" fill="#92400E" stroke="#78350F" stroke-width="2.5"/>
      <!-- Handle -->
      <path d="M68 50 C76 50 78 64 67 66" stroke="#78350F" stroke-width="3" stroke-linecap="round" fill="none"/>
      <!-- Saucer -->
      <ellipse cx="48" cy="82" rx="28" ry="4" fill="#F59E0B" stroke="#B45309" stroke-width="2"/>
      <!-- Steam -->
      <path d="M38 34 Q42 26 38 18 M48 34 Q52 26 48 18 M58 34 Q62 26 58 18" stroke="#D97706" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`
  },
  {
    slug: 'atta-rice-dal',
    title: 'Atta, Rice & Dal',
    bg: '#FFFBEB',
    accent: '#D97706',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
      <rect width="100" height="100" rx="24" fill="#FFFBEB"/>
      <!-- Wheat Ear / Grain Sack -->
      <path d="M28 40 L72 40 L68 80 L32 80 Z" fill="#FDE68A" stroke="#B45309" stroke-width="2.5"/>
      <ellipse cx="50" cy="40" rx="22" ry="6" fill="#FCD34D" stroke="#B45309" stroke-width="2"/>
      <!-- Wheat stalk in center -->
      <path d="M50 48 L50 72" stroke="#B45309" stroke-width="2.5"/>
      <ellipse cx="45" cy="54" rx="4" ry="2" fill="#F59E0B" transform="rotate(-30 45 54)"/>
      <ellipse cx="55" cy="54" rx="4" ry="2" fill="#F59E0B" transform="rotate(30 55 54)"/>
      <ellipse cx="45" cy="62" rx="4" ry="2" fill="#F59E0B" transform="rotate(-30 45 62)"/>
      <ellipse cx="55" cy="62" rx="4" ry="2" fill="#F59E0B" transform="rotate(30 55 62)"/>
    </svg>`
  },
  {
    slug: 'masala-oil-more',
    title: 'Masala, Oil & More',
    bg: '#FEF2F2',
    accent: '#DC2626',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
      <rect width="100" height="100" rx="24" fill="#FEF2F2"/>
      <!-- Oil Bottle -->
      <path d="M30 36 L30 30 L40 30 L40 36 L46 44 L46 76 L24 76 L24 44 Z" fill="#FBBF24" stroke="#D97706" stroke-width="2.5"/>
      <rect x="32" y="24" width="6" height="6" fill="#DC2626"/>
      <!-- Red Chilli -->
      <path d="M56 36 Q74 46 66 74 Q58 64 54 44 Z" fill="#EF4444" stroke="#B91C1C" stroke-width="2"/>
      <path d="M56 36 C56 32 60 28 62 26" stroke="#15803D" stroke-width="2.5" stroke-linecap="round"/>
      <!-- Turmeric / Spice Bowl -->
      <ellipse cx="72" cy="70" rx="14" ry="7" fill="#EAB308" stroke="#CA8A04" stroke-width="2"/>
    </svg>`
  },
  {
    slug: 'sauces-spreads',
    title: 'Sauces & Spreads',
    bg: '#FDF2F8',
    accent: '#BE185D',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
      <rect width="100" height="100" rx="24" fill="#FDF2F8"/>
      <!-- Ketchup Bottle -->
      <path d="M32 34 L32 28 L40 28 L40 34 L45 42 L45 78 L27 78 L27 42 Z" fill="#EF4444" stroke="#B91C1C" stroke-width="2"/>
      <rect x="33" y="24" width="6" height="4" fill="#FFFFFF"/>
      <rect x="29" y="52" width="14" height="14" rx="2" fill="#FFFFFF"/>
      <circle cx="36" cy="59" r="4" fill="#EF4444"/>
      <!-- Jam Jar -->
      <rect x="52" y="44" width="24" height="34" rx="4" fill="#831843" stroke="#500724" stroke-width="2"/>
      <rect x="50" y="38" width="28" height="6" rx="2" fill="#F472B6"/>
      <rect x="56" y="52" width="16" height="16" rx="2" fill="#FCE7F3"/>
    </svg>`
  },
  {
    slug: 'chicken-meat-fish',
    title: 'Chicken, Meat & Fish',
    bg: '#FFF1F2',
    accent: '#E11D48',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
      <rect width="100" height="100" rx="24" fill="#FFF1F2"/>
      <!-- Chicken Leg -->
      <path d="M56 34 C68 34 76 44 74 56 C72 66 60 70 52 64 L40 76 L34 70 L46 58 C42 50 44 34 56 34 Z" fill="#F59E0B" stroke="#B45309" stroke-width="2.5"/>
      <circle cx="30" cy="76" r="4" fill="#FFFFFF" stroke="#B45309" stroke-width="2"/>
      <circle cx="36" cy="82" r="4" fill="#FFFFFF" stroke="#B45309" stroke-width="2"/>
      <!-- Fish -->
      <path d="M22 38 Q36 26 50 38 Q36 50 22 38 Z" fill="#38BDF8" stroke="#0284C7" stroke-width="2"/>
      <polygon points="22,38 14,30 14,46" fill="#38BDF8" stroke="#0284C7" stroke-width="2"/>
      <circle cx="44" cy="36" r="1.5" fill="#0369A1"/>
    </svg>`
  },
  {
    slug: 'organic-healthy-living',
    title: 'Organic & Healthy Living',
    bg: '#F0FDF4',
    accent: '#15803D',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
      <rect width="100" height="100" rx="24" fill="#F0FDF4"/>
      <!-- Organic Green Leaf Badge -->
      <circle cx="50" cy="50" r="32" fill="#22C55E" opacity="0.2"/>
      <circle cx="50" cy="50" r="26" fill="#15803D"/>
      <path d="M50 30 C40 38 34 50 38 64 C48 64 62 58 66 44 C66 36 60 30 50 30 Z" fill="#86EFAC"/>
      <path d="M42 58 Q50 44 58 38" stroke="#15803D" stroke-width="2" stroke-linecap="round"/>
      <path d="M48 48 Q54 44 56 42" stroke="#15803D" stroke-width="1.8"/>
    </svg>`
  },
  {
    slug: 'baby-care',
    title: 'Baby Care',
    bg: '#EFF6FF',
    accent: '#2563EB',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
      <rect width="100" height="100" rx="24" fill="#EFF6FF"/>
      <!-- Feeding Bottle -->
      <rect x="36" y="44" width="28" height="36" rx="6" fill="#93C5FD" stroke="#1D4ED8" stroke-width="2.5"/>
      <rect x="38" y="36" width="24" height="8" rx="2" fill="#F472B6"/>
      <path d="M44 36 L44 26 Q50 22 56 26 L56 36 Z" fill="#FDE047" stroke="#CA8A04" stroke-width="2"/>
      <line x1="42" y1="52" x2="48" y2="52" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
      <line x1="42" y1="60" x2="52" y2="60" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
      <line x1="42" y1="68" x2="48" y2="68" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
    </svg>`
  },
  {
    slug: 'pharma-wellness',
    title: 'Pharma & Wellness',
    bg: '#FEF2F2',
    accent: '#E11D48',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
      <rect width="100" height="100" rx="24" fill="#FEF2F2"/>
      <!-- Red Cross First Aid Box -->
      <rect x="22" y="34" width="56" height="46" rx="8" fill="#FFFFFF" stroke="#E11D48" stroke-width="3"/>
      <path d="M38 34 L38 28 Q38 24 44 24 L56 24 Q62 24 62 28 L62 34" stroke="#E11D48" stroke-width="3" fill="none"/>
      <!-- Plus Symbol -->
      <rect x="44" y="44" width="12" height="26" rx="2" fill="#E11D48"/>
      <rect x="37" y="51" width="26" height="12" rx="2" fill="#E11D48"/>
    </svg>`
  },
  {
    slug: 'cleaning-essentials',
    title: 'Cleaning Essentials',
    bg: '#F0FDFA',
    accent: '#0D9488',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
      <rect width="100" height="100" rx="24" fill="#F0FDFA"/>
      <!-- Spray Bottle -->
      <path d="M40 46 L40 78 Q40 82 46 82 L62 82 Q68 82 68 78 L68 46 Z" fill="#2DD4BF" stroke="#0F766E" stroke-width="2.5"/>
      <path d="M48 46 L48 34 L60 34 L60 46 Z" fill="#0D9488"/>
      <!-- Trigger -->
      <path d="M42 34 L30 38 L30 46 L44 42" fill="#14B8A6" stroke="#0F766E" stroke-width="2"/>
      <rect x="52" y="26" width="18" height="8" rx="2" fill="#0F766E"/>
      <!-- Bubbles -->
      <circle cx="28" cy="24" r="4" fill="#5EEAD4" opacity="0.8"/>
      <circle cx="36" cy="18" r="3" fill="#5EEAD4" opacity="0.8"/>
    </svg>`
  },
  {
    slug: 'home-office',
    title: 'Home & Office',
    bg: '#F8FAFC',
    accent: '#475569',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
      <rect width="100" height="100" rx="24" fill="#F8FAFC"/>
      <!-- Notebook -->
      <rect x="24" y="26" width="38" height="52" rx="4" fill="#3B82F6" stroke="#1D4ED8" stroke-width="2.5"/>
      <rect x="28" y="26" width="6" height="52" fill="#1E40AF"/>
      <line x1="40" y1="38" x2="54" y2="38" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="46" x2="54" y2="46" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="54" x2="48" y2="54" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
      <!-- Pen -->
      <path d="M68 28 L76 36 L54 78 L46 76 Z" fill="#F59E0B" stroke="#B45309" stroke-width="2"/>
      <polygon points="46,76 54,78 48,84" fill="#1E293B"/>
    </svg>`
  },
  {
    slug: 'personal-care',
    title: 'Personal Care',
    bg: '#FAF5FF',
    accent: '#9333EA',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
      <rect width="100" height="100" rx="24" fill="#FAF5FF"/>
      <!-- Shampoo / Lotion Pump Bottle -->
      <rect x="36" y="42" width="28" height="42" rx="8" fill="#C084FC" stroke="#7E22CE" stroke-width="2.5"/>
      <rect x="46" y="32" width="8" height="10" fill="#7E22CE"/>
      <path d="M40 32 L60 32 L60 26 L36 26 Z" fill="#6B21A8"/>
      <!-- Soap Bar -->
      <rect x="24" y="60" width="26" height="18" rx="6" fill="#F3E8FF" stroke="#9333EA" stroke-width="2"/>
      <circle cx="70" cy="36" r="3.5" fill="#E9D5FF"/>
      <circle cx="76" cy="46" r="2.5" fill="#E9D5FF"/>
    </svg>`
  },
  {
    slug: 'pet-care',
    title: 'Pet Care',
    bg: '#FFFBEB',
    accent: '#B45309',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
      <rect width="100" height="100" rx="24" fill="#FFFBEB"/>
      <!-- Paw Print -->
      <ellipse cx="50" cy="62" rx="14" ry="11" fill="#D97706"/>
      <ellipse cx="32" cy="44" rx="6" ry="9" fill="#D97706" transform="rotate(-20 32 44)"/>
      <ellipse cx="44" cy="36" rx="6" ry="9" fill="#D97706" transform="rotate(-8 44 36)"/>
      <ellipse cx="56" cy="36" rx="6" ry="9" fill="#D97706" transform="rotate(8 56 36)"/>
      <ellipse cx="68" cy="44" rx="6" ry="9" fill="#D97706" transform="rotate(20 68 44)"/>
      <!-- Pet Bone -->
      <path d="M36 80 L64 80" stroke="#B45309" stroke-width="4" stroke-linecap="round"/>
    </svg>`
  }
];

for (const cat of categories) {
  const filePath = path.join(targetDir, `${cat.slug}.svg`);
  fs.writeFileSync(filePath, cat.svg.trim(), 'utf8');
}

console.log(`Generated all ${categories.length} category SVGs in ${targetDir}`);
