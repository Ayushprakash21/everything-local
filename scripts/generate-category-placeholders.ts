import fs from 'fs';
import path from 'path';

const outDir = path.resolve(__dirname, '../client/public/brand/placeholders');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

interface PlaceholderDef {
  fileName: string;
  categoryName: string;
  themeColor: string;
  accentColor: string;
  iconPath: string;
}

const categories: PlaceholderDef[] = [
  {
    fileName: 'grocery.svg',
    categoryName: 'Grocery & Essentials',
    themeColor: '#0B1F3B',
    accentColor: '#F5B82E',
    // Shopping basket icon
    iconPath: '<path d="M140 160 L260 160 L240 250 L160 250 Z" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="3"/><path d="M170 160 L185 120 L215 120 L230 160" fill="none" stroke="#F5B82E" stroke-width="4" stroke-linecap="round"/>'
  },
  {
    fileName: 'produce.svg',
    categoryName: 'Fruits & Vegetables',
    themeColor: '#064E3B',
    accentColor: '#10B981',
    // Fresh leaf / fruit icon
    iconPath: '<path d="M200 130 C150 130 150 240 200 250 C250 240 250 130 200 130 Z" fill="#ECFDF5" stroke="#10B981" stroke-width="3"/><path d="M200 130 Q170 190 200 250" fill="none" stroke="#059669" stroke-width="2.5"/><path d="M200 120 L200 130" stroke="#047857" stroke-width="4" stroke-linecap="round"/>'
  },
  {
    fileName: 'fashion.svg',
    categoryName: 'Clothing & Fashion',
    themeColor: '#4C1D95',
    accentColor: '#8B5CF6',
    // T-shirt / hanger icon
    iconPath: '<path d="M160 150 L180 130 Q200 145 220 130 L240 150 L225 170 L215 160 L215 250 L185 250 L185 160 L175 170 Z" fill="#F5F3FF" stroke="#8B5CF6" stroke-width="3" stroke-linejoin="round"/>'
  },
  {
    fileName: 'beauty.svg',
    categoryName: 'Beauty & Personal Care',
    themeColor: '#831843',
    accentColor: '#EC4899',
    // Cosmetics bottle / sparkle
    iconPath: '<rect x="175" y="160" width="50" height="90" rx="8" fill="#FDF2F8" stroke="#EC4899" stroke-width="3"/><rect x="187" y="140" width="26" height="20" rx="4" fill="#DB2777"/><circle cx="200" cy="195" r="10" fill="#F472B6"/>'
  },
  {
    fileName: 'home.svg',
    categoryName: 'Home & Kitchen',
    themeColor: '#78350F',
    accentColor: '#D97706',
    // House / Cookware
    iconPath: '<path d="M160 180 L200 140 L240 180 L240 250 L160 250 Z" fill="#FFFBEB" stroke="#D97706" stroke-width="3" stroke-linejoin="round"/><rect x="185" y="200" width="30" height="50" fill="#B45309" rx="3"/>'
  },
  {
    fileName: 'electronics.svg',
    categoryName: 'Electronics & Décor',
    themeColor: '#1E3A8A',
    accentColor: '#3B82F6',
    // Plug / bulb icon
    iconPath: '<path d="M175 160 C175 130 225 130 225 160 C225 185 215 195 215 215 L185 215 C185 195 175 185 175 160 Z" fill="#EFF6FF" stroke="#3B82F6" stroke-width="3"/><rect x="188" y="215" width="24" height="15" rx="2" fill="#60A5FA"/><line x1="200" y1="120" x2="200" y2="105" stroke="#3B82F6" stroke-width="3" stroke-linecap="round"/>'
  },
  {
    fileName: 'jewellery.svg',
    categoryName: 'Jewellery & Accessories',
    themeColor: '#701A75',
    accentColor: '#D946EF',
    // Diamond icon
    iconPath: '<path d="M170 165 L200 135 L230 165 L200 245 Z" fill="#FAF5FF" stroke="#D946EF" stroke-width="3" stroke-linejoin="round"/><line x1="170" y1="165" x2="230" y2="165" stroke="#C026D3" stroke-width="2"/>'
  },
  {
    fileName: 'footwear.svg',
    categoryName: 'Bags, Footwear & Travel',
    themeColor: '#1F2937',
    accentColor: '#F59E0B',
    // Shoe / bag icon
    iconPath: '<path d="M150 230 C150 200 180 180 210 180 L230 180 L245 200 L245 230 Z" fill="#F8FAFC" stroke="#64748B" stroke-width="3" stroke-linejoin="round"/><rect x="150" y="230" width="95" height="12" rx="3" fill="#F59E0B"/>'
  },
  {
    fileName: 'pharmacy.svg',
    categoryName: 'Pharmacy & Wellness',
    themeColor: '#991B1B',
    accentColor: '#EF4444',
    // Cross / shield icon
    iconPath: '<circle cx="200" cy="190" r="50" fill="#FEF2F2" stroke="#EF4444" stroke-width="3"/><path d="M192 165 H208 V182 H225 V198 H208 V215 H192 V198 H175 V182 H192 Z" fill="#DC2626"/>'
  },
  {
    fileName: 'services.svg',
    categoryName: 'Local Services & Experts',
    themeColor: '#0F172A',
    accentColor: '#06B6D4',
    // Wrench / tool icon
    iconPath: '<path d="M165 160 C155 170 155 185 165 195 L220 250 L240 230 L185 175 C195 165 180 150 170 155 Z" fill="#F0FDFA" stroke="#06B6D4" stroke-width="3"/><circle cx="225" cy="235" r="4" fill="#0891B2"/>'
  }
];

for (const cat of categories) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad_${cat.fileName.replace('.svg', '')}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F8FAFC"/>
      <stop offset="100%" stop-color="#F1F5F9"/>
    </linearGradient>
  </defs>
  <rect width="400" height="400" rx="20" fill="url(#bgGrad_${cat.fileName.replace('.svg', '')})"/>
  <rect x="2" y="2" width="396" height="396" rx="18" fill="none" stroke="#E2E8F0" stroke-width="2"/>
  <circle cx="200" cy="190" r="95" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5"/>
  
  <g id="category-icon">
    ${cat.iconPath}
  </g>

  <!-- EB Brand Badge -->
  <g transform="translate(200, 265)">
    <rect x="-35" y="-14" width="70" height="28" rx="14" fill="#0B1F3B"/>
    <text x="0" y="4" font-family="'Inter', sans-serif" font-weight="900" font-size="12" fill="#F5B82E" text-anchor="middle" letter-spacing="1">EB</text>
  </g>

  <text x="200" y="325" font-family="'Inter', sans-serif" font-weight="700" font-size="16" fill="#1E293B" text-anchor="middle">${cat.categoryName}</text>
  <text x="200" y="348" font-family="'Inter', sans-serif" font-weight="500" font-size="12" fill="#64748B" text-anchor="middle">EveryBazaar Curated • Verified Quality</text>
</svg>`;

  fs.writeFileSync(path.join(outDir, cat.fileName), svg.trim());
}

console.log(`Generated ${categories.length} category-specific branded placeholders in ${outDir}`);
