const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9225;
const ARTIFACT_DIR = 'C:\\Users\\Ayush\\.gemini\\antigravity\\brain\\16181c86-8929-4042-9db6-72d5e4908b5b';
const DOCS_DIR = path.resolve(__dirname, '../docs/screenshots');

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

function saveScreenshot(base64Data, filename) {
  const buf = Buffer.from(base64Data, 'base64');
  fs.writeFileSync(path.join(ARTIFACT_DIR, filename), buf);
  fs.writeFileSync(path.join(DOCS_DIR, filename), buf);
  console.log(`✓ Saved screenshot: ${filename}`);
}

async function run() {
  if (!fs.existsSync(DOCS_DIR)) fs.mkdirSync(DOCS_DIR, { recursive: true });

  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    `--remote-debugging-port=${PORT}`,
    '--user-data-dir=' + path.resolve(__dirname, '../.chrome_tara_tmp'),
    'http://localhost:5173'
  ]);

  console.log('🚀 Launched Chrome on port', PORT);
  await delay(3000);

  try {
    const list = await fetchJson(`http://127.0.0.1:${PORT}/json/list`);
    const page = list.find((p) => p.type === 'page');
    if (!page || !page.webSocketDebuggerUrl) throw new Error('No target page debugger URL found');

    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve);
      ws.addEventListener('error', reject);
    });

    let msgId = 1;
    function send(method, params = {}) {
      return new Promise((resolve) => {
        const id = msgId++;
        const handler = (evt) => {
          const res = JSON.parse(evt.data);
          if (res.id === id) {
            ws.removeEventListener('message', handler);
            resolve(res.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    // 1. Desktop Viewport
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 850,
      deviceScaleFactor: 1,
      mobile: false
    });

    await send('Page.navigate', { url: 'http://localhost:5173' });
    await delay(3500);

    // Screenshot 1: Desktop Homepage with Brand Ribbon and Ask Tara button
    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    saveScreenshot(shot1.data, 'homepage_tara_branding.png');

    // Screenshot 2: Click "✨ Ask Tara" floating button to open Assistant Modal
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const taraBtn = btns.find(b => b.textContent && b.textContent.includes('Ask Tara'));
          if (taraBtn) {
            taraBtn.click();
            return true;
          }
          return false;
        })()
      `
    });
    await delay(1200);

    // Switch to "Ask Tara Chat" tab inside modal to show welcome message
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const chatTab = btns.find(b => b.textContent && b.textContent.includes('Ask Tara Chat'));
          if (chatTab) {
            chatTab.click();
            return true;
          }
          return false;
        })()
      `
    });
    await delay(1000);

    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    saveScreenshot(shot2.data, 'tara_assistant_modal_opened.png');

    // Close the modal
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const closeBtn = document.querySelector('div[role="dialog"] button, .fixed.inset-0 button');
          if (closeBtn) closeBtn.click();
        })()
      `
    });
    await delay(800);

    // Screenshot 3: Scroll down to Website Footer Branding
    await send('Runtime.evaluate', {
      expression: `window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' })`
    });
    await delay(1000);

    const shot3 = await send('Page.captureScreenshot', { format: 'png' });
    saveScreenshot(shot3.data, 'website_footer_branding.png');

    // Screenshot 4: Mobile Viewport
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await send('Runtime.evaluate', { expression: `window.scrollTo({ top: 0, behavior: 'instant' })` });
    await delay(1200);

    const shot4 = await send('Page.captureScreenshot', { format: 'png' });
    saveScreenshot(shot4.data, 'mobile_tara_branding.png');

    ws.close();
    console.log('🎉 Successfully captured all Tara and Branding evidence screenshots!');
  } finally {
    chromeProc.kill();
  }
}

run().catch((err) => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});
