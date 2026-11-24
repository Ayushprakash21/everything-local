import os
from PIL import Image, ImageFilter

SRC_PATH = r"C:\Users\Ayush\.gemini\antigravity\brain\16181c86-8929-4042-9db6-72d5e4908b5b\.user_uploaded\media_1795546254576_4ca1c967.png"
BRAND_DIR = os.path.abspath('client/public/brand')
PUBLIC_DIR = os.path.abspath('client/public')

os.makedirs(BRAND_DIR, exist_ok=True)
os.makedirs(PUBLIC_DIR, exist_ok=True)

def process_master_logo():
    print(f"Loading master logo from: {SRC_PATH}")
    img = Image.open(SRC_PATH).convert('RGBA')
    w, h = img.size
    
    # 1. Flood fill white background outside the badge to make it transparent
    visited = set()
    queue = [(0, 0), (w-1, 0), (0, h-1), (w-1, h-1)]
    for p in queue:
        visited.add(p)

    while queue:
        x, y = queue.pop(0)
        for nx, ny in [(x+1, y), (x-1, y), (x, y+1), (x, y-1)]:
            if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in visited:
                r, g, b, a = img.getpixel((nx, ny))
                # Outside white canvas
                if r > 230 and g > 230 and b > 230:
                    visited.add((nx, ny))
                    queue.append((nx, ny))

    transparent_img = img.copy()
    for x, y in visited:
        transparent_img.putpixel((x, y), (255, 255, 255, 0))

    # Anti-alias edges slightly
    # Save the master transparent image
    bbox = transparent_img.getbbox()
    cropped_badge = transparent_img.crop(bbox)
    
    # Pad to square (1:1 aspect ratio)
    cw, ch = cropped_badge.size
    max_dim = max(cw, ch)
    square_badge = Image.new('RGBA', (max_dim, max_dim), (0, 0, 0, 0))
    offset = ((max_dim - cw) // 2, (max_dim - ch) // 2)
    square_badge.paste(cropped_badge, offset, cropped_badge)
    
    # Upscale to high-res master (512x512)
    master_512 = square_badge.resize((512, 512), Image.Resampling.LANCZOS)
    
    # Save master assets
    master_512.save(os.path.join(BRAND_DIR, 'everybazaar-official-logo.png'), 'PNG')
    master_512.save(os.path.join(BRAND_DIR, 'everybazaar-official-logo.webp'), 'WEBP', quality=95)
    master_512.save(os.path.join(BRAND_DIR, 'everybazaar-symbol.png'), 'PNG')
    master_512.save(os.path.join(BRAND_DIR, 'everybazaar-symbol.webp'), 'WEBP', quality=95)
    master_512.save(os.path.join(BRAND_DIR, 'everybazaar-app-icon.png'), 'PNG')
    print("[OK] Saved 512x512 master brand assets in client/public/brand/")

    # Save PWA icons
    master_192 = square_badge.resize((192, 192), Image.Resampling.LANCZOS)
    master_192.save(os.path.join(PUBLIC_DIR, 'icon-192.png'), 'PNG')
    
    master_512.save(os.path.join(PUBLIC_DIR, 'icon-512.png'), 'PNG')
    
    # Apple touch icon (180x180)
    master_180 = square_badge.resize((180, 180), Image.Resampling.LANCZOS)
    master_180.save(os.path.join(PUBLIC_DIR, 'apple-touch-icon.png'), 'PNG')
    
    # Favicons (64x64, 32x32, favicon.ico)
    fav_64 = square_badge.resize((64, 64), Image.Resampling.LANCZOS)
    fav_64.save(os.path.join(PUBLIC_DIR, 'favicon.png'), 'PNG')
    
    fav_32 = square_badge.resize((32, 32), Image.Resampling.LANCZOS)
    fav_32.save(os.path.join(PUBLIC_DIR, 'favicon.ico'), format='ICO', sizes=[(32, 32), (64, 64)])
    print("[OK] Saved favicon and PWA icons in client/public/")

    # Also create a tightly cropped version of the badge (without floor shadow)
    # for inline small placements (like the 48px promotional banner tile)
    # The navy square without bottom shadow is roughly top 13 to bottom 167
    tile_crop = transparent_img.crop((12, 12, 175, 168))
    tw, th = tile_crop.size
    t_dim = max(tw, th)
    square_tile = Image.new('RGBA', (t_dim, t_dim), (0, 0, 0, 0))
    square_tile.paste(tile_crop, ((t_dim - tw) // 2, (t_dim - th) // 2), tile_crop)
    tile_512 = square_tile.resize((512, 512), Image.Resampling.LANCZOS)
    tile_512.save(os.path.join(BRAND_DIR, 'everybazaar-badge.png'), 'PNG')
    tile_512.save(os.path.join(BRAND_DIR, 'everybazaar-badge.webp'), 'WEBP', quality=95)
    print("[OK] Saved tight tile badge (everybazaar-badge.png / .webp) for promotional banner")

if __name__ == '__main__':
    process_master_logo()
