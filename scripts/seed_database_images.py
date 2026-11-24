import sqlite3

def run():
    print("🔄 Updating Product and Medicine image URLs in SQLite database...")
    conn = sqlite3.connect('prisma/dev.db')
    cursor = conn.cursor()
    
    # 1. Product mapping rules (by pattern/name) - specific terms first
    product_mappings = [
        ("%Butter%", "/product-images/dairy-bakery/amul-butter.webp"),
        ("%Atta%", "/product-images/groceries/aashirvaad-chakki-atta.webp"),
        ("%Sunflower Oil%", "/product-images/groceries/fortune-sunflower-oil.webp"),
        ("%Tata Salt%", "/product-images/groceries/tata-salt.webp"),
        ("%Salt%", "/product-images/groceries/tata-salt.webp"),
        ("%Sugar%", "/product-images/groceries/madhur-sugar.webp"),
        ("%Basmati Rice%", "/product-images/groceries/india-gate-basmati-rice.webp"),
        ("%Rice%", "/product-images/groceries/india-gate-basmati-rice.webp"),
        ("%Potato%", "/product-images/fruits-vegetables/fresh-malwa-potatoes.webp"),
        ("%Aloo%", "/product-images/fruits-vegetables/fresh-malwa-potatoes.webp"),
        ("%Onion%", "/product-images/fruits-vegetables/red-hybrid-onions.webp"),
        ("%Pyaz%", "/product-images/fruits-vegetables/red-hybrid-onions.webp"),
        ("%Tomato%", "/product-images/fruits-vegetables/ripe-country-tomatoes.webp"),
        ("%Apple%", "/product-images/fruits-vegetables/shimla-apples.webp"),
        ("%Mango%", "/product-images/fruits-vegetables/alphonso-mangoes.webp"),
        ("%Bread%", "/product-images/dairy-bakery/fresh-whole-wheat-bread.webp"),
        ("%Milk%", "/product-images/dairy-bakery/sanchi-gold-milk.webp"),
        ("%Doodh%", "/product-images/dairy-bakery/sanchi-gold-milk.webp"),
        ("%Paneer%", "/product-images/dairy-bakery/fresh-paneer.webp"),
        ("%Egg%", "/product-images/dairy-bakery/farm-eggs.webp"),
        ("%Sev%", "/product-images/snacks-beverages/indori-sev.webp"),
        ("%Namkeen%", "/product-images/snacks-beverages/indori-sev.webp")
    ]
    
    updated_products = 0
    for pattern, img_url in product_mappings:
        cursor.execute(
            "UPDATE Product SET imageUrl = ? WHERE name LIKE ? AND (imageUrl IS NULL OR imageUrl = '')",
            (img_url, pattern)
        )
        updated_products += cursor.rowcount
        
    # Check any remaining products and assign category defaults
    category_defaults = [
        ("%Fruit%", "/product-images/fruits-vegetables/shimla-apples.webp"),
        ("%Veg%", "/product-images/fruits-vegetables/fresh-malwa-potatoes.webp"),
        ("%Produce%", "/product-images/fruits-vegetables/ripe-country-tomatoes.webp"),
        ("%Dairy%", "/product-images/dairy-bakery/sanchi-gold-milk.webp"),
        ("%Bakery%", "/product-images/dairy-bakery/fresh-whole-wheat-bread.webp"),
        ("%Bread%", "/product-images/dairy-bakery/fresh-whole-wheat-bread.webp"),
        ("%Flour%", "/product-images/groceries/aashirvaad-chakki-atta.webp"),
        ("%Grain%", "/product-images/groceries/india-gate-basmati-rice.webp"),
        ("%Oil%", "/product-images/groceries/fortune-sunflower-oil.webp"),
        ("%Grocery%", "/product-images/groceries/madhur-sugar.webp")
    ]
    for cat_pattern, img_url in category_defaults:
        cursor.execute(
            "UPDATE Product SET imageUrl = ? WHERE category LIKE ? AND (imageUrl IS NULL OR imageUrl = '')",
            (img_url, cat_pattern)
        )
        updated_products += cursor.rowcount
        
    print(f"✓ Products updated with canonical image URLs: {updated_products}")
    
    # 2. Medicine mappings
    medicine_mappings = [
        ("%Dolo%", "/product-images/pharmacy/dolo-650.webp"),
        ("%Digene%", "/product-images/pharmacy/digene-gel.webp"),
        ("%Augmentin%", "/product-images/pharmacy/augmentin-625.webp"),
        ("%Azithral%", "/product-images/pharmacy/azithral-500.webp"),
        ("%Pantocid%", "/product-images/pharmacy/pantocid-40.webp"),
        ("%Telma%", "/product-images/pharmacy/telma-40.webp"),
        ("%Cefix%", "/product-images/pharmacy/cefix-200.webp"),
        ("%Accu-Chek%", "/product-images/pharmacy/accu-chek.webp"),
        ("%Omron%", "/product-images/pharmacy/omron-bp.webp"),
        ("%Dettol%", "/product-images/pharmacy/dettol-antiseptic.webp"),
        ("%Volini%", "/product-images/pharmacy/volini-gel.webp"),
        ("%Hansaplast%", "/product-images/pharmacy/hansaplast-strips.webp")
    ]
    
    updated_meds = 0
    for pattern, img_url in medicine_mappings:
        cursor.execute(
            "UPDATE Medicine SET imageUrl = ? WHERE name LIKE ? AND (imageUrl IS NULL OR imageUrl = '')",
            (img_url, pattern)
        )
        updated_meds += cursor.rowcount
        
    print(f"✓ Medicines updated with canonical image URLs: {updated_meds}")
    
    conn.commit()
    
    # Verification
    cursor.execute("SELECT count(*) FROM Product WHERE imageUrl IS NOT NULL")
    prods_with_img = cursor.fetchone()[0]
    cursor.execute("SELECT count(*) FROM Product")
    total_prods = cursor.fetchone()[0]
    
    cursor.execute("SELECT count(*) FROM Medicine WHERE imageUrl IS NOT NULL")
    meds_with_img = cursor.fetchone()[0]
    cursor.execute("SELECT count(*) FROM Medicine")
    total_meds = cursor.fetchone()[0]
    
    print(f"\n📊 Image Coverage Status:")
    print(f"   Products with Realistic Images: {prods_with_img} / {total_prods} ({prods_with_img/total_prods*100:.1f}%)")
    print(f"   Medicines with Realistic Images: {meds_with_img} / {total_meds} ({meds_with_img/total_meds*100:.1f}%)")
    
    conn.close()

if __name__ == "__main__":
    run()
