const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9223;

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
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const chromeTmp = path.resolve(__dirname, '../.chrome_merchant_tmp');
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
    if (!page || !page.webSocketDebuggerUrl) {
      throw new Error('No target page debugger URL found');
    }

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

    // Explicitly navigate to the Vite frontend
    await sendCommand('Page.navigate', { url: 'http://localhost:5173' });
    await delay(3500);

    // Clear any residual localStorage and reload
    await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        localStorage.removeItem('el_token');
        location.reload();
      })()`
    });

    await delay(3500);

    // 1. Navigate to Merchant Portal
    console.log('Navigating to Merchant console...');
    await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const merchantBtn = buttons.find(b => b.innerText.includes('Merchant'));
        if (merchantBtn) merchantBtn.click();
      })()`
    });
    await delay(2000);

    // Capture 1: Merchant Login View
    const loginShot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(
      path.join(screenshotsDir, 'merchant_login_portal.png'),
      Buffer.from(loginShot.data, 'base64')
    );
    console.log('Saved merchant_login_portal.png');

    // 2. Click "Register New Store" Tab
    console.log('Switching to Register New Store tab...');
    await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const regBtn = buttons.find(b => b.innerText.includes('Register New Store'));
        if (regBtn) regBtn.click();
      })()`
    });
    await delay(1500);

    // Capture 2: Merchant Registration View
    const registerShot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(
      path.join(screenshotsDir, 'merchant_registration_flow.png'),
      Buffer.from(registerShot.data, 'base64')
    );
    console.log('Saved merchant_registration_flow.png');

    // 3. Switch back to Login and click "One-Click Login: Sharma Kirana Store"
    console.log('Clicking Demo Merchant Login...');
    await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const loginTab = buttons.find(b => b.innerText.includes('Sign In to Store'));
        if (loginTab) loginTab.click();
      })()`
    });
    await delay(1000);

    await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const demoBtn = buttons.find(b => b.innerText.includes('Sharma Kirana'));
        if (demoBtn) demoBtn.click();
      })()`
    });
    await delay(3500);

    // Capture 3: Verified Merchant Dashboard
    const dashboardShot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(
      path.join(screenshotsDir, 'merchant_dashboard_verified.png'),
      Buffer.from(dashboardShot.data, 'base64')
    );
    console.log('Saved merchant_dashboard_verified.png');

    // 4. Click Catalogue tab in Merchant Dashboard
    await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const catBtn = buttons.find(b => b.innerText.includes('Catalogue') || b.innerText.includes('Products'));
        if (catBtn) catBtn.click();
      })()`
    });
    await delay(1500);

    const catalogueShot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(
      path.join(screenshotsDir, 'merchant_catalogue_management.png'),
      Buffer.from(catalogueShot.data, 'base64')
    );
    console.log('Saved merchant_catalogue_management.png');

    ws.close();
  } finally {
    chromeProc.kill('SIGKILL');
    console.log('Closed Chrome.');
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
