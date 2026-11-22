const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const targetDirs = [
  path.join(__dirname, '../client/public/brand'),
  path.join(__dirname, '../public/brand')
];

for (const dir of targetDirs) {
  fs.mkdirSync(dir, { recursive: true });
}

// 1. Symbol Vector (Reusable SVG snippet)
function getSymbolSvg(variant = 'light') {
  const elColor = variant === 'dark' || variant === 'app-icon' ? '#FFFFFF' : (variant === 'monochrome' ? '#0B1F3A' : '#0B1F3A');
  const bagColor = variant === 'monochrome' ? '#0B1F3A' : '#FFB21A';
  const greenColor = variant === 'monochrome' ? '#0B1F3A' : '#00B982';
  const amberColor = variant === 'monochrome' ? '#0B1F3A' : '#FFB21A';
  const pinDotColor = variant === 'monochrome' ? '#FFFFFF' : '#FFFFFF';

  return `
  <!-- Shopping Bag Handle -->
  <path d="M 82 36 C 82 16, 118 16, 118 36" fill="none" stroke="${bagColor}" stroke-width="8.5" stroke-linecap="round"/>

  <!-- Shopping Bag Frame -->
  <path d="M 64 36 L 136 36 C 146 36, 150 43, 154 58 L 160 88 C 163 102, 156 112, 142 116" 
        fill="none" stroke="${bagColor}" stroke-width="7.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M 54 55 L 46 88 C 42 102, 49 112, 63 116" 
        fill="none" stroke="${bagColor}" stroke-width="7.5" stroke-linecap="round" stroke-linejoin="round"/>

  <!-- EL Monogram -->
  <g fill="${elColor}">
    <!-- Slanted E -->
    <path d="M 67 46 L 103 46 L 100 58 L 83 58 L 80 72 L 96 72 L 93 83 L 77 83 L 74 97 L 101 97 L 98 108 L 52 108 Z"/>
    <!-- Slanted L -->
    <path d="M 109 46 L 123 46 L 109 97 L 138 97 L 135 108 L 93 108 Z"/>
  </g>

  <!-- Dynamic Green Swoosh (Bottom Left) -->
  <path d="M 35 98 C 26 116, 38 136, 68 143 C 93 147, 119 141, 131 132 C 106 140, 78 140, 54 132 C 38 124, 31 111, 35 98 Z" 
        fill="${greenColor}"/>

  <!-- Location Pin on Green Swoosh Tip -->
  <g transform="translate(34, 96)">
    <path d="M 0 -11 C -6 -11, -11 -6, -11 0 C -11 7, 0 17, 0 17 C 0 17, 11 7, 11 0 C 11 -6, 6 -11, 0 -11 Z" fill="${amberColor}"/>
    <circle cx="0" cy="0" r="3.8" fill="${pinDotColor}"/>
  </g>

  <!-- Dynamic Amber Swoosh (Bottom Right) -->
  <path d="M 72 127 C 103 137, 139 133, 163 115 C 179 101, 186 81, 183 63 C 185 79, 176 97, 157 109 C 135 123, 101 127, 72 127 Z" 
        fill="${amberColor}"/>
`;
}

// 2. Full Horizontal Logo SVG
function getHorizontalLogoSvg(variant = 'light') {
  const isDark = variant === 'dark';
  const isMono = variant === 'monochrome';
  const everyColor = isDark ? '#FFFFFF' : (isMono ? '#0B1F3A' : '#0B1F3A');
  const localColor = isMono ? '#0B1F3A' : '#FFB21A';
  const leafColor = isMono ? '#0B1F3A' : '#00B982';
  const dividerColor = isDark ? '#334155' : (isMono ? '#0B1F3A' : '#CBD5E1');
  const taglineColor = isDark ? '#94A3B8' : (isMono ? '#334155' : '#64748B');
  const smileColor = isMono ? '#0B1F3A' : '#FFB21A';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 150" width="100%" height="100%">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@500;800;900&amp;display=swap');
      .brand-title {
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
        font-weight: 900;
        font-size: 50px;
        letter-spacing: -1px;
      }
      .brand-tagline {
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
        font-weight: 500;
        font-size: 20px;
        letter-spacing: -0.2px;
      }
    </style>
  </defs>

  <!-- Left: Reusable Symbol -->
  <g transform="translate(10, -3)">
    ${getSymbolSvg(variant)}
  </g>

  <!-- Vertical Divider Line -->
  <line x1="210" y1="28" x2="210" y2="118" stroke="${dividerColor}" stroke-width="2.5" stroke-linecap="round"/>

  <!-- Wordmark: Everything Local -->
  <g transform="translate(232, 70)">
    <!-- 'Everyth' -->
    <text x="0" y="0" class="brand-title" fill="${everyColor}">Everyth</text>
    
    <!-- 'i' with Green Leaf Dot -->
    <!-- 'i' stem -->
    <rect x="202" y="-35" width="12" height="35" rx="3" fill="${everyColor}"/>
    <!-- Green Leaf Dot on 'i' -->
    <path d="M 213 -52 C 223 -52, 227 -43, 223 -37 C 213 -37, 209 -46, 213 -52 Z" fill="${leafColor}"/>

    <!-- 'ng ' -->
    <text x="222" y="0" class="brand-title" fill="${everyColor}">ng</text>

    <!-- 'Local' in Amber -->
    <text x="290" y="0" class="brand-title" fill="${localColor}">Local</text>
  </g>

  <!-- Tagline: Shop more. Save more. Live better. -->
  <g transform="translate(233, 108)">
    <text x="0" y="0" class="brand-tagline" fill="${taglineColor}">Shop more. Save more. Live better.</text>
    <!-- Dynamic Amber Smile Curve under 'Live better.' -->
    <path d="M 230 10 Q 300 24 370 12" fill="none" stroke="${smileColor}" stroke-width="3" stroke-linecap="round"/>
  </g>
</svg>`;
}

// 3. Standalone Symbol SVG
function getSymbolOnlySvg(variant = 'light') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160" width="100%" height="100%">
  ${getSymbolSvg(variant)}
</svg>`;
}

// 4. Favicon SVG (Square with padding)
function getFaviconSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="100%" height="100%">
  <rect width="160" height="160" rx="32" fill="#FFFFFF"/>
  <g transform="translate(-16, 2) scale(0.96)">
    ${getSymbolSvg('light')}
  </g>
</svg>`;
}

// 5. App Icon SVG (512x512 Dark Navy Rounded Squircle)
function getAppIconSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <linearGradient id="appBg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0F284A"/>
      <stop offset="100%" stop-color="#071324"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.4"/>
    </filter>
  </defs>

  <!-- App Rounded Squircle Background -->
  <rect width="512" height="512" rx="115" fill="url(#appBg)"/>

  <!-- Centered Symbol -->
  <g transform="translate(68, 86) scale(1.9)" filter="url(#shadow)">
    ${getSymbolSvg('app-icon')}
  </g>
</svg>`;
}

// 6. Section Application Icons (Shop, Pharmacy, Services, Delivery Partner, Merchant, Admin)
const sectionIcons = [
  {
    name: 'app-icon-shop',
    label: 'Shop (Customer)',
    bgColor: '#FFB21A',
    fgColor: '#0B1F3A',
    // Shopping Cart SVG path
    innerSvg: `<path d="M 32 36 L 44 36 L 56 74 L 88 74 L 98 46 L 48 46" fill="none" stroke="#0B1F3A" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
               <circle cx="58" cy="88" r="7" fill="#0B1F3A"/>
               <circle cx="86" cy="88" r="7" fill="#0B1F3A"/>`
  },
  {
    name: 'app-icon-pharmacy',
    label: 'Pharmacy & Medical',
    bgColor: '#00B982',
    fgColor: '#FFFFFF',
    // Medical Cross + Heart/Pill
    innerSvg: `<rect x="53" y="32" width="22" height="64" rx="7" fill="#FFFFFF"/>
               <rect x="32" y="53" width="64" height="22" rx="7" fill="#FFFFFF"/>`
  },
  {
    name: 'app-icon-services',
    label: 'Services',
    bgColor: '#8B5CF6',
    fgColor: '#FFFFFF',
    // Crossed Wrench & Screwdriver
    innerSvg: `<path d="M 40 40 L 88 88 M 46 36 L 36 46 M 78 88 L 88 78" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round"/>
               <path d="M 88 40 L 40 88 M 78 36 L 88 46 M 36 78 L 46 88" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round"/>
               <circle cx="44" cy="44" r="5" fill="#8B5CF6"/>
               <circle cx="84" cy="44" r="5" fill="#8B5CF6"/>`
  },
  {
    name: 'app-icon-delivery',
    label: 'Delivery Partner',
    bgColor: '#0EA5E9',
    fgColor: '#FFFFFF',
    // Delivery Scooter / Rider
    innerSvg: `<circle cx="44" cy="84" r="12" fill="none" stroke="#FFFFFF" stroke-width="6"/>
               <circle cx="84" cy="84" r="12" fill="none" stroke="#FFFFFF" stroke-width="6"/>
               <path d="M 44 84 L 56 68 L 74 68 L 84 84" fill="none" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
               <path d="M 74 68 L 78 44 L 88 44" fill="none" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
               <rect x="34" y="48" width="18" height="18" rx="4" fill="#FFFFFF"/>`
  },
  {
    name: 'app-icon-merchant',
    label: 'Merchant Portal',
    bgColor: '#F97316',
    fgColor: '#FFFFFF',
    // Storefront with Awning
    innerSvg: `<path d="M 32 46 L 96 46 L 90 62 C 88 66, 82 68, 78 64 C 74 68, 68 68, 64 64 C 60 68, 54 68, 50 64 C 46 68, 40 66, 38 62 Z" fill="#FFFFFF"/>
               <path d="M 36 62 L 36 88 L 92 88 L 92 62" fill="none" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
               <rect x="54" y="70" width="20" height="18" rx="2" fill="#FFFFFF"/>`
  },
  {
    name: 'app-icon-admin',
    label: 'Admin Console',
    bgColor: '#0B1F3A',
    fgColor: '#FFFFFF',
    // Gear / Settings Cog
    innerSvg: `<circle cx="64" cy="64" r="15" fill="none" stroke="#FFFFFF" stroke-width="8"/>
               <path d="M 64 30 L 64 38 M 64 90 L 64 98 M 30 64 L 38 64 M 90 64 L 98 64 M 40 40 L 46 46 M 82 82 L 88 88 M 40 88 L 46 82 M 82 46 L 88 40" 
                     stroke="#FFFFFF" stroke-width="8" stroke-linecap="round"/>`
  }
];

function getSectionIconSvg(icon) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="100%" height="100%">
  <rect width="128" height="128" rx="28" fill="${icon.bgColor}"/>
  ${icon.innerSvg}
</svg>`;
}

// Generate all assets
const filesToGenerate = [
  { name: 'everything-local-logo-horizontal.svg', content: getHorizontalLogoSvg('light') },
  { name: 'everything-local-logo-dark.svg', content: getHorizontalLogoSvg('dark') },
  { name: 'everything-local-logo-light.svg', content: getHorizontalLogoSvg('light') },
  { name: 'everything-local-symbol.svg', content: getSymbolOnlySvg('light') },
  { name: 'everything-local-monochrome.svg', content: getHorizontalLogoSvg('monochrome') },
  { name: 'everything-local-favicon.svg', content: getFaviconSvg() },
  { name: 'everything-local-app-icon.svg', content: getAppIconSvg() },
];

for (const icon of sectionIcons) {
  filesToGenerate.push({
    name: `${icon.name}.svg`,
    content: getSectionIconSvg(icon)
  });
}

// Write to all target directories
for (const file of filesToGenerate) {
  for (const dir of targetDirs) {
    const fullPath = path.join(dir, file.name);
    fs.writeFileSync(fullPath, file.content, 'utf8');
  }
  console.log(`✓ Generated: ${file.name}`);
}

// Also write favicon.svg directly to client/public/favicon.svg
fs.writeFileSync(path.join(__dirname, '../client/public/favicon.svg'), getFaviconSvg(), 'utf8');
console.log('✓ Generated: client/public/favicon.svg');
