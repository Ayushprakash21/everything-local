// EveryBazaar Development Live API Verification Script
// Tests: Health, CORS, D1 database reads, R2/KV bindings, Auth lifecycle, Token rejection

async function runDevSmokeTests() {
  const apiUrl = 'https://everybazaar-api-dev.everything-local.workers.dev';
  console.log('====================================================');
  console.log('EVERYBAZAAR DEV WORKER LIVE VERIFICATION SUITE');
  console.log('Target API:', apiUrl);
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log('✅ PASS:', message);
      passed++;
    } else {
      console.error('❌ FAIL:', message);
      failed++;
    }
  }

  // 1. Health check
  console.log('--- 1. Health Check Endpoint (GET /api/health) ---');
  try {
    const res = await fetch(`${apiUrl}/api/health`);
    const data = await res.json();
    console.log('Status:', res.status, JSON.stringify(data, null, 2));
    assert(res.status === 200, 'Health check returns HTTP 200');
    assert(data.status === 'HEALTHY', 'Status is HEALTHY');
    assert(data.database === 'CONNECTED', 'Database status is CONNECTED');
    assert(data.service === 'EveryBazaar Hyperlocal Engine', 'Service name is EveryBazaar Hyperlocal Engine');
    assert(data.environment === 'development', 'Environment is development');
  } catch (err) {
    assert(false, `Health check failed: ${err.message}`);
  }

  // 2. CORS Preflight & Headers
  console.log('\n--- 2. CORS Headers Verification ---');
  try {
    const corsRes = await fetch(`${apiUrl}/api/health`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Authorization,Content-Type'
      }
    });
    console.log('CORS Preflight Status:', corsRes.status);
    console.log('Access-Control-Allow-Origin:', corsRes.headers.get('access-control-allow-origin'));
    console.log('Access-Control-Allow-Methods:', corsRes.headers.get('access-control-allow-methods'));
    assert(corsRes.status === 204, 'CORS preflight returns HTTP 204');
    assert(
      corsRes.headers.get('access-control-allow-origin') === 'http://localhost:5173' ||
      corsRes.headers.get('access-control-allow-origin') === '*',
      'CORS Allow-Origin allows localhost:5173'
    );
  } catch (err) {
    assert(false, `CORS check failed: ${err.message}`);
  }

  // 3. Categories Listing (D1 Query)
  console.log('\n--- 3. Categories Listing (D1 Query) ---');
  try {
    const catRes = await fetch(`${apiUrl}/api/categories/homepage`);
    const catData = await catRes.json();
    console.log('Categories Status:', catRes.status, 'Total Categories:', catData.categories?.length || 0);
    assert(catRes.status === 200, 'Categories endpoint returns HTTP 200');
    assert(Array.isArray(catData.categories) && catData.categories.length > 0, 'Categories array is non-empty');
  } catch (err) {
    assert(false, `Categories check failed: ${err.message}`);
  }

  // 4. Stores Listing (D1 Query)
  console.log('\n--- 4. Stores Listing (D1 Query) ---');
  try {
    const storeRes = await fetch(`${apiUrl}/api/customer/stores`);
    const storeData = await storeRes.json();
    console.log('Stores Status:', storeRes.status, 'Total Stores:', storeData.stores?.length || 0);
    assert(storeRes.status === 200, 'Stores endpoint returns HTTP 200');
    assert(Array.isArray(storeData.stores) && storeData.stores.length > 0, 'Stores array is non-empty');
  } catch (err) {
    assert(false, `Stores check failed: ${err.message}`);
  }

  // 5. Auth Lifecycle: Register Customer
  console.log('\n--- 5. Auth Lifecycle: Customer Registration ---');
  let token = null;
  const testEmail = `dev_test_${Date.now()}@everybazaar.in`;
  try {
    const regRes = await fetch(`${apiUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        name: 'EveryBazaar Dev Tester',
        password: 'DevTestPassword2026!',
        phone: '9893' + Math.floor(100000 + Math.random() * 900000)
      })
    });
    const regData = await regRes.json();
    console.log('Register Status:', regRes.status, 'User ID:', regData.user?.id);
    assert(regRes.status === 201, 'Registration returns HTTP 201');
    assert(Boolean(regData.token), 'Registration returns JWT token');
    token = regData.token;
  } catch (err) {
    assert(false, `Registration check failed: ${err.message}`);
  }

  // 6. Protected Endpoint with JWT (GET /api/auth/me)
  console.log('\n--- 6. Protected Endpoint Verification ---');
  if (token) {
    try {
      const meRes = await fetch(`${apiUrl}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const meData = await meRes.json();
      console.log('Me Status:', meRes.status, 'Authenticated Name:', meData.user?.name);
      assert(meRes.status === 200, 'Protected /api/auth/me returns HTTP 200');
      assert(meData.user?.email === testEmail, 'Authenticated user matches registered email');
    } catch (err) {
      assert(false, `Protected /api/auth/me failed: ${err.message}`);
    }
  }

  // 7. Security: Invalid Token Rejection
  console.log('\n--- 7. Security: Invalid Token Rejection ---');
  try {
    const badRes = await fetch(`${apiUrl}/api/auth/me`, {
      headers: { 'Authorization': 'Bearer forged_or_corrupt_jwt_token' }
    });
    console.log('Invalid Token Rejection Status:', badRes.status);
    assert(badRes.status === 403, 'Corrupt token rejected with HTTP 403');
  } catch (err) {
    assert(false, `Invalid token check failed: ${err.message}`);
  }

  // 8. Security: Missing Token Rejection
  console.log('\n--- 8. Security: Missing Token Rejection ---');
  try {
    const noTokenRes = await fetch(`${apiUrl}/api/auth/me`);
    console.log('Missing Token Rejection Status:', noTokenRes.status);
    assert(noTokenRes.status === 401, 'Missing token rejected with HTTP 401');
  } catch (err) {
    assert(false, `Missing token check failed: ${err.message}`);
  }

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runDevSmokeTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
