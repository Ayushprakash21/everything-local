const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9227;

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

  const chromeTmp = path.resolve(__dirname, '../.chrome_pharmacy_session2');
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
    ws.addEventListener('message', (event) => {
      const parsed = JSON.parse(event.data);
      if (parsed.method === 'Runtime.exceptionThrown') {
        console.error('PAGE EXCEPTION:', JSON.stringify(parsed.params.exceptionDetails));
      }
    });
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

    async function waitForCondition(expr, maxWait = 12000) {
      const start = Date.now();
      while (Date.now() - start < maxWait) {
        const res = await sendCommand('Runtime.evaluate', { expression: expr });
        if (res && res.result && res.result.value) return true;
        await delay(300);
      }
      return false;
    }

    async function clickButtonWithText(txt) {
      return await sendCommand('Runtime.evaluate', {
        expression: `(() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const target = btns.find(b => b.innerText.toLowerCase().includes("${txt.toLowerCase()}"));
          if (target) {
            target.click();
            return true;
          }
          return false;
        })()`
      });
    }

    await sendCommand('Page.enable');
    await sendCommand('DOM.enable');
    await sendCommand('Runtime.enable');
    await sendCommand('Emulation.setDeviceMetricsOverride', {
      width: 1366,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    console.log('Navigating to http://localhost:5173 ...');
    await sendCommand('Page.navigate', { url: 'http://localhost:5173' });
    await delay(2000);

    // Seed default location in localStorage so modal doesn't popup
    await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        localStorage.setItem('everything_local_selected_location', JSON.stringify({
          id: 'indore-palasia',
          name: 'Palasia, Indore',
          locality: 'Palasia',
          city: 'Indore',
          state: 'Madhya Pradesh',
          pincode: '452001',
          latitude: 22.7244,
          longitude: 75.8839,
          isServiceable: true
        }));
        location.reload();
      })()`
    });

    await delay(3500);
    await waitForCondition(`Boolean(document.querySelector('header'))`);

    // 1. Switch to Pharmacy mode
    console.log('Switching to Pharmacy discovery mode...');
    const click1 = await clickButtonWithText('Pharmacy');
    console.log('Click Pharmacy button result:', JSON.stringify(click1));
    await delay(3000);
    const bodyText1 = await sendCommand('Runtime.evaluate', { expression: 'document.body.innerText.slice(0, 300)' });
    console.log('Body text after clicking Pharmacy:', JSON.stringify(bodyText1));

    // Capture Screenshot 1: Pharmacy Homepage
    const rxHomeShot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(
      path.join(screenshotsDir, 'pharmacy_home.png'),
      Buffer.from(rxHomeShot.data, 'base64')
    );
    console.log('Saved pharmacy_home.png (size:', rxHomeShot.data.length, ')');

    // 2. Open Prescription Upload
    console.log('Opening Prescription Upload form...');
    await clickButtonWithText('Upload Prescription');
    await delay(2500);

    // Capture Screenshot 2: Prescription Upload Form
    const rxUploadShot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(
      path.join(screenshotsDir, 'pharmacy_rx_upload.png'),
      Buffer.from(rxUploadShot.data, 'base64')
    );
    console.log('Saved pharmacy_rx_upload.png (size:', rxUploadShot.data.length, ')');

    // 3. Customer Prescriptions Tracker
    console.log('Authenticating as Customer Ayush...');
    await sendCommand('Runtime.evaluate', {
      expression: `(async () => {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emailOrPhone: 'ayush@example.com', password: 'Password@123' })
        });
        const data = await res.json();
        if (data.token) {
          localStorage.setItem('el_token', data.token);
          localStorage.setItem('el_user', JSON.stringify(data.user));
          location.reload();
        }
      })()`
    });
    await delay(3500);
    await waitForCondition(`Boolean(document.querySelector('header'))`);

    // Re-select Pharmacy mode
    await clickButtonWithText('Pharmacy');
    await delay(1500);
    // Click "My Prescriptions"
    await clickButtonWithText('My Prescriptions');
    await delay(2500);

    // Capture Screenshot 3: Customer Prescriptions Tracker
    const myRxShot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(
      path.join(screenshotsDir, 'pharmacy_customer_prescriptions.png'),
      Buffer.from(myRxShot.data, 'base64')
    );
    console.log('Saved pharmacy_customer_prescriptions.png (size:', myRxShot.data.length, ')');

    // 4. Pharmacist Queue
    console.log('Authenticating as Registered Pharmacist Pooja...');
    await sendCommand('Runtime.evaluate', {
      expression: `(async () => {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emailOrPhone: 'pooja.pharmacist@everythinglocal.in', password: 'Password@123' })
        });
        const data = await res.json();
        if (data.token) {
          localStorage.setItem('el_token', data.token);
          localStorage.setItem('el_user', JSON.stringify(data.user));
          location.reload();
        }
      })()`
    });
    await delay(3500);
    await waitForCondition(`Boolean(document.querySelector('header'))`);

    await clickButtonWithText('Pharmacy');
    await delay(1500);
    await clickButtonWithText('Pharmacist Queue');
    await delay(2500);

    // Capture Screenshot 4: Pharmacist Verification Console
    const pharmacistShot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(
      path.join(screenshotsDir, 'pharmacy_pharmacist_console.png'),
      Buffer.from(pharmacistShot.data, 'base64')
    );
    console.log('Saved pharmacy_pharmacist_console.png (size:', pharmacistShot.data.length, ')');

    // 5. Admin Governance
    console.log('Authenticating as Admin...');
    await sendCommand('Runtime.evaluate', {
      expression: `(async () => {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emailOrPhone: 'admin@everythinglocal.in', password: 'Password@123' })
        });
        const data = await res.json();
        if (data.token) {
          localStorage.setItem('el_token', data.token);
          localStorage.setItem('el_user', JSON.stringify(data.user));
          location.reload();
        }
      })()`
    });
    await delay(3500);
    await waitForCondition(`Boolean(document.querySelector('header'))`);

    await clickButtonWithText('Admin');
    await delay(2000);
    await clickButtonWithText('Licensed Pharmacies');
    await delay(2500);

    // Capture Screenshot 5: Admin Pharmacy Governance
    const adminShot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(
      path.join(screenshotsDir, 'pharmacy_admin_governance.png'),
      Buffer.from(adminShot.data, 'base64')
    );
    console.log('Saved pharmacy_admin_governance.png (size:', adminShot.data.length, ')');

    console.log('🎉 All 5 Pharmacy Ecosystem screenshots captured successfully!');
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    try {
      chromeProc.kill();
    } catch (e) {}
  }
}

run();
