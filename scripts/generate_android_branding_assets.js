const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const tempHtml = path.join(__dirname, 'temp_android_icon_render.html');

function renderSvgToPng(svgContent, outPngPath, width, height, bgColor = 'transparent') {
  const html = `<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: ${width}px;
      height: ${height}px;
      background: ${bgColor};
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    svg {
      width: 100%;
      height: 100%;
    }
  </style>
</head>
<body>
  ${svgContent}
</body>
</html>`;

  fs.writeFileSync(tempHtml, html, 'utf8');

  const cmd = `"${CHROME_PATH}" --headless --disable-gpu --force-device-scale-factor=1 --window-size=${width},${height} --screenshot="${outPngPath}" "file:///${tempHtml.replace(/\\/g, '/')}"`;
  execSync(cmd, { stdio: 'ignore' });
  console.log(`✓ Rendered PNG (${width}x${height}): ${path.basename(outPngPath)}`);
}

// 1. Customer Icon SVG: Deep Navy Squircle, Golden Bag Frame, Slanted EL, Green Swoosh + Pin, Amber Swoosh
const customerIconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <linearGradient id="custBg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0F284A"/>
      <stop offset="100%" stop-color="#071324"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="115" fill="url(#custBg)"/>
  <g transform="translate(68, 86) scale(2.0)">
    <!-- Shopping Bag Handle -->
    <path d="M 72 32 C 72 12, 108 12, 108 32" fill="none" stroke="#F5B82E" stroke-width="8.5" stroke-linecap="round"/>
    <!-- Shopping Bag Frame -->
    <path d="M 54 34 L 124 34 C 134 34, 140 42, 144 58 L 149 86 C 152 98, 146 108, 132 112" 
          fill="none" stroke="#F5B82E" stroke-width="7.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M 46 54 L 39 86 C 35 98, 42 108, 56 112" 
          fill="none" stroke="#F5B82E" stroke-width="7.5" stroke-linecap="round" stroke-linejoin="round"/>
    <!-- EL Monogram -->
    <g fill="#FFFFFF">
      <path d="M 57 44 L 93 44 L 90 56 L 73 56 L 70 69 L 86 69 L 83 80 L 67 80 L 64 93 L 91 93 L 88 104 L 42 104 Z"/>
      <path d="M 99 44 L 113 44 L 99 93 L 128 93 L 125 104 L 83 104 Z"/>
    </g>
    <!-- Dynamic Green Swoosh -->
    <path d="M 28 96 C 18 114, 30 134, 60 140 C 84 144, 110 138, 122 129 C 97 137, 69 137, 45 129 C 29 121, 22 108, 28 96 Z" fill="#10B981"/>
    <!-- Pin -->
    <g transform="translate(26, 95)">
      <path d="M 0 -11 C -6 -11, -11 -6, -11 0 C -11 7, 0 17, 0 17 C 0 17, 11 7, 11 0 C 11 -6, 6 -11, 0 -11 Z" fill="#F5B82E"/>
      <circle cx="0" cy="0" r="3.8" fill="#FFFFFF"/>
    </g>
    <!-- Dynamic Amber Swoosh -->
    <path d="M 64 125 C 95 135, 131 131, 155 113 C 171 99, 178 79, 175 61 C 177 77, 168 95, 149 107 C 127 121, 93 125, 64 125 Z" fill="#F5B82E"/>
  </g>
</svg>
`;

// 2. Merchant Icon SVG: Warm Amber/Orange Squircle, Merchant Storefront Awning, EL Monogram, Distinct Merchant Identity
const merchantIconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <linearGradient id="merchBg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#EA580C"/>
      <stop offset="100%" stop-color="#9A3412"/>
    </linearGradient>
    <linearGradient id="awningGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#F5B82E"/>
      <stop offset="100%" stop-color="#FBBF24"/>
    </linearGradient>
  </defs>
  <!-- Background Squircle -->
  <rect width="512" height="512" rx="115" fill="url(#merchBg)"/>

  <!-- Storefront Awning Canopy -->
  <g transform="translate(106, 64)">
    <!-- Store Awning Top Bar -->
    <path d="M 10 32 L 290 32 L 280 84 C 274 96, 258 98, 250 88 C 242 98, 226 98, 218 88 C 210 98, 194 98, 186 88 C 178 98, 162 98, 154 88 C 146 98, 130 98, 122 88 C 114 98, 98 98, 90 88 C 82 98, 66 98, 58 88 C 50 98, 34 96, 28 84 Z" fill="#FFFFFF"/>
    <!-- Alternating Orange Stripes on Awning -->
    <path d="M 38 32 L 72 32 L 68 84 C 64 88, 54 88, 50 84 Z" fill="#EA580C"/>
    <path d="M 102 32 L 136 32 L 132 84 C 128 88, 118 88, 114 84 Z" fill="#EA580C"/>
    <path d="M 166 32 L 200 32 L 196 84 C 192 88, 182 88, 178 84 Z" fill="#EA580C"/>
    <path d="M 230 32 L 264 32 L 260 84 C 256 88, 246 88, 242 84 Z" fill="#EA580C"/>
  </g>

  <!-- Centered EL Symbol Container with Gold Frame -->
  <g transform="translate(106, 172) scale(1.6)">
    <!-- Shopping Bag Handle -->
    <path d="M 72 32 C 72 12, 108 12, 108 32" fill="none" stroke="#F5B82E" stroke-width="8.5" stroke-linecap="round"/>
    <!-- Shopping Bag Frame -->
    <path d="M 54 34 L 124 34 C 134 34, 140 42, 144 58 L 149 86 C 152 98, 146 108, 132 112" 
          fill="none" stroke="#F5B82E" stroke-width="7.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M 46 54 L 39 86 C 35 98, 42 108, 56 112" 
          fill="none" stroke="#F5B82E" stroke-width="7.5" stroke-linecap="round" stroke-linejoin="round"/>
    <!-- EL Monogram -->
    <g fill="#FFFFFF">
      <path d="M 57 44 L 93 44 L 90 56 L 73 56 L 70 69 L 86 69 L 83 80 L 67 80 L 64 93 L 91 93 L 88 104 L 42 104 Z"/>
      <path d="M 99 44 L 113 44 L 99 93 L 128 93 L 125 104 L 83 104 Z"/>
    </g>
    <!-- Green Swoosh -->
    <path d="M 28 96 C 18 114, 30 134, 60 140 C 84 144, 110 138, 122 129 C 97 137, 69 137, 45 129 C 29 121, 22 108, 28 96 Z" fill="#10B981"/>
    <!-- Pin -->
    <g transform="translate(26, 95)">
      <path d="M 0 -11 C -6 -11, -11 -6, -11 0 C -11 7, 0 17, 0 17 C 0 17, 11 7, 11 0 C 11 -6, 6 -11, 0 -11 Z" fill="#F5B82E"/>
      <circle cx="0" cy="0" r="3.8" fill="#FFFFFF"/>
    </g>
    <!-- Dynamic Amber Swoosh -->
    <path d="M 64 125 C 95 135, 131 131, 155 113 C 171 99, 178 79, 175 61 C 177 77, 168 95, 149 107 C 127 121, 93 125, 64 125 Z" fill="#F5B82E"/>
  </g>

  <!-- Merchant Partner Banner at Bottom -->
  <g transform="translate(136, 426)">
    <rect width="240" height="42" rx="21" fill="#FFFFFF"/>
    <text x="120" y="27" font-family="Arial, sans-serif" font-weight="900" font-size="20" fill="#9A3412" text-anchor="middle" letter-spacing="2">MERCHANT</text>
  </g>
</svg>
`;

const densitySizes = [
  { folder: 'mipmap-mdpi', size: 48 },
  { folder: 'mipmap-hdpi', size: 72 },
  { folder: 'mipmap-xhdpi', size: 96 },
  { folder: 'mipmap-xxhdpi', size: 144 },
  { folder: 'mipmap-xxxhdpi', size: 192 }
];

const customerResDir = path.join(__dirname, '../android-native/customer/app/src/main/res');
const merchantResDir = path.join(__dirname, '../android-native/merchant/app/src/main/res');

// Generate Customer Launcher Icons
for (const { folder, size } of densitySizes) {
  const dir = path.join(customerResDir, folder);
  fs.mkdirSync(dir, { recursive: true });
  renderSvgToPng(customerIconSvg, path.join(dir, 'ic_launcher.png'), size, size);
  renderSvgToPng(customerIconSvg, path.join(dir, 'ic_launcher_round.png'), size, size);
}

// Generate Merchant Launcher Icons
for (const { folder, size } of densitySizes) {
  const dir = path.join(merchantResDir, folder);
  fs.mkdirSync(dir, { recursive: true });
  renderSvgToPng(merchantIconSvg, path.join(dir, 'ic_launcher.png'), size, size);
  renderSvgToPng(merchantIconSvg, path.join(dir, 'ic_launcher_round.png'), size, size);
}

if (fs.existsSync(tempHtml)) {
  fs.unlinkSync(tempHtml);
}

console.log('✓ Successfully generated all Customer & Merchant Android launcher icons across all screen densities!');
