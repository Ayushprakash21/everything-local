import os
import base64

BRAND_DIR = os.path.abspath('client/public/brand')
logo_png = os.path.join(BRAND_DIR, 'everybazaar-official-logo.png')

with open(logo_png, 'rb') as f:
    b64_data = base64.b64encode(f.read()).decode('utf-8')
data_uri = f"data:image/png;base64,{b64_data}"

# 1. everybazaar-symbol.svg (Pure square official badge)
symbol_svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <title>EveryBazaar Official Logo</title>
  <image href="{data_uri}" x="0" y="0" width="512" height="512" preserveAspectRatio="xMidYMid meet" />
</svg>'''

with open(os.path.join(BRAND_DIR, 'everybazaar-symbol.svg'), 'w', encoding='utf-8') as f:
    f.write(symbol_svg)
with open(os.path.join(BRAND_DIR, 'everybazaar-app-icon.svg'), 'w', encoding='utf-8') as f:
    f.write(symbol_svg)
with open(os.path.join(BRAND_DIR, 'everybazaar-favicon.svg'), 'w', encoding='utf-8') as f:
    f.write(symbol_svg)
print("[OK] Generated everybazaar-symbol.svg, everybazaar-app-icon.svg, everybazaar-favicon.svg")

# 2. everybazaar-logo-compact.svg (Badge + EveryBazaar wordmark)
compact_svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 90" width="100%" height="100%">
  <title>EveryBazaar Compact Logo</title>
  <!-- Official Master Badge -->
  <image href="{data_uri}" x="4" y="5" width="80" height="80" preserveAspectRatio="xMidYMid meet" />
  <!-- Wordmark -->
  <text x="96" y="56" font-family="'Inter', 'Manrope', -apple-system, BlinkMacSystemFont, sans-serif" font-weight="900" font-size="38" letter-spacing="-1.5">
    <tspan fill="#0B1F3B">Every</tspan><tspan fill="#F5B82E">Bazaar</tspan>
  </text>
</svg>'''

with open(os.path.join(BRAND_DIR, 'everybazaar-logo-compact.svg'), 'w', encoding='utf-8') as f:
    f.write(compact_svg)
print("[OK] Generated everybazaar-logo-compact.svg")

# 3. everybazaar-logo-horizontal.svg (Badge + EveryBazaar wordmark + Tagline)
horizontal_svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 460 100" width="100%" height="100%">
  <title>EveryBazaar Horizontal Logo</title>
  <!-- Official Master Badge -->
  <image href="{data_uri}" x="4" y="8" width="84" height="84" preserveAspectRatio="xMidYMid meet" />
  <!-- Wordmark -->
  <text x="100" y="52" font-family="'Inter', 'Manrope', -apple-system, BlinkMacSystemFont, sans-serif" font-weight="900" font-size="38" letter-spacing="-1.5">
    <tspan fill="#0B1F3B">Every</tspan><tspan fill="#F5B82E">Bazaar</tspan>
  </text>
  <!-- Tagline -->
  <text x="102" y="76" font-family="'Inter', 'Manrope', -apple-system, BlinkMacSystemFont, sans-serif" font-weight="700" font-size="12.5" fill="#475569" letter-spacing="0.2">
    Shop more. Save more. Live better.
  </text>
</svg>'''

with open(os.path.join(BRAND_DIR, 'everybazaar-logo-horizontal.svg'), 'w', encoding='utf-8') as f:
    f.write(horizontal_svg)
print("[OK] Generated everybazaar-logo-horizontal.svg")

# 4. everybazaar-logo-dark.svg (For dark backgrounds)
dark_svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 460 100" width="100%" height="100%">
  <title>EveryBazaar Dark Logo</title>
  <!-- Official Master Badge -->
  <image href="{data_uri}" x="4" y="8" width="84" height="84" preserveAspectRatio="xMidYMid meet" />
  <!-- Wordmark -->
  <text x="100" y="52" font-family="'Inter', 'Manrope', -apple-system, BlinkMacSystemFont, sans-serif" font-weight="900" font-size="38" letter-spacing="-1.5">
    <tspan fill="#FFFFFF">Every</tspan><tspan fill="#F5B82E">Bazaar</tspan>
  </text>
  <!-- Tagline -->
  <text x="102" y="76" font-family="'Inter', 'Manrope', -apple-system, BlinkMacSystemFont, sans-serif" font-weight="700" font-size="12.5" fill="#CBD5E1" letter-spacing="0.2">
    Shop more. Save more. Live better.
  </text>
</svg>'''

with open(os.path.join(BRAND_DIR, 'everybazaar-logo-dark.svg'), 'w', encoding='utf-8') as f:
    f.write(dark_svg)
with open(os.path.join(BRAND_DIR, 'everybazaar-logo-light.svg'), 'w', encoding='utf-8') as f:
    f.write(horizontal_svg)
print("[OK] Generated everybazaar-logo-dark.svg & everybazaar-logo-light.svg")
