import os
import io
import urllib.request
from PIL import Image

TARGET_DIR = os.path.abspath('client/public/category-images')
BRAIN_DIR = r"C:\Users\Ayush\.gemini\antigravity\brain\16181c86-8929-4042-9db6-72d5e4908b5b"
os.makedirs(TARGET_DIR, exist_ok=True)

def process_image(img, dest_filename, size=(512, 512), quality=85):
    # Convert RGBA or CMYK to RGB
    if img.mode in ('RGBA', 'LA'):
        background = Image.new('RGB', img.size, (255, 255, 255))
        background.paste(img, mask=img.split()[-1])
        img = background
    elif img.mode != 'RGB':
        img = img.convert('RGB')
    
    # Crop to center square
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
    print(f"[OK] {dest_filename:35s} -> {size[0]}x{size[1]} ({file_size_kb:.1f} KB)")
    return True

def process_local(local_filename, dest_filename):
    src_path = os.path.join(BRAIN_DIR, local_filename)
    if not os.path.exists(src_path):
        print(f"[FAIL] Local file missing: {src_path}")
        return False
    with Image.open(src_path) as img:
        return process_image(img, dest_filename)

def process_url(url, dest_filename):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        with urllib.request.urlopen(req, timeout=10) as response:
            data = response.read()
        with Image.open(io.BytesIO(data)) as img:
            return process_image(img, dest_filename)
    except Exception as e:
        print(f"[FAIL] Error downloading {dest_filename} from {url}: {e}")
        return False

# All 29 categories exactly matching the user specification:
CATEGORY_SPECS = [
    # 1. Paan Corner
    ('paan-corner.webp', 'local', 'paan_corner_1795546423416.jpg'),
    # 2. Fruits & Vegetables
    ('fruits-vegetables.webp', 'local', 'fruits_vegetables_1795546446959.jpg'),
    # 3. Grocery & Daily Essentials
    ('grocery-daily-essentials.webp', 'local', 'grocery_daily_essentials_jpg_1795546508706.jpg'),
    # 4. Clothing & Fashion
    ('clothing-fashion.webp', 'local', 'clothing_fashion_jpg_1795546504573.jpg'),
    # 5. Beauty & Personal Care
    ('beauty-personal-care.webp', 'local', 'beauty_personal_care_jpg_1795546515404.jpg'),
    # 6. Home, Kitchen & Décor
    ('home-kitchen-decor.webp', 'url', 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=700&h=700&q=85'),
    # 7. Electronics & Electrical Décor
    ('electronics-electrical-decor.webp', 'url', 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=700&h=700&q=85'),
    # 8. Jewellery & Accessories
    ('jewellery-accessories.webp', 'url', 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=700&h=700&q=85'),
    # 9. Bags, Footwear & Travel
    ('bags-footwear-travel.webp', 'url', 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=700&h=700&q=85'),
    # 10. Pharmacy & Wellness
    ('pharmacy-wellness.webp', 'local', 'pharmacy_wellness_jpg_1795546504818.jpg'),
    # 11. Services & Other Local Products
    ('services-local-products.webp', 'local', 'services_local_products_jpg_1795546513573.jpg'),
    # 12. Dairy, Bread & Eggs
    ('dairy-bread-eggs.webp', 'local', 'dairy_bread_eggs_1795546434351.jpg'),
    # 13. Cold Drinks & Juices
    ('cold-drinks-juices.webp', 'url', 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?auto=format&fit=crop&w=700&h=700&q=85'),
    # 14. Snacks & Munchies
    ('snacks-munchies.webp', 'local', 'indori_sev_namkeen_1795474523364.jpg'),
    # 15. Breakfast & Instant Food
    ('breakfast-instant-food.webp', 'local', 'breakfast_instant_food_jpg_1795546524610.jpg'),
    # 16. Sweet Tooth
    ('sweet-tooth.webp', 'url', 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=700&h=700&q=85'),
    # 17. Bakery & Biscuits
    ('bakery-biscuits.webp', 'local', 'bakery_biscuits_jpg_1795546519190.jpg'),
    # 18. Tea, Coffee & Milk Drinks
    ('tea-coffee-milk-drinks.webp', 'url', 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=700&h=700&q=85'),
    # 19. Atta, Rice & Dal
    ('atta-rice-dal.webp', 'url', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=700&h=700&q=85'),
    # 20. Masala, Oil & More
    ('masala-oil.webp', 'url', 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=700&h=700&q=85'),
    # 21. Sauces & Spreads
    ('sauces-spreads.webp', 'url', 'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?auto=format&fit=crop&w=700&h=700&q=85'),
    # 22. Chicken, Meat & Fish
    ('chicken-meat-fish.webp', 'local', 'chicken_meat_fish_jpg_1795546510409.jpg'),
    # 23. Organic & Healthy Living
    ('organic-healthy-living.webp', 'url', 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=700&h=700&q=85'),
    # 24. Baby Care
    ('baby-care.webp', 'local', 'baby_care_jpg_1795546519819.jpg'),
    # 25. Pharma & Wellness
    ('pharma.webp', 'url', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=700&h=700&q=85'),
    # 26. Cleaning Essentials
    ('cleaning-essentials.webp', 'url', 'https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=700&h=700&q=85'),
    # 27. Home & Office
    ('home-office.webp', 'url', 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=700&h=700&q=85'),
    # 28. Personal Care
    ('personal-care.webp', 'url', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=700&h=700&q=85'),
    # 29. Pet Care
    ('pet-care.webp', 'url', 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=700&h=700&q=85'),
]

if __name__ == '__main__':
    print("=" * 60)
    print("BUILDING 29 REALISTIC COMMERCIAL WEBP CATEGORY IMAGES")
    print(f"Target directory: {TARGET_DIR}")
    print("=" * 60)
    
    success_count = 0
    for filename, source_type, src in CATEGORY_SPECS:
        if source_type == 'local':
            ok = process_local(src, filename)
        else:
            ok = process_url(src, filename)
        if ok:
            success_count += 1
            
    print("=" * 60)
    print(f"COMPLETED: {success_count} / {len(CATEGORY_SPECS)} images processed successfully.")
    print("=" * 60)
