const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9223;
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
    '--user-data-dir=' + path.resolve(__dirname, '../.chrome_imagery_tmp'),
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
      width: 1366,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    // Seed location in localStorage so stores and products load immediately
    await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        localStorage.setItem('everything_local_location', JSON.stringify({
          label: 'Old Palasia, Indore',
          address: 'Old Palasia, Indore, MP',
          latitude: 22.75,
          longitude: 75.89
        }));
        window.location.reload();
      })()`
    });

    console.log('Reloading with Palasia, Indore location...');
    await delay(4500);

    // 1. Capture Category Staples Diversity Grid (showing Atta, Rice, Toor Dal, Moong Dal, Chana Dal, Rajma, Oils, etc.)
    await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        // Scroll to category discovery / product cards
        const elem = document.querySelector('section#category-discovery-section') || document.querySelector('.grid');
        if (elem) elem.scrollIntoView({ behavior: 'instant', block: 'center' });
      })()`
    });
    await delay(1500);

    const staplesGridShot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    saveScreenshot(staplesGridShot.data, 'category_staples_diversity.png');

    // 2. Click a specific product card (e.g. Toor Dal or Atta) to open ProductDetailModal
    await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const cards = Array.from(document.querySelectorAll('div[class*="group relative bg-white"]'));
        const target = cards.find(c => c.textContent.includes('Dal') || c.textContent.includes('Atta') || c.textContent.includes('Rice')) || cards[0];
        if (target) target.click();
      })()`
    });
    await delay(1500);

    const modalShot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    saveScreenshot(modalShot.data, 'product_detail_modal_verified.png');

    // Close modal
    await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const closeBtn = document.querySelector('button[class*="rounded-full"][class*="hover:bg-slate-100"]');
        if (closeBtn) closeBtn.click();
      })()`
    });
    await delay(1000);

    // 3. Search for "Dal" to demonstrate distinct pulse imagery
    await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const input = document.querySelector('input[placeholder*="Search for products"]');
        if (input) {
          input.value = 'Dal';
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      })()`
    });
    await delay(2000);

    const searchDalShot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    saveScreenshot(searchDalShot.data, 'search_dal_diversity.png');

    // Clear search
    await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const input = document.querySelector('input[placeholder*="Search for products"]');
        if (input) {
          input.value = '';
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      })()`
    });
    await delay(1000);

    // 4. Add 2 distinct products to cart and open cart drawer
    await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const addBtns = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.trim() === 'ADD');
        if (addBtns.length > 0) addBtns[0].click();
        if (addBtns.length > 1) addBtns[1].click();
      })()`
    });
    await delay(1500);

    // Open Cart Drawer
    await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const cartBtn = document.querySelector('button[aria-label="View Cart"]') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Cart') || b.querySelector('svg'));
        if (cartBtn) cartBtn.click();
      })()`
    });
    await delay(2000);

    const cartShot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    saveScreenshot(cartShot.data, 'cart_drawer_distinct_items.png');

    console.log('🎉 All browser evidence screenshots successfully captured!');
    ws.close();
  } catch (err) {
    console.error('Screenshot capture error:', err);
  } finally {
    chromeProc.kill();
  }
}

run();
