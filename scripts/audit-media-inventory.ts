import fs from 'fs';
import path from 'path';

export interface ImageAssetRecord {
  relativePath: string;
  absolutePath: string;
  sizeBytes: number;
  format: string;
  exists: boolean;
}

export function scanImageDirectory(dir: string): ImageAssetRecord[] {
  const results: ImageAssetRecord[] = [];

  function walk(currentDir: string) {
    if (!fs.existsSync(currentDir)) return;
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else {
        const ext = path.extname(entry.name).toLowerCase();
        if (['.webp', '.svg', '.png', '.jpg', '.jpeg'].includes(ext)) {
          const stats = fs.statSync(fullPath);
          const rel = path.relative(path.resolve(__dirname, '../client/public'), fullPath).replace(/\\/g, '/');
          results.push({
            relativePath: '/' + rel,
            absolutePath: fullPath,
            sizeBytes: stats.size,
            format: ext.replace('.', '').toUpperCase(),
            exists: stats.size > 0
          });
        }
      }
    }
  }

  walk(dir);
  return results;
}

export function runMediaInventoryAudit() {
  const publicDir = path.resolve(__dirname, '../client/public');
  const productImagesDir = path.join(publicDir, 'product-images');
  const brandDir = path.join(publicDir, 'brand');

  console.log('====================================================');
  console.log('EVERYBAZAAR PRODUCT IMAGERY & MEDIA INVENTORY AUDIT');
  console.log('====================================================\n');

  const productImages = scanImageDirectory(productImagesDir);
  const brandImages = scanImageDirectory(brandDir);

  console.log(`Audited ${productImages.length} dedicated product photographs:`);
  let zeroByteCount = 0;
  for (const img of productImages) {
    if (img.sizeBytes === 0) {
      console.error(`  ❌ EMPTY: ${img.relativePath}`);
      zeroByteCount++;
    } else {
      console.log(`  ✓ ${img.relativePath} (${img.format}, ${(img.sizeBytes / 1024).toFixed(1)} KB)`);
    }
  }

  console.log(`\nAudited ${brandImages.length} brand & placeholder assets:`);
  for (const img of brandImages) {
    console.log(`  ✓ ${img.relativePath} (${img.format}, ${(img.sizeBytes / 1024).toFixed(1)} KB)`);
  }

  const placeholderExists = fs.existsSync(path.join(brandDir, 'product-placeholder.svg'));
  console.log('\n--- Neutral Branded Placeholder Verification ---');
  if (placeholderExists) {
    console.log('✅ PASS: /brand/product-placeholder.svg exists and is ready for uncatalogued products.');
  } else {
    console.error('❌ FAIL: /brand/product-placeholder.svg is missing.');
  }

  console.log('\n====================================================');
  console.log(`AUDIT SUMMARY: ${productImages.length + brandImages.length} total assets verified, ${zeroByteCount} broken.`);
  console.log('====================================================');

  return {
    totalProductAssets: productImages.length,
    totalBrandAssets: brandImages.length,
    zeroByteCount,
    placeholderExists
  };
}

if (require.main === module) {
  runMediaInventoryAudit();
}
