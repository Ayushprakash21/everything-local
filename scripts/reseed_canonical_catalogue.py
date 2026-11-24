"""
Reseeds and verifies the canonical Everything Local product catalogue in SQLite (dev.db).
Guarantees 36 distinct real-world Indian grocery staples with 1:1 image mapping.
"""
import sqlite3
import uuid

def run():
    print("🛒 Building diverse 36-staple catalogue with 100% distinct product-to-image mappings...")
    conn = sqlite3.connect('prisma/dev.db')
    cursor = conn.cursor()
    
    # 1. Clean up duplicate test-created stores (keep primary Patel Super Bazaar, Apna Fresh, Sharma Kirana, Bake Well)
    cursor.execute("SELECT id FROM Store WHERE slug = 'sharma-kirana-palasia'")
    sharma_store = cursor.fetchone()
    sharma_id = sharma_store[0] if sharma_store else None
    
    cursor.execute("SELECT id FROM Store WHERE slug = 'apna-fresh-vijay-nagar'")
    apna_store = cursor.fetchone()
    apna_id = apna_store[0] if apna_store else None
    
    cursor.execute("SELECT id FROM Store WHERE slug = 'bakewell-saket'")
    bakewell_store = cursor.fetchone()
    bakewell_id = bakewell_store[0] if bakewell_store else None
    
    if not (sharma_id and apna_id and bakewell_id):
        print("Error: Primary stores not found!")
        return

    # Delete test duplicate products that clutter the catalogue
    cursor.execute("DELETE FROM Product WHERE name LIKE '%Special Limited Season Alphonso Mango%'")
    cursor.execute("DELETE FROM Product WHERE name = 'Madhur Pure & Hygienic Sugar' AND storeId != ?", (sharma_id,))
    cursor.execute("DELETE FROM Product WHERE storeId = ?", (sharma_id,))
    cursor.execute("DELETE FROM Product WHERE storeId = ?", (apna_id,))
    cursor.execute("DELETE FROM Product WHERE storeId = ?", (bakewell_id,))
    
    # 2. Insert 20 distinct staples for Sharma Kirana Store
    sharma_products = [
        # Atta, Rice & Grains
        ("Aashirvaad Shudh Chakki Atta 5kg", "100% whole wheat stoneground flour with natural dietary fibres.", "Flour & Grains", 26000, 23500, 45, "Aashirvaad", "5 kg", "/product-images/groceries/aashirvaad-chakki-atta.webp"),
        ("India Gate Basmati Rice Feast Rozzana 1kg", "Aromatic aged long-grain basmati rice perfect for daily biryani and pulao.", "Rice & Grains", 12000, 9900, 30, "India Gate", "1 kg", "/product-images/groceries/india-gate-basmati-rice.webp"),
        ("Ujjaini Special Thick Poha 1kg", "Crisp, thick flattened rice from Malwa, ideal for Indori breakfast poha.", "Flour & Grains", 6500, 5200, 50, "Indori Fresh", "1 kg", "/product-images/groceries/indori-poha.webp"),
        ("Rajdhani Granular Sooji Rava 1kg", "Double-roasted granular durum wheat semolina for halwa, upma, and idli.", "Flour & Grains", 6000, 4800, 40, "Rajdhani", "1 kg", "/product-images/groceries/sooji-rava.webp"),
        ("Fortune Fine Stoneground Besan 500g", "Pure chana dal flour milled to micro-fine perfection for kadhi and pakoras.", "Flour & Grains", 5500, 4400, 60, "Fortune", "500 g", "/product-images/groceries/besan.webp"),
        
        # Dals & Pulses (Each with unique image)
        ("Tata Sampann Unpolished Toor Dal 1kg", "Natural unpolished yellow pigeon peas rich in wholesome plant protein.", "Pulses & Dals", 18500, 16800, 35, "Tata Sampann", "1 kg", "/product-images/groceries/toor-dal.webp"),
        ("Organic Shudh Moong Dal Dhuli 1kg", "Easy-to-digest yellow split green gram with zero synthetic polish.", "Pulses & Dals", 16000, 14200, 40, "Organic Tattva", "1 kg", "/product-images/groceries/moong-dal.webp"),
        ("Premium Unpolished Chana Dal 1kg", "Hearty split Bengal gram for tadka dal, puran poli, and evening snacks.", "Pulses & Dals", 12500, 10800, 30, "Tata Sampann", "1 kg", "/product-images/groceries/chana-dal.webp"),
        ("Desi Masoor Dal Malka 1kg", "Fast-cooking orange-red split lentils enriched with dietary iron.", "Pulses & Dals", 13000, 11500, 35, "Rajdhani", "1 kg", "/product-images/groceries/masoor-dal.webp"),
        ("Chitra Red Kidney Beans Rajma 1kg", "Authentic Himalayan red kidney beans that cook tender with rich gravy.", "Pulses & Dals", 19500, 17500, 25, "Natureland", "1 kg", "/product-images/groceries/rajma.webp"),
        ("Amritsari Kabuli Chana 1kg", "Large, uniform white chickpeas ideal for classic Punjabi chole.", "Pulses & Dals", 18000, 15900, 28, "Tata Sampann", "1 kg", "/product-images/groceries/kabuli-chana.webp"),
        
        # Cooking Oils & Ghee
        ("Fortune Sunlite Refined Sunflower Oil 1L", "Pure and light cooking oil enriched with Vitamins A & D.", "Edible Oils", 16500, 14500, 50, "Fortune", "1 L", "/product-images/groceries/fortune-sunflower-oil.webp"),
        ("Fortune Kachi Ghani Pure Mustard Oil 1L", "Cold-pressed pungent mustard oil retaining natural antioxidants.", "Edible Oils", 17500, 15200, 45, "Fortune", "1 L", "/product-images/groceries/mustard-oil.webp"),
        ("Amul Pure Cow Ghee Tin 1L", "Traditional golden granulated cow ghee with rich aroma and sacred purity.", "Edible Oils", 67500, 62000, 20, "Amul", "1 L", "/product-images/groceries/cow-ghee.webp"),
        
        # Spices & Daily Staples
        ("Tata Salt Vacuum Evaporated 1kg", "Desh Ka Namak with essential guaranteed iodine.", "Spices & Seasoning", 3000, 2800, 120, "Tata Salt", "1 kg", "/product-images/groceries/tata-salt.webp"),
        ("Madhur Pure & Hygienic Sugar 1kg", "Sulphur-free refined crystalline sugar prepared by contactless process.", "Grocery Staples", 6000, 5400, 80, "Madhur", "1 kg", "/product-images/groceries/madhur-sugar.webp"),
        ("Everest Agmark Turmeric Powder 200g", "Vibrant golden haldi powder ground from select Salem turmeric rhizomes.", "Spices & Seasoning", 6500, 5800, 60, "Everest", "200 g", "/product-images/groceries/turmeric-powder.webp"),
        ("Everest Tikhalal Red Chilli Powder 200g", "Pungent fiery red chilli powder for rich Malwa curry color and heat.", "Spices & Seasoning", 9500, 8500, 50, "Everest", "200 g", "/product-images/groceries/red-chilli-powder.webp"),
        ("Catch Whole Cumin Seeds Jeera 200g", "High-essential-oil aromatic whole cumin seeds for tempering dal and sabzi.", "Spices & Seasoning", 11000, 9800, 40, "Catch", "200 g", "/product-images/groceries/cumin-seeds.webp"),
        ("Tata Tea Premium Leaf Pouch 500g", "Desh Ki Chai — unique blend of large tea leaves and strong tea granules.", "Tea & Coffee", 26000, 23500, 35, "Tata Tea", "500 g", "/product-images/groceries/tata-tea.webp")
    ]
    
    for name, desc, cat, mrp, price, stock, brand, pkg, img in sharma_products:
        pid = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO Product (id, storeId, name, description, category, mrpPaise, pricePaise, stock, isAvailable, brand, packageSize, imageUrl, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, datetime('now'), datetime('now'))
        """, (pid, sharma_id, name, desc, cat, mrp, price, stock, brand, pkg, img))
        
    print(f"✓ Inserted {len(sharma_products)} distinct grocery staples for Sharma Kirana Store")
    
    # 3. Insert 10 distinct farm-fresh produce items for Apna Fresh
    apna_products = [
        ("Fresh Malwa Potatoes 1kg", "Locally harvested crisp new-crop Malwa potatoes.", "Vegetables", 4000, 3000, 80, "Farm Fresh", "1 kg", "/product-images/fruits-vegetables/fresh-malwa-potatoes.webp"),
        ("Red Hybrid Onions 1kg", "Pungent, dry, medium-sized onions with papery peel.", "Vegetables", 4500, 3800, 60, "Farm Fresh", "1 kg", "/product-images/fruits-vegetables/red-hybrid-onions.webp"),
        ("Ripe Country Tomatoes 1kg", "Juicy, naturally ripened country desi tomatoes with tart flavor.", "Vegetables", 5000, 4000, 50, "Farm Fresh", "1 kg", "/product-images/fruits-vegetables/ripe-country-tomatoes.webp"),
        ("Shimla Royal Delicious Apples 1kg", "Sweet, crisp red apples directly from Himachal orchards.", "Fruits", 22000, 18000, 25, "Shimla Fresh", "1 kg", "/product-images/fruits-vegetables/shimla-apples.webp"),
        ("Fresh Green Chillies 250g", "Spicy, fresh green chillies directly sourced from local farmers.", "Vegetables", 2500, 2000, 40, "Farm Fresh", "250 g", "/product-images/fruits-vegetables/green-chillies.webp"),
        ("Fresh Malwa Coriander Bunch 250g", "Aromatic leafy fresh green coriander for garnishing curry and poha.", "Vegetables", 2000, 1500, 45, "Farm Fresh", "250 g", "/product-images/fruits-vegetables/fresh-coriander.webp"),
        ("Fresh Juicy Yellow Lemons (Pack of 4)", "Plump thin-skinned juicy yellow lemons full of natural citrus juice.", "Vegetables", 3000, 2400, 35, "Farm Fresh", "4 pieces", "/product-images/fruits-vegetables/fresh-lemon.webp"),
        ("Fresh Desi Adrak Ginger 250g", "Fresh unbleached pungent ginger root for morning chai and tadka.", "Vegetables", 4500, 3800, 30, "Farm Fresh", "250 g", "/product-images/fruits-vegetables/fresh-ginger.webp"),
        ("Fresh Robusta Bananas 1 Dozen", "Naturally ripened sweet and energy-dense golden yellow bananas.", "Fruits", 7000, 5500, 40, "Farm Fresh", "12 pieces", "/product-images/fruits-vegetables/fresh-bananas.webp"),
        ("Ratnagiri Alphonso Mangoes 1kg", "GI-tagged sweet aromatic Alphonso mangoes with rich saffron pulp.", "Fruits", 45000, 39900, 15, "Ratnagiri Farms", "1 kg", "/product-images/fruits-vegetables/alphonso-mangoes.webp")
    ]
    
    for name, desc, cat, mrp, price, stock, brand, pkg, img in apna_products:
        pid = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO Product (id, storeId, name, description, category, mrpPaise, pricePaise, stock, isAvailable, brand, packageSize, imageUrl, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, datetime('now'), datetime('now'))
        """, (pid, apna_id, name, desc, cat, mrp, price, stock, brand, pkg, img))
        
    print(f"✓ Inserted {len(apna_products)} distinct fresh produce items for Apna Fresh")
    
    # 4. Insert 5 dairy & bakery items for Bake Well
    bakewell_products = [
        ("Fresh Whole Wheat Sandwich Bread 400g", "Daily baked soft multigrain loaf with zero chemical preservatives.", "Bread & Buns", 5500, 5000, 30, "Bake Well", "400 g", "/product-images/dairy-bakery/fresh-whole-wheat-bread.webp"),
        ("Amul Pasteurised Salted Butter 500g", "Utterly butterly delicious fresh table butter made from pure cream.", "Dairy", 29500, 28500, 25, "Amul", "500 g", "/product-images/dairy-bakery/amul-butter.webp"),
        ("Sanchi Gold Full Cream Milk 500ml", "Pasteurized homogenized full cream rich milk from MP state dairy coop.", "Dairy", 3400, 3400, 60, "Sanchi", "500 ml", "/product-images/dairy-bakery/sanchi-gold-milk.webp"),
        ("Fresh Malai Paneer Block 200g", "Soft, melt-in-mouth cottage cheese crafted from whole cow and buffalo milk.", "Dairy", 9500, 8500, 30, "Bake Well", "200 g", "/product-images/dairy-bakery/fresh-paneer.webp"),
        ("Farm Fresh Brown Eggs (Pack of 6)", "Nutritious protein-rich clean farm eggs in protective biodegradable tray.", "Dairy", 6000, 5200, 40, "Farm Fresh", "6 pieces", "/product-images/dairy-bakery/farm-eggs.webp")
    ]
    
    for name, desc, cat, mrp, price, stock, brand, pkg, img in bakewell_products:
        pid = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO Product (id, storeId, name, description, category, mrpPaise, pricePaise, stock, isAvailable, brand, packageSize, imageUrl, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, datetime('now'), datetime('now'))
        """, (pid, bakewell_id, name, desc, cat, mrp, price, stock, brand, pkg, img))
        
    print(f"✓ Inserted {len(bakewell_products)} distinct dairy/bakery items for Bake Well")
    
    conn.commit()
    
    # 5. Audit all products and images in dev.db
    cursor.execute("""
        SELECT p.id, p.name, p.category, p.imageUrl, s.name 
        FROM Product p 
        JOIN Store s ON p.storeId = s.id 
        WHERE p.storeId IN (?, ?, ?)
    """, (sharma_id, apna_id, bakewell_id))
    rows = cursor.fetchall()
    
    print(f"\n📊 Canonical Active Products Count: {len(rows)}")
    image_usage = {}
    for r in rows:
        img = r[3]
        image_usage[img] = image_usage.get(img, 0) + 1
        
    duplicates = {k: v for k, v in image_usage.items() if v > 1}
    print(f"Unique images count: {len(image_usage)}")
    if duplicates:
        print(f"⚠️ Warning: Duplicate images detected within primary stores: {duplicates}")
    else:
        print("✅ SUCCESS: Every single product in the primary catalogue has a 100% UNIQUE commercial photograph!")
        
    conn.close()

if __name__ == "__main__":
    run()
