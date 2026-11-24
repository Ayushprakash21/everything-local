const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = path.join(__dirname, '../docs/screenshots/responsive_branding');
fs.mkdirSync(outDir, { recursive: true });

const breakpoints = [
  { name: '1920px-desktop', width: 1920, height: 1080 },
  { name: '1440px-laptop', width: 1440, height: 900 },
  { name: '1024px-tablet-landscape', width: 1024, height: 768 },
  { name: '768px-tablet-portrait', width: 768, height: 1024 },
  { name: '430px-mobile-large', width: 430, height: 932 },
  { name: '375px-mobile-compact', width: 375, height: 812 }
];

console.log('Testing responsive branding at all breakpoints...');

for (const bp of breakpoints) {
  const screenshotPath = path.join(outDir, `brand_${bp.name}.png`);
  const cmd = `"${CHROME_PATH}" --headless --disable-gpu --window-size=${bp.width},${bp.height} --screenshot="${screenshotPath}" "http://localhost:5173"`;
  try {
    execSync(cmd, { stdio: 'ignore' });
    console.log(`✓ Captured ${bp.name} (${bp.width}x${bp.height})`);
  } catch (err) {
    console.error(`Failed to capture ${bp.name}:`, err.message);
  }
}

console.log('🎉 Responsive verification completed!');
