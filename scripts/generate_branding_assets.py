import os
import base64
from PIL import Image

def generate_branding():
    src_path = 'C:/Users/Ayush/.gemini/antigravity/brain/16181c86-8929-4042-9db6-72d5e4908b5b/.user_uploaded/media_1795311348290_20d1bf37.png'
    out_dir = 'assets/branding'
    os.makedirs(out_dir, exist_ok=True)

    img = Image.open(src_path).convert('RGBA')

    # 1. Clean background noise (alpha < 15)
    cleaned = Image.new('RGBA', img.size, (0, 0, 0, 0))
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = img.getpixel((x, y))
            if a >= 15:
                cleaned.putpixel((x, y), (r, g, b, a))

    # Tight crop of the monogram + arcs
    bbox = (350, 163, 665, 490)
    cropped = cleaned.crop(bbox)

    def make_square(image, size=512, pad_ratio=0.12, bg_color=(0, 0, 0, 0)):
        canvas = Image.new('RGBA', (size, size), bg_color)
        target_dim = int(size * (1 - pad_ratio * 2))
        scale = target_dim / max(image.width, image.height)
        new_w = int(image.width * scale)
        new_h = int(image.height * scale)
        resized = image.resize((new_w, new_h), Image.Resampling.LANCZOS)
        offset_x = (size - new_w) // 2
        offset_y = (size - new_h) // 2
        canvas.paste(resized, (offset_x, offset_y), resized)
        return canvas

    # 1. logo-full.png (standard high-res transparent 1024x1024)
    logo_full = make_square(cropped, 1024, pad_ratio=0.08)
    logo_full.save(os.path.join(out_dir, 'logo-full.png'), 'PNG')

    # 2. logo-light.png (for dark backgrounds: ivory E #FFF8E9, gold L #F5A623, gold arcs)
    logo_light = Image.new('RGBA', cropped.size, (0, 0, 0, 0))
    for y in range(cropped.height):
        for x in range(cropped.width):
            r, g, b, a = cropped.getpixel((x, y))
            if a > 0:
                if b > 140: # ivory E
                    logo_light.putpixel((x, y), (255, 248, 233, a))
                else: # golden amber L and arcs
                    logo_light.putpixel((x, y), (245, 166, 35, a))
    logo_light_sq = make_square(logo_light, 512, pad_ratio=0.08)
    logo_light_sq.save(os.path.join(out_dir, 'logo-light.png'), 'PNG')

    # 3. logo-dark.png (for light/white backgrounds: charcoal #171717 E, gold L #F5A623, gold arcs)
    logo_dark = Image.new('RGBA', cropped.size, (0, 0, 0, 0))
    for y in range(cropped.height):
        for x in range(cropped.width):
            r, g, b, a = cropped.getpixel((x, y))
            if a > 0:
                if b > 140: # charcoal E on light background
                    logo_dark.putpixel((x, y), (23, 23, 23, a))
                else: # golden amber L and arcs
                    logo_dark.putpixel((x, y), (245, 166, 35, a))
    logo_dark_sq = make_square(logo_dark, 512, pad_ratio=0.08)
    logo_dark_sq.save(os.path.join(out_dir, 'logo-dark.png'), 'PNG')

    # 4. logo-icon.png (monogram only, letters E and L cropped without outer arcs)
    letters_cropped = cropped.crop((18, 75, 262, 250))
    logo_icon = make_square(letters_cropped, 512, pad_ratio=0.10)
    logo_icon.save(os.path.join(out_dir, 'logo-icon.png'), 'PNG')

    # 5. favicon.png (64x64 crisp)
    favicon = make_square(cropped, 64, pad_ratio=0.05)
    favicon.save(os.path.join(out_dir, 'favicon.png'), 'PNG')

    # 6. splash-logo.png (512x512 transparent)
    splash_logo = make_square(cropped, 512, pad_ratio=0.15)
    splash_logo.save(os.path.join(out_dir, 'splash-logo.png'), 'PNG')

    # 7. android-icon.png (512x512 launcher icon with rich charcoal circular badge)
    android_icon = Image.new('RGBA', (512, 512), (23, 23, 23, 255))
    icon_content = make_square(cropped, 512, pad_ratio=0.18)
    android_icon.paste(icon_content, (0, 0), icon_content)
    android_icon.save(os.path.join(out_dir, 'android-icon.png'), 'PNG')

    # 8. logo.svg (vector wrapper with transparent high-res monogram)
    with open(os.path.join(out_dir, 'logo-dark.png'), 'rb') as f:
        b64 = base64.b64encode(f.read()).decode('utf-8')
    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <title>Everything Local Monogram Logo</title>
  <image href="data:image/png;base64,{b64}" x="0" y="0" width="512" height="512" />
</svg>'''
    with open(os.path.join(out_dir, 'logo.svg'), 'w', encoding='utf-8') as f:
        f.write(svg_content)

    print("Successfully generated all assets in assets/branding/")

    # 9. Distribute to client/public
    client_public = 'client/public'
    client_branding = os.path.join(client_public, 'branding')
    os.makedirs(client_branding, exist_ok=True)
    for fname in os.listdir(out_dir):
        src_f = os.path.join(out_dir, fname)
        dst_f = os.path.join(client_branding, fname)
        with open(src_f, 'rb') as sf, open(dst_f, 'wb') as df:
            df.write(sf.read())
    
    # Also copy favicon.png to client/public/favicon.png and client/public/favicon.ico
    with open(os.path.join(out_dir, 'favicon.png'), 'rb') as sf:
        fav_data = sf.read()
        with open(os.path.join(client_public, 'favicon.png'), 'wb') as df:
            df.write(fav_data)
        with open(os.path.join(client_public, 'favicon.ico'), 'wb') as df:
            df.write(fav_data)

    # 10. Distribute to mobile/assets
    mobile_assets = 'mobile/assets'
    os.makedirs(mobile_assets, exist_ok=True)
    # adaptive-icon.png (foreground on transparent)
    make_square(cropped, 432, pad_ratio=0.18).save(os.path.join(mobile_assets, 'adaptive-icon.png'), 'PNG')
    # icon.png (standard icon)
    android_icon.resize((1024, 1024), Image.Resampling.LANCZOS).save(os.path.join(mobile_assets, 'icon.png'), 'PNG')
    # splash-icon.png
    make_square(cropped, 512, pad_ratio=0.20).save(os.path.join(mobile_assets, 'splash-icon.png'), 'PNG')
    # favicon.png
    favicon.save(os.path.join(mobile_assets, 'favicon.png'), 'PNG')

    # Also copy branding to mobile/assets/branding
    mobile_branding = os.path.join(mobile_assets, 'branding')
    os.makedirs(mobile_branding, exist_ok=True)
    for fname in os.listdir(out_dir):
        src_f = os.path.join(out_dir, fname)
        dst_f = os.path.join(mobile_branding, fname)
        with open(src_f, 'rb') as sf, open(dst_f, 'wb') as df:
            df.write(sf.read())

    # 11. Distribute to android-native/ mipmap directories
    native_dirs = [
        ('android-native/customer/src/main/res', 'EverythingLocal-Customer'),
        ('android-native/merchant/src/main/res', 'EverythingLocal-Merchant')
    ]
    res_sizes = {
        'mipmap-mdpi': 48,
        'mipmap-hdpi': 72,
        'mipmap-xhdpi': 96,
        'mipmap-xxhdpi': 144,
        'mipmap-xxxhdpi': 192
    }
    for res_root, app_name in native_dirs:
        if os.path.exists(res_root):
            for folder, px in res_sizes.items():
                folder_path = os.path.join(res_root, folder)
                os.makedirs(folder_path, exist_ok=True)
                launcher_icon = android_icon.resize((px, px), Image.Resampling.LANCZOS)
                launcher_icon.save(os.path.join(folder_path, 'ic_launcher.png'), 'PNG')
                launcher_icon.save(os.path.join(folder_path, 'ic_launcher_round.png'), 'PNG')

    print("Distributed branding assets to web and mobile directories!")

if __name__ == '__main__':
    generate_branding()
