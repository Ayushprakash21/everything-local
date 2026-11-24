import os
import sys
from PIL import Image

TARGET_DIR = os.path.abspath('client/public/category-images')
os.makedirs(TARGET_DIR, exist_ok=True)

def process_and_save_webp(src_path, dest_filename, size=(512, 512), quality=85):
    if not os.path.exists(src_path):
        print(f"Error: Source file does not exist: {src_path}")
        return False
    
    try:
        with Image.open(src_path) as img:
            # Convert RGBA or CMYK to RGB
            if img.mode in ('RGBA', 'LA'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                background.paste(img, mask=img.split()[-1])
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Crop to center square if not square
            width, height = img.size
            if width != height:
                min_dim = min(width, height)
                left = (width - min_dim) // 2
                top = (height - min_dim) // 2
                right = left + min_dim
                bottom = top + min_dim
                img = img.crop((left, top, right, bottom))
            
            # Resize with Lanczos
            img = img.resize(size, Image.Resampling.LANCZOS)
            
            dest_path = os.path.join(TARGET_DIR, dest_filename)
            img.save(dest_path, 'WEBP', quality=quality, method=6)
            
            file_size_kb = os.path.getsize(dest_path) / 1024
            print(f"Saved: {dest_filename} ({size[0]}x{size[1]}, {file_size_kb:.1f} KB)")
            return True
    except Exception as e:
        print(f"Failed to process {src_path} -> {dest_filename}: {e}")
        return False

if __name__ == '__main__':
    print(f"Target directory: {TARGET_DIR}")
    # Process the first 3 images that are already generated
    brain_dir = r"C:\Users\Ayush\.gemini\antigravity\brain\16181c86-8929-4042-9db6-72d5e4908b5b"
    initial_map = {
        "paan-corner.webp": "paan_corner_1795546423416.jpg",
        "dairy-bread-eggs.webp": "dairy_bread_eggs_1795546434351.jpg",
        "fruits-vegetables.webp": "fruits_vegetables_1795546446959.jpg"
    }
    
    for webp_name, src_name in initial_map.items():
        src = os.path.join(brain_dir, src_name)
        process_and_save_webp(src, webp_name)
