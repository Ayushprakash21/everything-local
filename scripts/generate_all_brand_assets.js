const fs = require('fs');
const path = require('path');

const targetDirs = [
  path.join(__dirname, '../client/public/brand'),
  path.join(__dirname, '../public/brand')
];

for (const dir of targetDirs) {
  fs.mkdirSync(dir, { recursive: true });
}

// 1. Reusable Symbol Vector snippet
function getSymbolSvg(variant = 'light') {
  const isDark = variant === 'dark' || variant === 'app-icon';
  const isMono = variant === 'monochrome';

  const elColor = isDark ? '#FFFFFF' : (isMono ? '#0B1F3B' : '#0B1F3B');
  const bagColor = isMono ? '#0B1F3B' : '#F5B82E';
  const greenColor = isMono ? '#0B1F3B' : '#10B981';
  const amberColor = isMono ? '#0B1F3B' : '#F5B82E';
  const pinDotColor = isMono ? '#FFFFFF' : '#FFFFFF';

  return `
  <!-- Shopping Bag Handle -->
  <path d="M 72 32 C 72 12, 108 12, 108 32" fill="none" stroke="${bagColor}" stroke-width="8.5" stroke-linecap="round"/>

  <!-- Shopping Bag Frame -->
  <path d="M 54 34 L 124 34 C 134 34, 140 42, 144 58 L 149 86 C 152 98, 146 108, 132 112" 
        fill="none" stroke="${bagColor}" stroke-width="7.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M 46 54 L 39 86 C 35 98, 42 108, 56 112" 
        fill="none" stroke="${bagColor}" stroke-width="7.5" stroke-linecap="round" stroke-linejoin="round"/>

  <!-- EL Monogram -->
  <g fill="${elColor}">
    <!-- Slanted E -->
    <path d="M 57 44 L 93 44 L 90 56 L 73 56 L 70 69 L 86 69 L 83 80 L 67 80 L 64 93 L 91 93 L 88 104 L 42 104 Z"/>
    <!-- Slanted L -->
    <path d="M 99 44 L 113 44 L 99 93 L 128 93 L 125 104 L 83 104 Z"/>
  </g>

  <!-- Dynamic Green Swoosh (Bottom Left) -->
  <path d="M 28 96 C 18 114, 30 134, 60 140 C 84 144, 110 138, 122 129 C 97 137, 69 137, 45 129 C 29 121, 22 108, 28 96 Z" 
        fill="${greenColor}"/>

  <!-- Location Pin on Green Swoosh Tip -->
  <g transform="translate(26, 95)">
    <path d="M 0 -11 C -6 -11, -11 -6, -11 0 C -11 7, 0 17, 0 17 C 0 17, 11 7, 11 0 C 11 -6, 6 -11, 0 -11 Z" fill="${amberColor}"/>
    <circle cx="0" cy="0" r="3.8" fill="${pinDotColor}"/>
  </g>

  <!-- Dynamic Amber Swoosh (Bottom Right) -->
  <path d="M 64 125 C 95 135, 131 131, 155 113 C 171 99, 178 79, 175 61 C 177 77, 168 95, 149 107 C 127 121, 93 125, 64 125 Z" 
        fill="${amberColor}"/>
`;
}

// 2. Compact Header Logo SVG (specifically proportioned for desktop/tablet navigation bar)
function getCompactHeaderLogoSvg(variant = 'light') {
  const isDark = variant === 'dark';
  const isMono = variant === 'monochrome';
  const everyColor = isDark ? '#FFFFFF' : (isMono ? '#0B1F3B' : '#0B1F3B');
  const localColor = isMono ? '#0B1F3B' : '#F5B82E';
  const leafColor = isMono ? '#0B1F3B' : '#10B981';
  const dividerColor = isDark ? '#334155' : (isMono ? '#0B1F3B' : '#CBD5E1');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 76" width="100%" height="100%">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@800;900&amp;display=swap');
      .brand-head-title {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-weight: 900;
        font-size: 38px;
        letter-spacing: -0.8px;
      }
    </style>
  </defs>

  <!-- Scaled Symbol on Left -->
  <g transform="translate(4, 3) scale(0.46)">
    ${getSymbolSvg(variant)}
  </g>

  <!-- Vertical Divider Line -->
  <line x1="92" y1="14" x2="92" y2="62" stroke="${dividerColor}" stroke-width="2.5" stroke-linecap="round"/>

  <!-- Wordmark: Continuous kerning -->
  <text x="110" y="50" class="brand-head-title" fill="${everyColor}">
    Everything <tspan fill="${localColor}">Local</tspan>
  </text>

  <!-- Green Leaf Accent over 'i' -->
  <path d="M 257 20 C 265 19, 270 25, 267 30 C 259 31, 254 24, 257 20 Z" fill="${leafColor}"/>
</svg>`;
}

// 3. Primary Full Horizontal Logo SVG (with tagline and smile curve)
function getHorizontalLogoSvg(variant = 'light') {
  const isDark = variant === 'dark';
  const isMono = variant === 'monochrome';
  const everyColor = isDark ? '#FFFFFF' : (isMono ? '#0B1F3B' : '#0B1F3B');
  const localColor = isMono ? '#0B1F3B' : '#F5B82E';
  const leafColor = isMono ? '#0B1F3B' : '#10B981';
  const dividerColor = isDark ? '#334155' : (isMono ? '#0B1F3B' : '#CBD5E1');
  const taglineColor = isDark ? '#CBD5E1' : (isMono ? '#334155' : '#6B7280');
  const smileColor = isMono ? '#0B1F3B' : '#F5B82E';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 130" width="100%" height="100%">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@500;800;900&amp;display=swap');
      .brand-full-title {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-weight: 900;
        font-size: 44px;
        letter-spacing: -0.9px;
      }
      .brand-full-tagline {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-weight: 500;
        font-size: 19px;
        letter-spacing: -0.1px;
      }
    </style>
  </defs>

  <!-- Scaled Symbol on Left -->
  <g transform="translate(6, 4) scale(0.78)">
    ${getSymbolSvg(variant)}
  </g>

  <!-- Vertical Divider Line -->
  <line x1="158" y1="20" x2="158" y2="108" stroke="${dividerColor}" stroke-width="2.5" stroke-linecap="round"/>

  <!-- Wordmark -->
  <text x="180" y="62" class="brand-full-title" fill="${everyColor}">
    Everything <tspan fill="${localColor}">Local</tspan>
  </text>

  <!-- Leaf Accent over 'i' -->
  <path d="M 351 27 C 361 26, 366 33, 363 39 C 353 40, 347 32, 351 27 Z" fill="${leafColor}"/>

  <!-- Tagline: Shop more. Save more. Live better. -->
  <text x="182" y="98" class="brand-full-tagline" fill="${taglineColor}">Shop more. Save more. Live better.</text>

  <!-- Dynamic Amber Smile Curve under 'Live better.' -->
  <path d="M 388 108 Q 440 120 495 106" fill="none" stroke="${smileColor}" stroke-width="3" stroke-linecap="round"/>
</svg>`;
}

// 4. Standalone Symbol SVG
function getSymbolOnlySvg(variant = 'light') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 150" width="100%" height="100%">
  ${getSymbolSvg(variant)}
</svg>`;
}

// 5. Favicon SVG (Square with padding)
function getFaviconSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="100%" height="100%">
  <rect width="160" height="160" rx="36" fill="#FFFFFF"/>
  <g transform="translate(-10, 4) scale(0.98)">
    ${getSymbolSvg('light')}
  </g>
</svg>`;
}

// 6. App Icon SVG (512x512 Dark Midnight Navy Rounded Squircle)
function getAppIconSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <linearGradient id="appBgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0F284A"/>
      <stop offset="100%" stop-color="#071324"/>
    </linearGradient>
    <filter id="iconShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.4"/>
    </filter>
  </defs>

  <!-- Rounded Squircle Canvas -->
  <rect width="512" height="512" rx="115" fill="url(#appBgGrad)"/>

  <!-- Centered Symbol -->
  <g transform="translate(68, 86) scale(2.0)" filter="url(#iconShadow)">
    ${getSymbolSvg('app-icon')}
  </g>
</svg>`;
}

// 7. Merchant Dashboard Logo SVG (Horizontal with 'Partner Console' badge)
function getMerchantLogoSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 580 120" width="100%" height="100%">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@700;800;900&amp;display=swap');
      .m-title { font-family: 'Inter', sans-serif; font-weight: 900; font-size: 38px; letter-spacing: -0.8px; }
      .m-badge { font-family: 'Inter', sans-serif; font-weight: 800; font-size: 13px; letter-spacing: 1px; }
    </style>
  </defs>

  <g transform="translate(6, 4) scale(0.72)">
    ${getSymbolSvg('light')}
  </g>

  <line x1="145" y1="18" x2="145" y2="102" stroke="#CBD5E1" stroke-width="2.5" stroke-linecap="round"/>

  <text x="165" y="54" class="m-title" fill="#0B1F3B">
    Everything <tspan fill="#F5B82E">Local</tspan>
  </text>

  <path d="M 336 24 C 344 23, 348 29, 345 34 C 337 35, 332 28, 336 24 Z" fill="#10B981"/>

  <!-- Merchant Partner Badge -->
  <rect x="165" y="68" width="168" height="26" rx="13" fill="#FFFBEB" stroke="#FDE68A" stroke-width="1.5"/>
  <text x="180" y="86" class="m-badge" fill="#92400E">PARTNER CONSOLE</text>
</svg>`;
}

// 8. Delivery Partner Application Icon SVG
function getDeliveryIconSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <linearGradient id="riderBg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0284C7"/>
      <stop offset="100%" stop-color="#0369A1"/>
    </linearGradient>
  </defs>

  <rect width="512" height="512" rx="115" fill="url(#riderBg)"/>

  <!-- Scooter Rider Silhouette -->
  <g transform="translate(60, 60) scale(3.0)" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="36" cy="88" r="14"/>
    <circle cx="92" cy="88" r="14"/>
    <path d="M 36 88 L 52 68 L 76 68 L 92 88"/>
    <path d="M 76 68 L 80 40 L 94 40"/>
    <rect x="22" y="46" width="22" height="22" rx="4" fill="#FFFFFF"/>
    <circle cx="70" cy="30" r="8" fill="#FFFFFF"/>
  </g>
</svg>`;
}

// 9. Application Section Icons (Shop, Pharmacy, Services, Delivery, Merchant, Admin)
const sectionIcons = [
  {
    name: 'app-icon-shop',
    bgColor: '#F5B82E',
    fgColor: '#0B1F3B',
    innerSvg: `<path d="M 32 36 L 44 36 L 56 74 L 88 74 L 98 46 L 48 46" fill="none" stroke="#0B1F3B" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
               <circle cx="58" cy="88" r="7" fill="#0B1F3B"/>
               <circle cx="86" cy="88" r="7" fill="#0B1F3B"/>`
  },
  {
    name: 'app-icon-pharmacy',
    bgColor: '#10B981',
    fgColor: '#FFFFFF',
    innerSvg: `<rect x="53" y="32" width="22" height="64" rx="7" fill="#FFFFFF"/>
               <rect x="32" y="53" width="64" height="22" rx="7" fill="#FFFFFF"/>`
  },
  {
    name: 'app-icon-services',
    bgColor: '#8B5CF6',
    fgColor: '#FFFFFF',
    innerSvg: `<path d="M 40 40 L 88 88 M 46 36 L 36 46 M 78 88 L 88 78" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round"/>
               <path d="M 88 40 L 40 88 M 78 36 L 88 46 M 36 78 L 46 88" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round"/>
               <circle cx="44" cy="44" r="5" fill="#8B5CF6"/>
               <circle cx="84" cy="44" r="5" fill="#8B5CF6"/>`
  },
  {
    name: 'app-icon-delivery',
    bgColor: '#0EA5E9',
    fgColor: '#FFFFFF',
    innerSvg: `<circle cx="44" cy="84" r="12" fill="none" stroke="#FFFFFF" stroke-width="6"/>
               <circle cx="84" cy="84" r="12" fill="none" stroke="#FFFFFF" stroke-width="6"/>
               <path d="M 44 84 L 56 68 L 74 68 L 84 84" fill="none" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
               <path d="M 74 68 L 78 44 L 88 44" fill="none" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
               <rect x="34" y="48" width="18" height="18" rx="4" fill="#FFFFFF"/>`
  },
  {
    name: 'app-icon-merchant',
    bgColor: '#F97316',
    fgColor: '#FFFFFF',
    innerSvg: `<path d="M 32 46 L 96 46 L 90 62 C 88 66, 82 68, 78 64 C 74 68, 68 68, 64 64 C 60 68, 54 68, 50 64 C 46 68, 40 66, 38 62 Z" fill="#FFFFFF"/>
               <path d="M 36 62 L 36 88 L 92 88 L 92 62" fill="none" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
               <rect x="54" y="70" width="20" height="18" rx="2" fill="#FFFFFF"/>`
  },
  {
    name: 'app-icon-admin',
    bgColor: '#0B1F3B',
    fgColor: '#FFFFFF',
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

// Master list of all 10 brand deliverables
const filesToGenerate = [
  { name: 'everything-local-logo-horizontal.svg', content: getHorizontalLogoSvg('light') },
  { name: 'everything-local-symbol.svg', content: getSymbolOnlySvg('light') },
  { name: 'everything-local-logo-light.svg', content: getHorizontalLogoSvg('light') },
  { name: 'everything-local-logo-dark.svg', content: getHorizontalLogoSvg('dark') },
  { name: 'everything-local-monochrome.svg', content: getHorizontalLogoSvg('monochrome') },
  { name: 'everything-local-favicon.svg', content: getFaviconSvg() },
  { name: 'everything-local-app-icon.svg', content: getAppIconSvg() },
  { name: 'everything-local-logo-compact.svg', content: getCompactHeaderLogoSvg('light') },
  { name: 'everything-local-merchant-logo.svg', content: getMerchantLogoSvg() },
  { name: 'everything-local-delivery-icon.svg', content: getDeliveryIconSvg() }
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
