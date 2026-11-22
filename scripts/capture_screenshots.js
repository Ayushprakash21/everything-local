const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9222;

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

  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    `--remote-debugging-port=${PORT}`,
    '--user-data-dir=' + path.resolve(__dirname, '../.chrome_tmp'),
    'http://localhost:5173'
  ]);

  console.log('Launched Chrome on port', PORT);
  await delay(2500);

  try {
    const list = await fetchJson(`http://127.0.0.1:${PORT}/json/list`);
    console.log('Pages found:', list.length);
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

    // Wait for Vite React application and store data to fully render
    await delay(4000);

    // 1. Capture Homepage
    const homeShot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(
      path.join(screenshotsDir, 'homepage_redesigned.png'),
      Buffer.from(homeShot.data, 'base64')
    );
    console.log('Saved homepage_redesigned.png');

    // 2. Open the Location Modal by clicking the location selector button
    await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.querySelector('button[title*="delivery location"]');
        if (btn) btn.click();
      })()`
    });

    await delay(1500);

    // Capture Location Modal
    const modalShot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(
      path.join(screenshotsDir, 'location_modal_redesigned.png'),
      Buffer.from(modalShot.data, 'base64')
    );
    console.log('Saved location_modal_redesigned.png');

    // 3. Mobile Viewport (390x844)
    await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const closeBtn = document.querySelector('button[aria-label="Close"]');
        if (closeBtn) closeBtn.click();
      })()`
    });
    await delay(500);

    await sendCommand('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await delay(1000);

    const mobileShot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(
      path.join(screenshotsDir, 'mobile_customer_view.png'),
      Buffer.from(mobileShot.data, 'base64')
    );
    console.log('Saved mobile_customer_view.png');

    ws.close();
  } catch (err) {
    console.error('Screenshot error:', err);
  } finally {
    chromeProc.kill();
  }
}

run();
