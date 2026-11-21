const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'mobile', 'assets');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const png = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c6360606060000000050001a7df9f0d0000000049454e44ae426082',
  'hex'
);

['icon.png', 'adaptive-icon.png', 'splash-icon.png', 'favicon.png'].forEach((file) => {
  fs.writeFileSync(path.join(dir, file), png);
});

console.log('Mobile image assets successfully generated in mobile/assets');
