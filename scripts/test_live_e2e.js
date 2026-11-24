async function runSmokeTests() {
  const webUrl = 'https://everything-local-web.everything-local.workers.dev';
  const apiUrl = 'https://everything-local-api.everything-local.workers.dev';

  console.log('====================================================');
  console.log('LIVE END-TO-END SMOKE TEST SUITE');
  console.log('====================================================\n');

  // 1. Website Homepage
  console.log('--- 1. Website Homepage Root (GET /) ---');
  const webRes = await fetch(webUrl);
  const webText = await webRes.text();
  console.log('Status:', webRes.status);
  console.log('Contains <div id="root">:', webText.includes('id="root"'));
  console.log('HTML length:', webText.length);

  // 2. Static Assets
  console.log('\n--- 2. Static Assets Delivery ---');
  const cssMatch = webText.match(/href="([^"]+\.css)"/);
  const jsMatch = webText.match(/src="([^"]+\.js)"/);

  if (cssMatch) {
    const cssRes = await fetch(webUrl + cssMatch[1]);
    console.log('CSS Asset (' + cssMatch[1] + '):', cssRes.status, cssRes.headers.get('content-type'));
  }
  if (jsMatch) {
    const jsRes = await fetch(webUrl + jsMatch[1]);
    console.log('JS Asset (' + jsMatch[1] + '):', jsRes.status, jsRes.headers.get('content-type'));
  }

  // Static product image
  const imgRes = await fetch(webUrl + '/product-images/snacks-beverages/indori-sev.webp');
  console.log('Product Image (/product-images/snacks-beverages/indori-sev.webp):', imgRes.status, imgRes.headers.get('content-type'), imgRes.headers.get('content-length'), 'bytes');

  // 3. SPA Client-Side Fallback Routes
  console.log('\n--- 3. SPA Fallback Client Routes ---');
  const spaRoutes = ['/merchant', '/onboarding', '/customer/orders'];
  for (const r of spaRoutes) {
    const rRes = await fetch(webUrl + r);
    const rText = await rRes.text();
    console.log('Route ' + r + ':', rRes.status, 'Serves SPA index.html:', rText.includes('id="root"'));
  }

  // 4. API Health Check & D1
  console.log('\n--- 4. API Health & D1 Connectivity ---');
  const hRes = await fetch(apiUrl + '/api/health');
  const hJson = await hRes.json();
  console.log('API /api/health:', hRes.status, hJson);

  // 5. Stores Listing
  console.log('\n--- 5. API Stores Listing ---');
  const sRes = await fetch(apiUrl + '/api/customer/stores');
  const sJson = await sRes.json();
  console.log('API /api/customer/stores:', sRes.status, 'Total Stores:', sJson.stores?.length || 0);

  // 6. Products Listing
  console.log('\n--- 6. API Products Listing ---');
  const pRes = await fetch(apiUrl + '/api/customer/products');
  const pJson = await pRes.json();
  console.log('API /api/customer/products:', pRes.status, 'Total Products:', pJson.products?.length || 0);

  // 7. Full Auth Lifecycle (Register -> Me -> Invalid Token)
  console.log('\n--- 7. Full Auth Lifecycle ---');
  const email = 'e2e_' + Date.now() + '@everythinglocal.in';
  const regRes = await fetch(apiUrl + '/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      name: 'E2E Verified Customer',
      password: 'ProdPassword2026!',
      phone: '98260' + Math.floor(10000 + Math.random() * 90000)
    })
  });
  const regJson = await regRes.json();
  console.log('Register Status:', regRes.status, 'Created ID:', regJson.user ? regJson.user.id : 'N/A');

  const meRes = await fetch(apiUrl + '/api/auth/me', {
    headers: { 'Authorization': 'Bearer ' + regJson.token }
  });
  console.log('Protected /api/auth/me Status:', meRes.status, 'User Name:', (await meRes.json()).user?.name);

  const badTokenRes = await fetch(apiUrl + '/api/auth/me', {
    headers: { 'Authorization': 'Bearer corrupt_signature' }
  });
  console.log('Invalid Token Rejection Status:', badTokenRes.status);

  // 8. CORS Headers Verification
  console.log('\n--- 8. CORS Preflight & Headers ---');
  const corsRes = await fetch(apiUrl + '/api/health', {
    method: 'OPTIONS',
    headers: {
      'Origin': 'https://everything-local-web.everything-local.workers.dev',
      'Access-Control-Request-Method': 'GET'
    }
  });
  console.log('CORS Preflight Status:', corsRes.status);
  console.log('Access-Control-Allow-Origin:', corsRes.headers.get('access-control-allow-origin'));
  console.log('Access-Control-Allow-Methods:', corsRes.headers.get('access-control-allow-methods'));
}

runSmokeTests().catch(console.error);
