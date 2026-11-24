async function verifyEverybazarLive() {
  console.log('--- VERIFYING LIVE EVERYBAZAR WEBSITE ---');
  const base = 'https://everybazar.everything-local.workers.dev';

  // 1. Root Homepage
  const res = await fetch(base + '/');
  console.log('1. Homepage HTTP Status:', res.status);
  console.log('   Content-Type:', res.headers.get('content-type'));
  const html = await res.text();
  const hasTitle = html.includes('EveryBazaar | Shop more. Save more. Live better.');
  console.log('2. EveryBazaar Title Present:', hasTitle);

  // 2. Extract Assets
  const jsMatch = html.match(/\/assets\/index-[a-zA-Z0-9_\-]+\.js/);
  const cssMatch = html.match(/\/assets\/index-[a-zA-Z0-9_\-]+\.css/);
  console.log('3. Script Tag Found:', jsMatch ? jsMatch[0] : 'NONE');
  console.log('4. Style Tag Found:', cssMatch ? cssMatch[0] : 'NONE');

  if (jsMatch) {
    const jsRes = await fetch(base + jsMatch[0]);
    const jsText = await jsRes.text();
    console.log('5. JS Bundle Status:', jsRes.status, 'Size:', jsText.length, 'bytes');
  }

  if (cssMatch) {
    const cssRes = await fetch(base + cssMatch[0]);
    const cssText = await cssRes.text();
    console.log('6. CSS Bundle Status:', cssRes.status, 'Size:', cssText.length, 'bytes');
  }

  // 3. SPA Routing on Nested Paths
  const nested = await fetch(base + '/categories/produce');
  const nestedHtml = await nested.text();
  console.log('7. Nested Route /categories/produce Status:', nested.status);
  console.log('   Correctly serves SPA HTML:', nestedHtml.includes('id="root"'));

  // 4. Favicon and SVGs
  const fav = await fetch(base + '/brand/everybazaar-favicon.svg');
  console.log('8. Favicon SVG Status:', fav.status, 'Content-Type:', fav.headers.get('content-type'));

  // 5. Production API Connectivity & CORS
  const apiTest = await fetch('https://everything-local-api.everything-local.workers.dev/api/health', {
    headers: { 'Origin': base }
  });
  console.log('9. Production API /api/health Status:', apiTest.status);
  const apiJson = await apiTest.json();
  console.log('   API Service Name:', apiJson.service);

  console.log('--- ALL VERIFICATIONS FINISHED ---');
}

verifyEverybazarLive().catch(err => {
  console.error('VERIFICATION ERROR:', err);
  process.exit(1);
});
