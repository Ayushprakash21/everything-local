async function test() {
  const r = await fetch('https://everybazaar-api-dev.everything-local.workers.dev/api/customer/stores', {
    method: 'GET',
    headers: {
      'Origin': 'https://everything-local-web.everything-local.workers.dev'
    }
  });
  console.log('Status:', r.status);
  console.log('Access-Control-Allow-Origin:', r.headers.get('access-control-allow-origin'));
  console.log('Access-Control-Allow-Credentials:', r.headers.get('access-control-allow-credentials'));
  const text = await r.text();
  console.log('Stores count:', JSON.parse(text).stores?.length);
}
test();
