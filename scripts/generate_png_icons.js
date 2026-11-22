const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const tempHtml = path.join(__dirname, 'temp_icon_render.html');

function renderSvgToPng(svgPath, outPngPath, width, height, bgColor = 'transparent') {
  const svgContent = fs.readFileSync(svgPath, 'utf8');
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

const brandDir = path.join(__dirname, '../client/public/brand');
const pubDir = path.join(__dirname, '../client/public');
const brandingDir = path.join(__dirname, '../client/public/branding');

fs.mkdirSync(brandingDir, { recursive: true });

try {
  // Favicon PNG (64x64)
  renderSvgToPng(
    path.join(brandDir, 'everything-local-favicon.svg'),
    path.join(pubDir, 'favicon.png'),
    64, 64
  );
  fs.copyFileSync(path.join(pubDir, 'favicon.png'), path.join(brandingDir, 'favicon.png'));

  // Apple Touch Icon (180x180)
  renderSvgToPng(
    path.join(brandDir, 'everything-local-app-icon.svg'),
    path.join(pubDir, 'apple-touch-icon.png'),
    180, 180
  );

  // App Icon 192 (192x192)
  renderSvgToPng(
    path.join(brandDir, 'everything-local-app-icon.svg'),
    path.join(pubDir, 'icon-192.png'),
    192, 192
  );
  fs.copyFileSync(path.join(pubDir, 'icon-192.png'), path.join(brandingDir, 'android-icon.png'));

  // App Icon 512 (512x512)
  renderSvgToPng(
    path.join(brandDir, 'everything-local-app-icon.svg'),
    path.join(pubDir, 'icon-512.png'),
    512, 512
  );

  // Logo Icon (512x512 transparent symbol)
  renderSvgToPng(
    path.join(brandDir, 'everything-local-symbol.svg'),
    path.join(brandingDir, 'logo-icon.png'),
    512, 512
  );

  // Logo Dark (for light bg, 680x150)
  renderSvgToPng(
    path.join(brandDir, 'everything-local-logo-dark.svg'),
    path.join(brandingDir, 'logo-dark.png'),
    680, 150
  );

  // Logo Light (for dark bg, 680x150)
  renderSvgToPng(
    path.join(brandDir, 'everything-local-logo-light.svg'),
    path.join(brandingDir, 'logo-light.png'),
    680, 150
  );

  // Logo Full
  renderSvgToPng(
    path.join(brandDir, 'everything-local-logo-horizontal.svg'),
    path.join(brandingDir, 'logo-full.png'),
    680, 150
  );

  if (fs.existsSync(tempHtml)) {
    fs.unlinkSync(tempHtml);
  }

  console.log('🎉 All raster icons generated cleanly from vector source!');
} catch (err) {
  console.error('Error generating raster icons:', err);
}
