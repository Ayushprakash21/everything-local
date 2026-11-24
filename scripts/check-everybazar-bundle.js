async function test() {
  const r = await fetch('https://everybazar.everything-local.workers.dev/assets/index-CK5pzDi1.js');
  console.log('index-CK5pzDi1.js status:', r.status);
  const text = await r.text();
  console.log('Size:', text.length);
  const matches = text.match(/https?:\/\/[a-zA-Z0-9.-]+\.workers\.dev[^\s"']*/g);
  console.log('API URLs:', matches ? [...new Set(matches)] : 'None');
  console.log('Contains EveryBazaar:', text.includes('EveryBazaar'));
  console.log('Contains Everything Local:', text.includes('Everything Local'));
}
test();
