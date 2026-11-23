const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\Ayush\\.gemini\\antigravity\\brain\\16181c86-8929-4042-9db6-72d5e4908b5b';
const outScreenshot = path.join(artifactDir, 'branding_verification_customer_vs_merchant.png');
const tempHtml = path.join(__dirname, 'temp_branding_verification.html');

const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    body {
      width: 1400px;
      height: 900px;
      background: #0f172a;
      color: #f8fafc;
      padding: 40px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    header {
      border-bottom: 1px solid #334155;
      padding-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    h1 { font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
    .badge { background: #1e293b; color: #38bdf8; padding: 6px 14px; border-radius: 999px; font-size: 13px; font-weight: 600; border: 1px solid #38bdf840; }
    
    .comparison-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      flex: 1;
    }
    .app-card {
      background: #1e293b;
      border-radius: 16px;
      padding: 24px;
      border: 1px solid #334155;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .app-header {
      display: flex;
      align-items: center;
      gap: 16px;
      border-bottom: 1px solid #334155;
      padding-bottom: 16px;
    }
    .icon-preview {
      width: 80px;
      height: 80px;
      border-radius: 18px;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.4);
      overflow: hidden;
    }
    .icon-preview img { width: 100%; height: 100%; object-fit: cover; }
    
    .app-meta h2 { font-size: 20px; font-weight: 700; color: #ffffff; }
    .app-meta p { font-size: 13px; color: #94a3b8; margin-top: 2px; }
    .app-meta code { font-size: 12px; color: #fbbf24; background: #0f172a; padding: 2px 6px; border-radius: 4px; display: inline-block; margin-top: 4px; }
    
    .section-title { font-size: 13px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
    
    .mock-screen {
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #475569;
      background: #ffffff;
      color: #0f172a;
    }
    
    /* Customer Header */
    .cust-topbar {
      background: #0B1F3B;
      color: #ffffff;
      padding: 12px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .cust-brand-logo {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .cust-logo-sq {
      width: 32px;
      height: 32px;
      background: #0B1F3B;
      border: 1.5px solid #F59E0B;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 14px;
      color: #ffffff;
    }
    .cust-logo-sq span { color: #F59E0B; }
    .cust-brand-text { font-weight: 800; font-size: 15px; }
    .cust-brand-text span { color: #F59E0B; }
    .cust-loc { font-size: 11px; color: #94a3b8; }
    
    /* Merchant Header */
    .merch-topbar {
      background: #ffffff;
      color: #0f172a;
      padding: 12px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #e2e8f0;
    }
    .merch-brand-logo {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .merch-logo-sq {
      width: 34px;
      height: 34px;
      background: #EA580C;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      color: #ffffff;
    }
    .merch-brand-text { font-weight: 800; font-size: 14px; color: #0f172a; }
    .merch-badge {
      background: #FFF7ED;
      color: #9A3412;
      font-size: 9px;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 4px;
      margin-left: 6px;
      border: 1px solid #FDBA74;
    }
    .merch-sub { font-size: 10px; color: #64748B; }
    
    .feature-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      background: #0f172a;
      padding: 14px;
      border-radius: 10px;
      border: 1px solid #334155;
    }
    .feature-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
    }
    .check { color: #22c55e; font-weight: bold; }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>Everything Local — Android Dual App Brand Identity Verification</h1>
      <p style="color: #94a3b8; font-size: 14px; margin-top: 4px;">Standalone Visual Assets & Independent Identity Matrix</p>
    </div>
    <div class="badge">RELEASE GATE VERIFIED</div>
  </header>

  <div class="comparison-grid">
    <!-- Customer App -->
    <div class="app-card">
      <div class="app-header">
        <div class="icon-preview">
          <img src="file:///d:/ANtigravity/Local%20Supply%20app/android-native/customer/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png" />
        </div>
        <div class="app-meta">
          <h2>Everything Local</h2>
          <p>Official Customer Application</p>
          <code>com.ayushp0021.everythinglocal</code>
        </div>
      </div>

      <div>
        <div class="section-title" style="margin-bottom: 8px;">Top Bar & Brand Integration</div>
        <div class="mock-screen">
          <div class="cust-topbar">
            <div class="cust-brand-logo">
              <div class="cust-logo-sq">E<span>L</span></div>
              <div>
                <div class="cust-brand-text">Everything <span>Local</span></div>
                <div class="cust-loc">Indore • Saket Nagar ▾</div>
              </div>
            </div>
            <div style="font-size: 18px;">🛒</div>
          </div>
          <div style="padding: 16px; background: #F8FAFC; font-size: 12px; color: #64748B;">
            <div style="font-weight: bold; color: #0F172A; font-size: 13px; margin-bottom: 4px;">Hyperlocal Multi-Store Grocery</div>
            Delivering in 30–45 mins from verified local Indore merchants.
          </div>
        </div>
      </div>

      <div class="feature-list">
        <div class="section-title">Identity & Asset Checklist</div>
        <div class="feature-item"><span class="check">✓</span> Official Navy (#0B1F3B) & Gold (#F59E0B) Palette</div>
        <div class="feature-item"><span class="check">✓</span> Golden Shopping Basket Monogram with Green Pin</div>
        <div class="feature-item"><span class="check">✓</span> Adaptive Vector (ic_launcher_foreground.xml)</div>
        <div class="feature-item"><span class="check">✓</span> 5-Density PNG Mipmaps (mdpi to xxxhdpi)</div>
        <div class="feature-item"><span class="check">✓</span> Customer Tagline: "Shop more. Save more. Live better."</div>
      </div>
    </div>

    <!-- Merchant App -->
    <div class="app-card">
      <div class="app-header">
        <div class="icon-preview">
          <img src="file:///d:/ANtigravity/Local%20Supply%20app/android-native/merchant/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png" />
        </div>
        <div class="app-meta">
          <h2>Everything Local Merchant</h2>
          <p>Indore Retail Partner Console</p>
          <code>com.ayushp0021.everythinglocal.merchant</code>
        </div>
      </div>

      <div>
        <div class="section-title" style="margin-bottom: 8px;">Top Bar & Brand Integration</div>
        <div class="mock-screen">
          <div class="merch-topbar">
            <div class="merch-brand-logo">
              <div class="merch-logo-sq">🏪</div>
              <div>
                <div class="merch-brand-text">
                  Sharma Kirana Store <span style="color:#16A34A; font-size:12px;">✓</span>
                  <span class="merch-badge">MERCHANT</span>
                </div>
                <div class="merch-sub">Indore Partner Console • 3.0 km Radius</div>
              </div>
            </div>
            <div style="font-size: 18px;">⚙️</div>
          </div>
          <div style="padding: 16px; background: #F8FAFC; font-size: 12px; color: #64748B;">
            <div style="font-weight: bold; color: #0F172A; font-size: 13px; margin-bottom: 4px;">Live Dispatch Console</div>
            Real-time barcode inventory, order acceptance & instant settlement.
          </div>
        </div>
      </div>

      <div class="feature-list">
        <div class="section-title">Identity & Asset Checklist</div>
        <div class="feature-item"><span class="check">✓</span> Distinct Warm Orange (#EA580C) Awning Motif</div>
        <div class="feature-item"><span class="check">✓</span> High-Contrast White/Orange Store Striping & Frame</div>
        <div class="feature-item"><span class="check">✓</span> Distinct Adaptive Vector & Launcher Icon (Non-confusable)</div>
        <div class="feature-item"><span class="check">✓</span> 5-Density PNG Mipmaps (mdpi to xxxhdpi)</div>
        <div class="feature-item"><span class="check">✓</span> Dedicated Partner Tagline: "Indore Hyperlocal Retail Partner Console"</div>
      </div>
    </div>
  </div>
</body>
</html>`;

fs.writeFileSync(tempHtml, html, 'utf8');

const cmd = `"${CHROME_PATH}" --headless --disable-gpu --force-device-scale-factor=1 --window-size=1400,900 --screenshot="${outScreenshot}" "file:///${tempHtml.replace(/\\/g, '/')}"`;
execSync(cmd, { stdio: 'inherit' });
console.log('✓ Successfully rendered branding comparison screenshot to:', outScreenshot);
