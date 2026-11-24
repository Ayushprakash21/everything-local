async function test() {
  const r = await fetch('https://everything-local-web.everything-local.workers.dev/assets/index-B1Z3oV1V.js');
  console.log('index-B1Z3oV1V.js status:', r.status);
  const text = await r.text();
  console.log('Size:', text.length);
  const matches = text.match(/https?:\/\/[a-zA-Z0-9.-]+\.workers\.dev[^\s"']*/g);
  console.log('API URLs:', matches ? [...new Set(matches)] : 'None');
  console.log('Contains /api:', text.includes('/api'));
  console.log('Contains /customer/stores:', text.includes('/customer/stores'));
}
test();
