const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9224;

async function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function run() {
  const screenshotsDir = path.resolve(__dirname, '../docs/screenshots');
  const chromeTmp = path.resolve(__dirname, '../.chrome_pending_tmp');
  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    `--remote-debugging-port=${PORT}`,
    '--user-data-dir=' + chromeTmp,
    'http://localhost:5173'
  ]);

  console.log('Launched Chrome on port', PORT);
  await delay(2500);

  try {
    const list = await fetchJson(`http://127.0.0.1:${PORT}/json/list`);
    const page = list.find((p) => p.type === 'page');
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve);
      ws.addEventListener('error', reject);
    });

    let msgId = 1;
    function sendCommand(method, params = {}) {
      return new Promise((resolve) => {
        const id = msgId++;
        const handler = (event) => {
          const parsed = JSON.parse(event.data);
          if (parsed.id === id) {
            ws.removeEventListener('message', handler);
            resolve(parsed.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await sendCommand('Page.enable');
    await sendCommand('DOM.enable');
    await sendCommand('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    // Navigate first
    await sendCommand('Page.navigate', { url: 'http://localhost:5173' });
    await delay(3000);

    // Register a pending merchant via fetch in page
    const registerResult = await sendCommand('Runtime.evaluate', {
      expression: `(async () => {
        const email = 'pending.retailer.' + Date.now() + '@everythinglocal.in';
        const res = await fetch('http://localhost:4000/api/auth/register-merchant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Sunil Verma',
            email,
            phone: '98260' + Math.floor(10000 + Math.random() * 90000),
            password: 'Password@123',
            businessName: 'Verma Kirana & General Store',
            category: 'Grocery & Daily Staples',
            addressLine: 'Shop 4, Annapurna Main Road',
            locality: 'Annapurna & Sudama Nagar',
            city: 'Indore',
            pincode: '452009'
          })
        });
        const data = await res.json();
        localStorage.setItem('el_token', data.token);
        location.reload();
        return data;
      })()`,
      awaitPromise: true
    });

    console.log('Registered pending merchant:', registerResult);
    await delay(3500);

    // Navigate to Merchant console
    await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const merchantBtn = buttons.find(b => b.innerText.includes('Merchant'));
        if (merchantBtn) merchantBtn.click();
      })()`
    });
    await delay(2500);

    const pendingShot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(
      path.join(screenshotsDir, 'merchant_pending_approval.png'),
      Buffer.from(pendingShot.data, 'base64')
    );
    console.log('Saved merchant_pending_approval.png');

    ws.close();
  } finally {
    chromeProc.kill('SIGKILL');
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
