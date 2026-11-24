async function test() {
  const r = await fetch('https://everything-local-web.everything-local.workers.dev/assets/index-B1Z3oV1V.js');
  const text = await r.text();
  console.log('Contains Everything Local:', text.includes('Everything Local'));
  console.log('Contains EveryBazaar:', text.includes('EveryBazaar'));
  console.log('Contains 0 Retailers:', text.includes('0 Retailers'));
  console.log('Contains 100% LOCAL KIRANA NETWORK:', text.includes('100% LOCAL KIRANA NETWORK'));
}
test();
