async function runFullVerification() {
  const base = 'https://everybazar.everything-local.workers.dev';
  const checks = [];

  // Check 1: Homepage HTTP 200
  const r1 = await fetch(base + '/');
  checks.push({ check: 'Homepage HTTP 200', pass: r1.status === 200, status: r1.status });

  // Check 2: EveryBazaar branding
  const html = await r1.text();
  const hasBranding = html.includes('EveryBazaar | Shop more. Save more. Live better.');
  checks.push({ check: 'EveryBazaar Branding in Title', pass: hasBranding });

  // Check 3: React root mount point
  checks.push({ check: 'React Root Element in HTML', pass: html.includes('id="root"') });

  // Check 4: CSS bundle
  const cssMatch = html.match(/\/assets\/index-[^"']+\.css/);
  const rCss = cssMatch ? await fetch(base + cssMatch[0]) : null;
  const cssLen = rCss ? (await rCss.text()).length : 0;
  checks.push({ check: 'CSS Bundle HTTP 200', pass: rCss && rCss.status === 200, status: rCss ? rCss.status : 0, size: cssLen });

  // Check 5: JS bundle
  const jsMatch = html.match(/\/assets\/index-[^"']+\.js/);
  const rJs = jsMatch ? await fetch(base + jsMatch[0]) : null;
  const jsLen = rJs ? (await rJs.text()).length : 0;
  checks.push({ check: 'JS Bundle HTTP 200', pass: rJs && rJs.status === 200, status: rJs ? rJs.status : 0, size: jsLen });

  // Check 6: SVG Favicon
  const rFav = await fetch(base + '/brand/everybazaar-favicon.svg');
  checks.push({ check: 'Favicon SVG HTTP 200', pass: rFav.status === 200, status: rFav.status });

  // Check 7: Brand Logo SVG
  const rLogo = await fetch(base + '/brand/everybazaar-logo-horizontal.svg');
  checks.push({ check: 'Horizontal Logo SVG HTTP 200', pass: rLogo.status === 200, status: rLogo.status });

  // Check 8: Category Placeholder SVG
  const rPl = await fetch(base + '/brand/placeholders/grocery.svg');
  checks.push({ check: 'Category Placeholder SVG HTTP 200', pass: rPl.status === 200, status: rPl.status });

  // Check 9: SPA Nested Route handling
  const rNested = await fetch(base + '/categories/fruits-vegetables');
  const nestedText = await rNested.text();
  checks.push({ check: 'SPA Nested Route HTTP 200 without 404', pass: rNested.status === 200 && nestedText.includes('id="root"') });

  // Check 10: Production API connectivity
  const rApi = await fetch('https://everything-local-api.everything-local.workers.dev/api/health', {
    headers: { 'Origin': base }
  });
  checks.push({ check: 'Production API Health HTTP 200', pass: rApi.status === 200 });

  // Check 11: Production API CORS header
  const corsOrigin = rApi.headers.get('access-control-allow-origin');
  checks.push({ check: 'Production API CORS Allows everybazar', pass: corsOrigin === base, corsOrigin });

  // Check 12: Production Store Discovery
  const rStores = await fetch('https://everything-local-api.everything-local.workers.dev/api/customer/stores?lat=22.7244&lng=75.8839', {
    headers: { 'Origin': base }
  });
  const storesData = await rStores.json();
  const storeCount = storesData.stores ? storesData.stores.length : 0;
  checks.push({ check: 'Customer Stores API HTTP 200 & Non-Empty', pass: rStores.status === 200 && storeCount > 0, storeCount });

  console.log(JSON.stringify(checks, null, 2));
  const allPassed = checks.every(c => c.pass);
  console.log('\n========================================');
  console.log('ALL 12 PRODUCTION CHECKS PASSED:', allPassed);
  console.log('========================================');
  if (!allPassed) process.exit(1);
}
runFullVerification().catch(e => { console.error(e); process.exit(1); });
