async function test() {
  try {
    const r = await fetch('https://everybazaar-api-dev.everything-local.workers.dev/api/customer/stores?lat=22.7196&lng=75.8577');
    console.log('everybazaar-api-dev status:', r.status);
    const text = await r.text();
    console.log('Response:', text.slice(0, 300));
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}
test();
