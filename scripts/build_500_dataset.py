import json
import os
import re

out_dir = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(out_dir, exist_ok=True)

products = []

def slugify(text):
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '-', text).strip('-')
    return text

def add_item(prefix, num, name, brand, cat_name, cat_slug, sub_slug, dept, unit, size, mrp, price, short_desc, desc, img, specs, keywords, tags, opts=None):
    if opts is None:
        opts = {}
    sku = f"EB-{prefix}-{num:03d}"
    slug = slugify(name)
    # Ensure slug uniqueness
    existing_slugs = {p["slug"] for p in products}
    if slug in existing_slugs:
        slug = f"{slug}-{num}"
        
    item = {
        "sku": sku,
        "name": name,
        "slug": slug,
        "brand": brand,
        "categoryName": cat_name,
        "categorySlug": cat_slug,
        "subcategorySlug": sub_slug,
        "department": dept,
        "unit": unit,
        "packageSize": size,
        "mrpPaise": mrp,
        "targetPricePaise": price,
        "shortDescription": short_desc,
        "description": desc,
        "variants": opts.get("variants", [{"name": size, "mrpPaise": mrp, "pricePaise": price}]),
        "specifications": specs,
        "searchKeywords": keywords,
        "tags": tags,
        "taxClassification": opts.get("tax", "GST_18" if opts.get("isService") else "GST_5"),
        "imageUrl": img,
        "isPrescriptionRequired": opts.get("isPrescription", False),
        "isService": opts.get("isService", False),
        "status": "ACTIVE",
        "environment": "DEMO"
    }
    products.append(item)

# -------------------------------------------------------------
# 1. GROCERY & DAILY ESSENTIALS (100 products)
# -------------------------------------------------------------
# Load the 100 groceries already drafted
partial_path = os.path.join(out_dir, "items-partial.json")
if os.path.exists(partial_path):
    with open(partial_path, "r", encoding="utf-8") as f:
        existing_gro = json.load(f)
        for g in existing_gro:
            products.append(g)
print(f"Loaded {len(products)} grocery items.")

# -------------------------------------------------------------
# 2. FRUITS & VEGETABLES (50 products)
# -------------------------------------------------------------
veg_sub_map = {
    # 15 Daily Vegetables
    "daily-vegetables": [
        ("Fresh Green Cauliflower (Gobhi) 1pc", "Malwa Mandi", "piece", "1 pc (~600g)", 4500, 3500, "Crisp white florets harvested fresh from local farms.", "/product-images/fruits-vegetables/fresh-malwa-potatoes.webp", {"Farm": "Sanwer Road Mandi"}),
        ("Crisp Green Cabbage (Patta Gobhi) 1pc", "Malwa Mandi", "piece", "1 pc (~500g)", 3500, 2500, "Tight layered crisp cabbage for salads and sabzi.", "/product-images/fruits-vegetables/fresh-malwa-potatoes.webp", {"Farm": "Sanwer Road Mandi"}),
        ("Fresh Tender Bhindi (Lady Finger) 500g", "Malwa Mandi", "pack", "500 g", 4000, 3000, "Bright green tender okra, perfect for crispy bhindi fry.", "/product-images/fruits-vegetables/fresh-malwa-potatoes.webp", {"Grade": "Tender Small"}),
        ("Round Purple Brinjal (Baingan Bharta) 500g", "Malwa Mandi", "pack", "500 g", 3500, 2500, "Glossy seedless brinjal ideal for roasted baingan bharta.", "/product-images/fruits-vegetables/fresh-malwa-potatoes.webp", {"Variety": "Bharta Baingan"}),
        ("Fresh Bottle Gourd (Lauki / Doodhi) 1pc", "Malwa Mandi", "piece", "1 pc (~700g)", 4000, 2800, "Tender pale green bottle gourd rich in water content.", "/product-images/fruits-vegetables/fresh-malwa-potatoes.webp", {"Type": "Desi Lauki"}),
        ("Fresh Green Capsicum (Shimla Mirch) 500g", "Malwa Mandi", "pack", "500 g", 5000, 3800, "Crunchy thick-walled green bell peppers.", "/product-images/fruits-vegetables/fresh-malwa-potatoes.webp", {"Origin": "Dhar"}),
        ("Fresh Green Peas (Matar Phali) 1kg", "Malwa Mandi", "pack", "1 kg", 9000, 7500, "Sweet and plump green pea pods fresh from farm.", "/product-images/fruits-vegetables/fresh-malwa-potatoes.webp", {"Sweetness": "Natural"}),
        ("Bitter Gourd (Karela) 500g", "Malwa Mandi", "pack", "500 g", 4500, 3200, "Firm dark green karela known for blood-sugar balance.", "/product-images/fruits-vegetables/fresh-malwa-potatoes.webp", {"Type": "Small Karela"}),
        ("Ridge Gourd (Turai) 500g", "Malwa Mandi", "pack", "500 g", 4000, 2900, "Tender ridged gourds, easy to digest and low calorie.", "/product-images/fruits-vegetables/fresh-malwa-potatoes.webp", {"Type": "Desi Turai"}),
        ("Fresh French Beans 250g", "Malwa Mandi", "pack", "250 g", 3500, 2600, "Stringless crisp beans for nutritious poriyal and pulao.", "/product-images/fruits-vegetables/fresh-malwa-potatoes.webp", {"Quality": "Stringless"}),
        ("Sweet Red Delhi Carrots (Gajar) 1kg", "Malwa Mandi", "pack", "1 kg", 6000, 4800, "Juicy crimson carrots ideal for fresh juice and gajar halwa.", "/product-images/fruits-vegetables/fresh-malwa-potatoes.webp", {"Type": "Red Desi"}),
        ("Organic Red Beetroot (Chukandar) 500g", "Malwa Mandi", "pack", "500 g", 3500, 2500, "Iron-rich dark red beetroot bulbs for healthy salads.", "/product-images/fruits-vegetables/fresh-malwa-potatoes.webp", {"Iron": "Rich"}),
        ("Country White Radish (Desi Mooli) 500g", "Malwa Mandi", "pack", "500 g", 3000, 2000, "Pungent crunchy white radish with fresh green tops.", "/product-images/fruits-vegetables/fresh-malwa-potatoes.webp", {"Taste": "Crisp Pungent"}),
        ("Fresh Green Salad Cucumber (Kheera) 500g", "Malwa Mandi", "pack", "500 g", 3500, 2400, "Hydrating crisp cucumbers for refreshing summer raita.", "/product-images/fruits-vegetables/fresh-malwa-potatoes.webp", {"Hydration": "96% Water"}),
        ("Fresh American Sweet Corn Cobs 2-Pack", "Malwa Mandi", "pack", "2 pcs", 5000, 3600, "Golden sweet kernels inside tender green husks.", "/product-images/fruits-vegetables/fresh-malwa-potatoes.webp", {"Variety": "Golden Sweet"})
    ],
    # 10 Potatoes, Onions & Tomatoes
    "potatoes-onions-tomatoes": [
        ("Fresh Malwa Chipsona Potatoes 1kg", "Choithram Mandi", "pack", "1 kg", 3500, 2500, "Firm non-sweet Malwa potatoes ideal for crispy aloo sabzi and fries.", "/product-images/fruits-vegetables/fresh-malwa-potatoes.webp", {"Variety": "Chipsona"}),
        ("Red Hybrid Nasik Onions 1kg", "Choithram Mandi", "pack", "1 kg", 4500, 3500, "Pungent thick-layered red onions with long kitchen shelf life.", "/product-images/fruits-vegetables/red-hybrid-onions.webp", {"Origin": "Nashik"}),
        ("Ripe Country Tomatoes (Desi Tamatar) 1kg", "Choithram Mandi", "pack", "1 kg", 4000, 2800, "Tangy desi tomatoes with juicy pulp for rich curries.", "/product-images/fruits-vegetables/ripe-country-tomatoes.webp", {"Type": "Country Desi"}),
        ("Baby Potatoes for Dum Aloo 1kg", "Choithram Mandi", "pack", "1 kg", 4500, 3200, "Small round unblemished potatoes for festive Dum Aloo.", "/product-images/fruits-vegetables/fresh-malwa-potatoes.webp", {"Size": "Baby 25-30mm"}),
        ("Fresh White Sweet Onions 1kg", "Choithram Mandi", "pack", "1 kg", 6000, 4800, "Mild sweet white onions popular for raita and garnishing.", "/product-images/fruits-vegetables/red-hybrid-onions.webp", {"Type": "White Onion"}),
        ("Firm Hybrid Salad Tomatoes 1kg", "Choithram Mandi", "pack", "1 kg", 4500, 3200, "Smooth firm round tomatoes with thick walls for slicing.", "/product-images/fruits-vegetables/ripe-country-tomatoes.webp", {"Type": "Hybrid Salad"}),
        ("Large Jyoti Potatoes 5kg Value Sack", "Choithram Mandi", "bag", "5 kg", 15000, 11500, "Bulk sack of large golden Jyoti potatoes for family cooking.", "/product-images/fruits-vegetables/fresh-malwa-potatoes.webp", {"Pack": "Jute Bag"}),
        ("Small Shallots (Sambar Onions) 500g", "Choithram Mandi", "pack", "500 g", 5500, 4200, "Piquant baby shallots for authentic South Indian sambar.", "/product-images/fruits-vegetables/red-hybrid-onions.webp", {"Type": "Shallots"}),
        ("Fresh Madhya Pradesh Garlic (Lahsun) 250g", "Choithram Mandi", "pack", "250 g", 8500, 6900, "Aromatic white garlic cloves with intense pungency.", "/product-images/fruits-vegetables/fresh-malwa-potatoes.webp", {"Origin": "Mandsaur, MP"}),
        ("Fresh Washed Mountain Ginger (Adrak) 250g", "Choithram Mandi", "pack", "250 g", 6000, 4500, "Spicy fibrous ginger roots for morning adrak chai and marinades.", "/product-images/fruits-vegetables/fresh-ginger.webp", {"Type": "Washed Ginger"})
    ],
    # 8 Leafy Greens
    "leafy-greens": [
        ("Fresh Farm Palak (Spinach) 250g Bunch", "Indore Greens", "bunch", "250 g", 3000, 2000, "Tender broad-leafed dark green spinach for palak paneer.", "/product-images/fruits-vegetables/fresh-coriander.webp", {"Leaves": "Tender"}),
        ("Fresh Country Methi (Fenugreek) 250g Bunch", "Indore Greens", "bunch", "250 g", 3500, 2200, "Small-leafed aromatic desi methi for methi thepla and parathas.", "/product-images/fruits-vegetables/fresh-coriander.webp", {"Variety": "Desi Kasuri"}),
        ("Aromatic Country Coriander (Dhaniya) 100g", "Indore Greens", "bunch", "100 g", 2000, 1200, "Root-intact fragrant desi coriander leaves for fresh garnishing.", "/product-images/fruits-vegetables/fresh-coriander.webp", {"Aroma": "Intense"}),
        ("Fresh Desi Pudina (Mint Leaves) 100g", "Indore Greens", "bunch", "100 g", 2000, 1200, "Cooling fragrant mint leaves for zesty green chutney.", "/product-images/fruits-vegetables/fresh-coriander.webp", {"Type": "Garden Mint"}),
        ("Winter Sarson Saag Leaves 500g", "Indore Greens", "bunch", "500 g", 4500, 3200, "Nutritious mustard greens for authentic Punjabi Sarson ka Saag.", "/product-images/fruits-vegetables/fresh-coriander.webp", {"Season": "Winter"}),
        ("Red Chaulai Saag (Amaranth Leaves) 250g", "Indore Greens", "bunch", "250 g", 3000, 2000, "Iron-dense red and green amaranth leaves for stir-fries.", "/product-images/fruits-vegetables/fresh-coriander.webp", {"Nutrient": "Iron"}),
        ("Fresh Spring Onions with Bulbs 250g", "Indore Greens", "bunch", "250 g", 3500, 2500, "Crisp green scallion stalks with sweet tender white bulbs.", "/product-images/fruits-vegetables/red-hybrid-onions.webp", {"Type": "Scallions"}),
        ("Fresh Aromatic Curry Leaves (Kadi Patta) 50g", "Indore Greens", "pack", "50 g", 1500, 1000, "Directly harvested fresh curry sprigs for fragrant South Indian tempering.", "/product-images/fruits-vegetables/fresh-coriander.webp", {"Aroma": "Fresh"}),
    ],
    # 12 Seasonal Fruits
    "seasonal-fruits": [
        ("Kashmiri Shimla Apples 1kg Pack", "Him Fresh", "pack", "1 kg", 18000, 14500, "Crisp sweet red apples from Himachal and Kashmir orchards.", "/product-images/fruits-vegetables/shimla-apples.webp", {"Origin": "Himachal"}),
        ("Fresh Robusta Bananas 1 Dozen", "Malwa Mandi", "dozen", "12 pcs", 7000, 5500, "Naturally ripened yellow bananas rich in potassium and energy.", "/product-images/fruits-vegetables/fresh-bananas.webp", {"Variety": "Robusta"}),
        ("Sweet Honey Papaya 1pc (~1kg)", "Malwa Mandi", "piece", "1 pc (~1kg)", 7500, 5500, "Deep orange juicy flesh with digestive enzymes.", "/product-images/fruits-vegetables/fresh-bananas.webp", {"Sweetness": "High"}),
        ("Crisp Country Guavas (Amrood) 1kg", "Malwa Mandi", "pack", "1 kg", 8000, 6000, "White flesh crunchy guavas with sweet fragrant centre.", "/product-images/fruits-vegetables/fresh-bananas.webp", {"Vitamin C": "Rich"}),
        ("Ruby Red Pomegranate (Anaar) 1kg", "Malwa Mandi", "pack", "1 kg", 22000, 17900, "Jewel-like dark red juicy arils rich in antioxidants.", "/product-images/fruits-vegetables/ripe-country-tomatoes.webp", {"Arils": "Sweet Red"}),
        ("Sweet Striped Watermelon 1pc (~2.5kg)", "Malwa Mandi", "piece", "1 pc (2.5kg)", 9000, 6900, "Quenching sweet red pulp with crisp hydration.", "/product-images/fruits-vegetables/fresh-bananas.webp", {"Weight": "2.5 kg"}),
        ("Aromatic Musk Melon (Kharbooza) 1pc", "Malwa Mandi", "piece", "1 pc (~1kg)", 6500, 4800, "Sweet fragrant orange pulp with delicate floral honey notes.", "/product-images/fruits-vegetables/fresh-bananas.webp", {"Variety": "Musk Melon"}),
        ("Nagpur Sweet Oranges (Santra) 1kg", "Nagpur Orchards", "pack", "1 kg", 12000, 9500, "Juicy thin-skinned winter oranges bursting with Vitamin C.", "/product-images/fruits-vegetables/fresh-lemon.webp", {"Origin": "Nagpur"}),
        ("Imported Royal Gala Apples 1kg", "Global Orchards", "pack", "1 kg", 24000, 19500, "Fine textured sweet crisp apples with blush stripes.", "/product-images/fruits-vegetables/shimla-apples.webp", {"Grade": "Royal Gala"}),
        ("Yelakki Small Bananas 500g", "South Harvest", "pack", "500 g", 6000, 4500, "Tiny cardamom-scented sweet table bananas.", "/product-images/fruits-vegetables/fresh-bananas.webp", {"Type": "Elaichi Banana"}),
        ("Black Seedless Sweet Grapes 500g Box", "Nashik Valley", "box", "500 g", 9500, 7500, "Crisp sweet black globe grapes rich in resveratrol.", "/product-images/fruits-vegetables/fresh-bananas.webp", {"Seedless": "Yes"}),
        ("Thompson Seedless Green Grapes 500g Box", "Nashik Valley", "box", "500 g", 8500, 6500, "Plump crunchy green grapes with balanced tart sweetness.", "/product-images/fruits-vegetables/fresh-bananas.webp", {"Variety": "Thompson"})
    ],
    # 5 Citrus & Tropical
    "citrus-tropical-fruits": [
        ("Fresh Juicy Yellow Lemons (Nimbu) 250g", "Malwa Mandi", "pack", "250 g", 4000, 2800, "Thin-skinned juicy sour lemons for shikanji and dressings.", "/product-images/fruits-vegetables/fresh-lemon.webp", {"Acidity": "Zesty"}),
        ("Sweet Lime (Mosambi) 1kg", "Nagpur Orchards", "pack", "1 kg", 11000, 8500, "Refreshing mild citrus fruit packed with electrolytes.", "/product-images/fruits-vegetables/fresh-lemon.webp", {"Juice Content": "High"}),
        ("Devgad Alphonso Mangoes (Hapus) 1kg Box", "Ratnagiri Farms", "box", "1 kg", 65000, 52000, "King of Mangoes with unmatched saffron aroma and buttery pulp.", "/product-images/fruits-vegetables/alphonso-mangoes.webp", {"GI Tag": "Devgad Hapus"}),
        ("Fresh Queen Pineapple 1pc (~1kg)", "Assam Harvest", "piece", "1 pc (~1kg)", 9500, 7500, "Spiky tropical crown fruit with golden sweet tart core.", "/product-images/fruits-vegetables/fresh-bananas.webp", {"Origin": "Northeast"}),
        ("Gir Kesar Sweet Mangoes 1kg Box", "Gir Orchards", "box", "1 kg", 45000, 36000, "Queen of Mangoes known for radiant saffron color and sweet pulp.", "/product-images/fruits-vegetables/alphonso-mangoes.webp", {"Type": "Kesar"})
    ]
}

veg_idx = 1
for sub, list_items in veg_sub_map.items():
    for itm in list_items:
        add_item("VEG", veg_idx, itm[0], itm[1], "Fruits & Vegetables", "fruits-vegetables", sub, "PRODUCE", itm[2], itm[3], itm[4], itm[5], itm[6], itm[6], itm[7], itm[8], ["vegetable", "fruit", "fresh", itm[0].lower().split()[0]], ["produce", "fresh"])
        veg_idx += 1
print(f"Total after fruits & veg: {len(products)} (Expected 150)")

# -------------------------------------------------------------
# 3. CLOTHING & FASHION (70 products)
# -------------------------------------------------------------
fashion_sub_map = {
    # 15 Mens Shirts & Tshirts
    "mens-shirts-tshirts": [
        ("Raymond Classic White Pure Cotton Formal Shirt", "Raymond", "piece", "Size 40", 229900, 189900, "Crisp 100% Giza cotton business shirt.", "/brand/placeholders/fashion.svg", {"Fabric": "100% Cotton"}),
        ("Peter England Sky Blue Slim Fit Formal Shirt", "Peter England", "piece", "Size 42", 159900, 129900, "Breathable wrinkle-resistant formal workwear shirt.", "/brand/placeholders/fashion.svg", {"Fit": "Slim"}),
        ("FabIndia Handloom Khadi Cotton Short Kurta", "FabIndia", "piece", "Size L", 189000, 159000, "Handwoven khadi breathable casual short kurta.", "/brand/placeholders/fashion.svg", {"Weave": "Khadi Handloom"}),
        ("Van Heusen French Blue Premium Linen Casual Shirt", "Van Heusen", "piece", "Size 40", 289900, 239900, "Pure European linen casual holiday shirt.", "/brand/placeholders/fashion.svg", {"Material": "100% Linen"}),
        ("Allen Solly Classic Solid Pique Polo T-Shirt", "Allen Solly", "piece", "Size L", 129900, 99900, "Signature embroidered stag logo ribbed collar polo.", "/brand/placeholders/fashion.svg", {"Style": "Polo"}),
        ("US Polo Assn Heather Grey Crew Neck Tee", "US Polo", "piece", "Size M", 99900, 79900, "Combed cotton daily wear casual graphic t-shirt.", "/brand/placeholders/fashion.svg", {"Neck": "Crew Neck"}),
        ("Levi's Original Housemark Graphic Batwing T-Shirt", "Levi's", "piece", "Size L", 149900, 119900, "Iconic red batwing logo print on soft cotton jersey.", "/brand/placeholders/fashion.svg", {"Cotton": "100%"}),
        ("Louis Philippe Striped Royal Business Shirt", "Louis Philippe", "piece", "Size 42", 249900, 199900, "Fine single-needle stitched formal executive shirt.", "/brand/placeholders/fashion.svg", {"Finish": "Silk Soft"}),
        ("Flying Machine Waffle Knit Henley Neck T-Shirt", "Flying Machine", "piece", "Size M", 119900, 89900, "Textured waffle cotton casual 3-button henley tee.", "/brand/placeholders/fashion.svg", {"Collar": "Henley"}),
        ("Park Avenue Micro Check Formal Office Shirt", "Park Avenue", "piece", "Size 40", 179900, 144900, "Smart micro checks tailored with crisp collar stays.", "/brand/placeholders/fashion.svg", {"Sleeve": "Full"}),
        ("Wrogn Slim Fit Solid Olive Green Casual Shirt", "Wrogn", "piece", "Size L", 169900, 134900, "Contemporary street style casual cotton shirt.", "/brand/placeholders/fashion.svg", {"Wash": "Enzyme"}),
        ("Arrow Signature President Non-Iron White Shirt", "Arrow", "piece", "Size 42", 299900, 249900, "Taped seams non-iron taped luxury executive shirt.", "/brand/placeholders/fashion.svg", {"Iron": "Non-Iron"}),
        ("Being Human Graphic Organic Cotton Casual Tee", "Being Human", "piece", "Size L", 109900, 84900, "Comfortable organic cotton tee with positive slogan.", "/brand/placeholders/fashion.svg", {"Organic": "Yes"}),
        ("Highlander Mandarin Collar Linen Blend Casual Shirt", "Highlander", "piece", "Size M", 129900, 89900, "Minimalist Chinese collar shirt in breathable cotton linen.", "/brand/placeholders/fashion.svg", {"Collar": "Mandarin"}),
        ("Monte Carlo Casual Solid Mercerised Cotton Polo", "Monte Carlo", "piece", "Size XL", 155000, 125000, "Lustrous mercerised double yarn luxury polo shirt.", "/brand/placeholders/fashion.svg", {"Yarn": "Mercerised"})
    ],
    # 10 Mens Trousers & Denims
    "mens-trousers-denims": [
        ("Levi's 511 Slim Fit Stretch Blue Denims", "Levi's", "piece", "Size 32", 369900, 299900, "Classic 5-pocket slim fit stretchable denim jeans.", "/brand/placeholders/fashion.svg", {"Fit": "511 Slim"}),
        ("Raymond Formal Flat-Front Dark Grey Trousers", "Raymond", "piece", "Size 34", 219900, 179900, "Smart wool blend poly-viscose office formal trousers.", "/brand/placeholders/fashion.svg", {"Front": "Flat"}),
        ("Peter England Khaki Cotton Stretch Chino Pants", "Peter England", "piece", "Size 32", 179900, 139900, "Smart casual versatile chinos with coin pocket.", "/brand/placeholders/fashion.svg", {"Type": "Chino"}),
        ("Allen Solly Casual Cotton Slim Trousers Navy", "Allen Solly", "piece", "Size 34", 199900, 159900, "Friday dressing smart casual stretch trousers.", "/brand/placeholders/fashion.svg", {"Color": "Navy"}),
        ("Spykar Skinny Fit Dark Indigo Wash Jeans", "Spykar", "piece", "Size 30", 279900, 219900, "Whiskered dark wash stretchable street denims.", "/brand/placeholders/fashion.svg", {"Rise": "Mid"}),
        ("Van Heusen Wrinkle-Resistant Black Formal Pants", "Van Heusen", "piece", "Size 32", 229900, 189900, "Sharp tailored crease-resistant dress trousers.", "/brand/placeholders/fashion.svg", {"Crease": "Permanent"}),
        ("Killer Regular Fit Stonewashed Rugged Jeans", "Killer", "piece", "Size 34", 289900, 229900, "Heavy-duty durable authentic stonewashed cotton jeans.", "/brand/placeholders/fashion.svg", {"Weight": "12 Oz"}),
        ("Flying Machine Ankle Length Jogger Denim Jeans", "Flying Machine", "piece", "Size 32", 219900, 169900, "Elasticated cuffed ankle jogger pants in denim.", "/brand/placeholders/fashion.svg", {"Cuff": "Ribbed"}),
        ("Blackberrys Slim Fit Tailored Charcoal Trousers", "Blackberrys", "piece", "Size 34", 259900, 209900, "Refined boardroom fit formal dress trousers.", "/brand/placeholders/fashion.svg", {"Cut": "Tailored"}),
        ("Monte Carlo Premium Cotton Blend Trackpants", "Monte Carlo", "piece", "Size L", 149900, 119900, "Zipper pockets soft fleece lined lounge trackpants.", "/brand/placeholders/fashion.svg", {"Pockets": "Zipper"})
    ],
    # 15 Womens Sarees & Kurtis
    "womens-sarees-kurtis": [
        ("Authentic Handwoven Chanderi Silk Zari Saree", "Chanderi Weavers", "piece", "6.3m with Blouse", 599900, 489900, "Traditional Madhya Pradesh Chanderi silk saree with golden border.", "/brand/placeholders/fashion.svg", {"Origin": "Chanderi, MP"}),
        ("Maheshwari Handloom Cotton Silk Festive Saree", "Maheshwar Guild", "piece", "6.3m with Blouse", 450000, 369900, "Graceful reversible Maheshwari border handwoven saree.", "/brand/placeholders/fashion.svg", {"Origin": "Maheshwar, MP"}),
        ("FabIndia Pure Indigo Handblock Printed Cotton Kurti", "FabIndia", "piece", "Size M", 169000, 139000, "Natural vegetable dye indigo printed breathable long kurti.", "/brand/placeholders/fashion.svg", {"Dye": "Indigo Vegetable"}),
        ("Biba Flared Anarkali Kurta with Churidar & Dupatta", "Biba", "set", "3-Piece Set L", 399900, 319900, "Festive gold print anarkali suit set with sheer dupatta.", "/brand/placeholders/fashion.svg", {"Style": "Anarkali"}),
        ("W for Woman Printed Straight Cut Workwear Kurti", "W", "piece", "Size 38", 149900, 119900, "Geometric print contemporary smart office kurta.", "/brand/placeholders/fashion.svg", {"Neck": "Keyhole"}),
        ("Aurelia Floral Embroidered Festive Rayon Kurti", "Aurelia", "piece", "Size L", 179900, 139900, "Intricate thread embroidery on soft drape rayon fabric.", "/brand/placeholders/fashion.svg", {"Embroidery": "Resham"}),
        ("Soch Floral Embroidered Georgette Party Saree", "Soch", "piece", "6.3m with Blouse", 359800, 289900, "Lightweight flowy georgette with scalloped pearl border.", "/brand/placeholders/fashion.svg", {"Fabric": "Georgette"}),
        ("Libas Rayon Straight Kurta with Printed Palazzo Set", "Libas", "set", "2-Piece Set M", 199900, 154900, "Casual daywear matching kurta and wide palazzo set.", "/brand/placeholders/fashion.svg", {"Pattern": "Ethnic Motif"}),
        ("Global Desi Boho Fusion Printed Flared Tunic", "Global Desi", "piece", "Size M", 159900, 119900, "Indo-western fusion tunic with tassel tie-up details.", "/brand/placeholders/fashion.svg", {"Style": "Boho"}),
        ("Meena Bazaar Banarasi Katan Silk Brocade Saree", "Meena Bazaar", "piece", "6.3m with Blouse", 899900, 749900, "Opulent Varanasi zari floral jaal traditional bridal saree.", "/brand/placeholders/fashion.svg", {"Zari": "Gold Brocade"}),
        ("Go Colors 4-Way Stretch Cotton Churidar Leggings", "Go Colors", "piece", "Free Size", 69900, 59900, "Super combed cotton rich stretch churidar with gathered ankles.", "/brand/placeholders/fashion.svg", {"Stretch": "4-Way"}),
        ("House of Pataudi Royal Velvet Embroidered Kurti", "House of Pataudi", "piece", "Size L", 329900, 269900, "Rich micro-velvet fabric with intricate zardozi neckline.", "/brand/placeholders/fashion.svg", {"Fabric": "Velvet"}),
        ("Avaasa Daily Floral Print Straight Cotton Kurti", "Avaasa", "piece", "Size M", 89900, 69900, "Affordable breathable everyday floral print summer kurti.", "/brand/placeholders/fashion.svg", {"Fit": "Regular"}),
        ("Indya Pre-Stitched Ready-to-Wear Ruffled Saree", "Indya", "piece", "Size S-M", 345000, 275000, "Zip-and-wear contemporary ruffle saree for cocktail parties.", "/brand/placeholders/fashion.svg", {"Type": "Ready to Wear"}),
        ("Rangriti Geometric Print Mandarin Collar Kurti", "Rangriti", "piece", "Size L", 119900, 89900, "Vibrant colored contrast border daily ethnic top.", "/brand/placeholders/fashion.svg", {"Sleeve": "3/4th"})
    ],
    # 12 Womens Western & Casuals
    "womens-western-casuals": [
        ("Levi's 711 High-Rise Skinny Stretch Jeans Women", "Levi's", "piece", "Size 28", 329900, 259900, "Figure-hugging contour waistband premium stretch denims.", "/brand/placeholders/fashion.svg", {"Fit": "711 Skinny"}),
        ("FabIndia Hand Block Printed Cotton Peplum Top", "FabIndia", "piece", "Size M", 149000, 119000, "Sanganeri hand block print flared breathable summer top.", "/brand/placeholders/fashion.svg", {"Block": "Sanganeri"}),
        ("Vero Moda Floral Print Wrap Summer Midi Dress", "Vero Moda", "piece", "Size S", 299900, 229900, "Flattering v-neck wrap silhouette with waist tie-up belt.", "/brand/placeholders/fashion.svg", {"Length": "Midi"}),
        ("ONLY Solid Relaxed Fit White Cotton Casual Shirt", "ONLY", "piece", "Size M", 179900, 129900, "Classic boyfriend fit crisp white everyday cotton shirt.", "/brand/placeholders/fashion.svg", {"Fit": "Relaxed"}),
        ("Marks & Spencer Pure Linen Button-Through Shirt", "Marks & Spencer", "piece", "Size UK 10", 349900, 279900, "Cool breathable European flax linen shirt with patch pocket.", "/brand/placeholders/fashion.svg", {"Flax": "European"}),
        ("Madame Regular Fit Distressed Light Denim Jacket", "Madame", "piece", "Size M", 249900, 189900, "Vintage light blue wash cropped trucker denim jacket.", "/brand/placeholders/fashion.svg", {"Style": "Trucker"}),
        ("AND Polka Dot Print A-Line Sleeveless Midi Dress", "AND", "piece", "Size L", 259900, 199900, "Chic retro polka dot print dress with flared hemline.", "/brand/placeholders/fashion.svg", {"Print": "Polka Dot"}),
        ("Ginger by Lifestyle Striped Crew-Neck Casual Tee", "Ginger", "piece", "Size S", 69900, 49900, "Soft modal jersey knit horizontal nautical stripe tee.", "/brand/placeholders/fashion.svg", {"Knit": "Jersey"}),
        ("Global Desi High-Waisted Wide Leg Palazzo Pants", "Global Desi", "piece", "Size L", 169900, 129900, "Flowy viscose fabric wide leg trousers with elastic waist.", "/brand/placeholders/fashion.svg", {"Leg": "Wide"}),
        ("Forever New Ruffled Chiffon Evening Blouse", "Forever New", "piece", "Size 10", 319900, 249900, "Elegant tiered ruffles and sheer blouson sleeves.", "/brand/placeholders/fashion.svg", {"Fabric": "Chiffon"}),
        ("Tokyo Talkies High-Waist Vintage Wide Leg Jeans", "Tokyo Talkies", "piece", "Size 30", 189900, 139900, "90s throwback retro flared wide leg non-stretch jeans.", "/brand/placeholders/fashion.svg", {"Style": "90s Wide"}),
        ("Allen Solly Women Tailored Formal Office Trousers", "Allen Solly", "piece", "Size 30", 219900, 169900, "Sharp mid-rise straight leg formal corporate trousers.", "/brand/placeholders/fashion.svg", {"Cut": "Straight"})
    ],
    # 10 Kids Wear
    "kids-wear": [
        ("US Polo Kids Pure Cotton Graphic Polo T-Shirt", "US Polo Kids", "piece", "Age 6-7Y", 99900, 74900, "Soft pique cotton kids polo tee with signature embroidery.", "/brand/placeholders/fashion.svg", {"Fabric": "Pique"}),
        ("Mothercare Organic Cotton Baby Rompers 3-Pack", "Mothercare", "pack", "Age 0-6M", 149900, 119900, "Snaps closure nickel-free soft organic sleepsuits.", "/brand/placeholders/fashion.svg", {"Pack": "3 Rompers"}),
        ("FabIndia Kids Handblock Cotton Kurta Pajama Set", "FabIndia", "set", "Age 4-5Y", 189000, 149000, "Traditional ethnic festival suit for little boys.", "/brand/placeholders/fashion.svg", {"Print": "Block Print"}),
        ("Max Kids Stretch Denim Adjustable Dungaree Set", "Max Kids", "set", "Age 3-4Y", 129900, 99900, "Adjustable buckle straps dungarees with striped inner tee.", "/brand/placeholders/fashion.svg", {"Straps": "Adjustable"}),
        ("Gini & Jony Boys Checkered Casual Cotton Shirt", "Gini & Jony", "piece", "Age 8-9Y", 119900, 89900, "Multi-color checks woven cotton long sleeve shirt.", "/brand/placeholders/fashion.svg", {"Sleeve": "Roll-up"}),
        ("Hopscotch Girls Party Wear Princess Net Frock", "Hopscotch", "piece", "Age 5-6Y", 179900, 139900, "Sparkling sequin bodice with multi-layer puffy tulle skirt.", "/brand/placeholders/fashion.svg", {"Skirt": "Tulle Net"}),
        ("Lilliput Boys Elastic Waist Twill Chino Shorts", "Lilliput", "piece", "Age 7-8Y", 89900, 64900, "Breathable cotton twill shorts with drawstrings.", "/brand/placeholders/fashion.svg", {"Waist": "Elastic"}),
        ("Allen Solly Junior Girls Floral Ruffle Cotton Dress", "Allen Solly Junior", "piece", "Age 6-7Y", 139900, 104900, "Sweet ditsy floral print A-line summer dress with ruffles.", "/brand/placeholders/fashion.svg", {"Style": "A-Line"}),
        ("Biba Girls Printed Festive Lehenga Choli Set", "Biba Girls", "set", "Age 8-9Y", 279900, 219900, "Traditional kalidar lehenga skirt with matching dupatta.", "/brand/placeholders/fashion.svg", {"Occasion": "Festive"}),
        ("Benetton Kids Cotton Fleece Pullover Hoodie", "United Colors of Benetton", "piece", "Age 9-10Y", 169900, 129900, "Warm brushed fleece hoodie with iconic logo print.", "/brand/placeholders/fashion.svg", {"Hood": "Drawstring"})
    ],
    # 8 Winterwear & Thermals
    "winterwear-thermals": [
        ("Monte Carlo Pure Wool V-Neck Men's Cardigan", "Monte Carlo", "piece", "Size 40", 289000, 229000, "100% Australian merino wool button-down classic sweater.", "/brand/placeholders/fashion.svg", {"Wool": "Merino"}),
        ("FabIndia Handwoven Cashmere Woolen Stole", "FabIndia", "piece", "200x70 cm", 349000, 279000, "Feather-light warm fine wool shawl with delicate fringe.", "/brand/placeholders/fashion.svg", {"Weave": "Cashmere"}),
        ("Jockey Men's Thermal Long John Bottoms Charcoal", "Jockey", "piece", "Size L", 74900, 64900, "Super combed cotton rich brushed interlock thermal pants.", "/brand/placeholders/fashion.svg", {"Fit": "Snug"}),
        ("Jockey Women's Thermal Full Sleeve Round Neck Top", "Jockey", "piece", "Size M", 74900, 64900, "Featherweight warm inner layer with micro-ribbing.", "/brand/placeholders/fashion.svg", {"Thermal": "Heat Retention"}),
        ("Fort Collins Women Quilted Down Puffer Jacket", "Fort Collins", "piece", "Size L", 249900, 189900, "Windproof water-repellent warm insulated zip puffer coat.", "/brand/placeholders/fashion.svg", {"Insulation": "Polyfill"}),
        ("Duke Men Hooded Heavy Fleece Kangaroo Sweatshirt", "Duke", "piece", "Size XL", 179900, 134900, "Thick winter fleece hoodie with kangaroo pouch pockets.", "/brand/placeholders/fashion.svg", {"Fabric": "Heavy Fleece"}),
        ("Oswal Traditional Woolen Embroidered Shawl", "Oswal", "piece", "Free Size", 199900, 154900, "Jacquard weave traditional woolen wrap for elderly warmth.", "/brand/placeholders/fashion.svg", {"Weave": "Jacquard"}),
        ("Madame Women Ribbed Knit Warm Pullover Sweater", "Madame", "piece", "Size M", 189900, 144900, "Soft acrylic mohair blend high-neck winter knit sweater.", "/brand/placeholders/fashion.svg", {"Knit": "Ribbed Chunky"})
    ]
}

fas_idx = 1
for sub, list_items in fashion_sub_map.items():
    for itm in list_items:
        add_item("FAS", fas_idx, itm[0], itm[1], "Clothing & Fashion", "clothing-fashion", sub, "FASHION", itm[2], itm[3], itm[4], itm[5], itm[6], itm[6], itm[7], itm[8], ["clothing", "fashion", "apparel", itm[0].lower().split()[0]], ["fashion", "apparel"])
        fas_idx += 1
print(f"Total after clothing: {len(products)} (Expected 220)")

# -------------------------------------------------------------
# 4. BEAUTY & PERSONAL CARE (45 products)
# -------------------------------------------------------------
beauty_sub_map = {
    # 10 Skincare & Moisturisers
    "skincare-moisturisers": [
        ("Nivea Soft Light Moisturiser Cream 200ml", "Nivea", "jar", "200 ml", 36000, 29900, "Enriched with Jojoba oil and Vitamin E for non-greasy softness.", "/brand/placeholders/beauty.svg", {"Skin": "All Skin Types"}),
        ("Cetaphil Gentle Skin Cleanser 250ml", "Cetaphil", "bottle", "250 ml", 59900, 49900, "Dermatologist-recommended soap-free cleanser for sensitive skin.", "/brand/placeholders/beauty.svg", {"Type": "Soap Free"}),
        ("Biotique Morning Nectar Flawless Skin Lotion 190ml", "Biotique", "bottle", "190 ml", 28000, 21900, "Ayurvedic 100% botanical extract lightening moisturiser.", "/brand/placeholders/beauty.svg", {"Ayurvedic": "Yes"}),
        ("Himalaya Purifying Neem Face Wash 150ml", "Himalaya", "tube", "150 ml", 18000, 14900, "Herbal formula with neem and turmeric to combat pimples.", "/brand/placeholders/beauty.svg", {"Formula": "Soap Free"}),
        ("Neutrogena Ultra Sheer Dry-Touch Sunscreen SPF 50+", "Neutrogena", "tube", "88 ml", 67500, 54900, "Helioplex technology broad spectrum UVA/UVB matte sunscreen.", "/brand/placeholders/beauty.svg", {"SPF": "50+"}),
        ("Pond's Super Light Gel Oil-Free Moisturiser 100g", "Pond's", "jar", "100 g", 24900, 19900, "Infused with Hyaluronic Acid and Vitamin E for 24h water glow.", "/brand/placeholders/beauty.svg", {"Form": "Light Gel"}),
        ("Plum Green Tea Pore Cleansing Face Wash 120ml", "Plum", "tube", "120 ml", 34500, 28500, "Antioxidant green tea with gentle glycolic acid cellulose beads.", "/brand/placeholders/beauty.svg", {"Vegan": "100%"}),
        ("Mamaearth Ubtan Face Mask with Saffron 100g", "Mamaearth", "jar", "100 g", 49900, 41900, "Traditional turmeric and saffron de-tan clay mask.", "/brand/placeholders/beauty.svg", {"Toxin": "Free"}),
        ("Vaseline Deep Restore Intensive Care Lotion 400ml", "Vaseline", "bottle", "400 ml", 39900, 31900, "Micro-droplets of Vaseline jelly restoring dry winter skin.", "/brand/placeholders/beauty.svg", {"Restores": "Dry Skin"}),
        ("Forest Essentials Ayurvedic Rose Water Facial Mist 130ml", "Forest Essentials", "spray", "130 ml", 125000, 105000, "Pure steam distilled damask rose toner hydrating mist.", "/brand/placeholders/beauty.svg", {"Distillation": "Steam Pure"})
    ],
    # 10 Haircare & Shampoos
    "haircare-shampoos": [
        ("L'Oreal Paris Total Repair 5 Keratin Shampoo 650ml", "L'Oreal", "bottle", "650 ml", 59900, 47900, "Fights 5 visible hair damages: hair fall, dryness and split ends.", "/brand/placeholders/beauty.svg", {"Volume": "650 ml"}),
        ("Tresemme Keratin Smooth Argan Oil Shampoo 580ml", "Tresemme", "bottle", "580 ml", 57500, 45900, "Infused with Keratin and Argan oil for frizz-free salon hair.", "/brand/placeholders/beauty.svg", {"Frizz Control": "Up to 72h"}),
        ("Head & Shoulders Cool Menthol Anti-Dandruff 650ml", "Head & Shoulders", "bottle", "650 ml", 62000, 49900, "Clinically proven zinc pyrithione formula with cooling menthol.", "/brand/placeholders/beauty.svg", {"Anti-Dandruff": "Clinically Proven"}),
        ("Dove Intense Repair Keratin Actives Conditioner 175ml", "Dove", "tube", "175 ml", 22000, 17500, "Deep nourishment that restores smoothness along hair lengths.", "/brand/placeholders/beauty.svg", {"Damage Therapy": "Yes"}),
        ("Parachute 100% Pure Coconut Hair Oil 500ml", "Parachute", "bottle", "500 ml", 22000, 18500, "Naturally extracted coconut oil filtered 5 times for purity.", "/brand/placeholders/beauty.svg", {"Purity": "100% Edible Grade"}),
        ("Bajaj Almond Drops Non-Sticky Hair Oil 300ml", "Bajaj", "bottle", "300 ml", 24000, 19500, "Enriched with 6x Vitamin E to strengthen roots.", "/brand/placeholders/beauty.svg", {"Vitamin E": "6x"}),
        ("Indulekha Bringha Ayurvedic Anti Hair Fall Oil 100ml", "Indulekha", "bottle", "100 ml", 43200, 36500, "Selfie comb applicator oil with Bringharaj and 11 herbs.", "/brand/placeholders/beauty.svg", {"Applicator": "Selfie Comb"}),
        ("Matrix Biolage Smoothproof Professional Hair Serum 100ml", "Matrix", "bottle", "100 ml", 65000, 54500, "Camellia flower infused hair serum taming rebellious flyaways.", "/brand/placeholders/beauty.svg", {"Professional": "Yes"}),
        ("WOW Skin Science Red Onion Black Seed Hair Oil 200ml", "WOW", "bottle", "200 ml", 49900, 39900, "Cold-pressed onion oil combined with Moroccan argan oil.", "/brand/placeholders/beauty.svg", {"Mineral Oil": "Zero"}),
        ("Clinic Plus Strong & Long Health Milk Protein 650ml", "Clinic Plus", "bottle", "650 ml", 42500, 34500, "Essential milk protein formula that strengthens hair 35x.", "/brand/placeholders/beauty.svg", {"Protein": "Milk Protein"})
    ],
    # 8 Soaps & Body Wash
    "soaps-bodywash": [
        ("Dove White Cream Beauty Bathing Bar 125g (3-Pack)", "Dove", "pack", "3 x 125g", 24000, 19900, "1/4 moisturizing cream formulation preserving skin softness.", "/brand/placeholders/beauty.svg", {"Moisturizer": "1/4th Cream"}),
        ("Pears Pure & Gentle Glycerine Soap 125g (3-Pack)", "Pears", "pack", "3 x 125g", 25500, 20900, "Natural oils and pure glycerine bar gently cleansing skin.", "/brand/placeholders/beauty.svg", {"Glycerine": "98% Pure"}),
        ("Dettol Original Germ Protection Bathing Bar (4-Pack)", "Dettol", "pack", "4 x 125g", 26000, 21900, "Trusted pine fragrance protecting against 100 illness germs.", "/product-images/pharmacy/dettol-antiseptic.webp", {"Germ Protection": "99.9%"}),
        ("Fiama Blackcurrant & Bearberry Gel Bathing Bar (3-Pack)", "Fiama", "pack", "3 x 125g", 22500, 17900, "Exotic fruit extracts with skin conditioner gel formulation.", "/brand/placeholders/beauty.svg", {"Form": "Gel Bar"}),
        ("Nivea Frangipani & Oil Refreshing Shower Gel 250ml", "Nivea", "bottle", "250 ml", 24900, 19900, "Care oil pearls that transform into silky soft cleansing foam.", "/brand/placeholders/beauty.svg", {"Pearls": "Oil Infused"}),
        ("Palmolive Aroma Morning Tonic Bodywash 250ml", "Palmolive", "bottle", "250 ml", 22500, 17500, "Tangerine essential oil and lemongrass uplifting fragrance.", "/brand/placeholders/beauty.svg", {"Essential Oils": "Natural"}),
        ("Medimix Ayurvedic 18-Herb Classic Soap 125g (4-Pack)", "Medimix", "pack", "4 x 125g", 21000, 17500, "Handmade Ayurvedic bathing bar preventing body odor and blemishes.", "/brand/placeholders/beauty.svg", {"Herbs": "18 Ayurvedic"}),
        ("Santoor Sandalwood & Turmeric Soap 125g (4-Pack)", "Santoor", "pack", "4 x 125g", 19500, 16500, "Natural goodness of Chandan and Haldi for glowing youthful skin.", "/brand/placeholders/beauty.svg", {"Ingredients": "Chandan & Haldi"})
    ],
    # 5 Oral Hygiene
    "oral-dental-hygiene": [
        ("Colgate Total Whole Mouth Health Toothpaste 150g", "Colgate", "tube", "150 g", 15500, 12900, "Dual-zinc and arginine formula fighting plaque for 12 hours.", "/brand/placeholders/beauty.svg", {"Protection": "12h Antibacterial"}),
        ("Sensodyne Rapid Relief Clinically Proven Toothpaste 80g", "Sensodyne", "tube", "80 g", 21000, 17500, "Instant sensitivity relief within 60 seconds with stannous fluoride.", "/brand/placeholders/beauty.svg", {"Action": "Rapid 60s"}),
        ("Dabur Red Ayurvedic Natural Toothpaste 200g", "Dabur", "tube", "200 g", 13000, 10900, "Time-tested 13 Ayurvedic herbs including clove, pudina and tomar.", "/brand/placeholders/beauty.svg", {"Ayurvedic": "13 Herbs"}),
        ("Oral-B CrossAction Pro-Health Soft Toothbrush (4-Pack)", "Oral-B", "pack", "4 pcs", 18000, 13900, "CrissCross angled bristles removing 99% plaque in hard-to-reach spots.", "/brand/placeholders/beauty.svg", {"Bristles": "Angled Soft"}),
        ("Listerine Cool Mint Antiseptic Mouthwash 250ml", "Listerine", "bottle", "250 ml", 16000, 12900, "Kills 99.9% germs that cause bad breath and gum problems.", "/brand/placeholders/beauty.svg", {"Taste": "Cool Mint"})
    ],
    # 7 Mens Grooming
    "mens-grooming-deos": [
        ("Gillette Mach3 Turbo Razor with 2 Blade Cartridges", "Gillette", "pack", "1 Handle + 2 Blades", 44900, 36900, "3 anti-friction blades with comforting lubrication strip.", "/brand/placeholders/beauty.svg", {"Blades": "3 Turbo"}),
        ("Gillette Classic Menthol Thick Shaving Foam 418g", "Gillette", "can", "418 g", 26000, 21900, "Rich lubricating lather with cooling menthol sensation.", "/brand/placeholders/beauty.svg", {"Lather": "Extra Thick"}),
        ("Park Avenue Voyage Signature Deodorant Spray 150ml", "Park Avenue", "spray", "150 ml", 25000, 18900, "Masculine woody amber notes with 24-hour freshness lock.", "/brand/placeholders/beauty.svg", {"Fragrance": "Woody Amber"}),
        ("Fogg Fresh Oriental No-Gas Long Lasting Deodorant 120ml", "Fogg", "bottle", "120 ml", 27500, 21900, "Guaranteed 1000 sprays with zero aerosol wastage.", "/brand/placeholders/beauty.svg", {"Sprays": "1000 Guaranteed"}),
        ("Beardo Godfather Beard Growth & Conditioning Oil 50ml", "Beardo", "bottle", "50 ml", 35000, 27500, "Almond oil and argan oil blend conditioning coarse facial hair.", "/brand/placeholders/beauty.svg", {"Ingredients": "Almond & Argan"}),
        ("Old Spice Original Classic After Shave Splash 100ml", "Old Spice", "bottle", "100 ml", 28000, 22500, "The timeless aroma of masculinity cooling freshly shaved skin.", "/brand/placeholders/beauty.svg", {"Scent": "Original Classic"}),
        ("Nivea Men Deep Black Carbon Antibacterial Roll-On 50ml", "Nivea Men", "bottle", "50 ml", 19900, 15900, "Black carbon formula offering 48-hour sweat protection.", "/brand/placeholders/beauty.svg", {"Duration": "48h Protection"})
    ],
    # 5 Cosmetics
    "cosmetics-makeup": [
        ("Maybelline New York Colossal Kajal Waterproof Deep Black", "Maybelline", "stick", "0.35 g", 19900, 15900, "Smudge-proof 24-hour intense black pencil with aloe vera.", "/brand/placeholders/beauty.svg", {"Wear": "24h Smudgeproof"}),
        ("Lakme 9 to 5 Complexion Care CC Cream Beige 30g", "Lakme", "tube", "30 g", 35000, 27900, "Moisturizer and foundation hybrid with SPF 30 sun protection.", "/brand/placeholders/beauty.svg", {"Coverage": "Natural Glow"}),
        ("Maybelline Fit Me Matte + Poreless Liquid Foundation 30ml", "Maybelline", "bottle", "30 ml", 59900, 47900, "Micro-powders absorb shine and blur visible skin pores.", "/brand/placeholders/beauty.svg", {"Finish": "Matte Oil-Free"}),
        ("Lakme Enrich Matte Long Stay Lipstick Velvet Red", "Lakme", "stick", "4.2 g", 29500, 23500, "High color payoff matte lipstick enriched with olive and Vitamin E.", "/brand/placeholders/beauty.svg", {"Finish": "Velvet Matte"}),
        ("Faces Canada Magneteyes Volumizing Waterproof Mascara", "Faces Canada", "wand", "9.5 ml", 39900, 31900, "Curved silicone wand building dramatic lash volume without clumps.", "/brand/placeholders/beauty.svg", {"Waterproof": "Yes"})
    ]
}

bea_idx = 1
for sub, list_items in beauty_sub_map.items():
    for itm in list_items:
        add_item("BEA", bea_idx, itm[0], itm[1], "Beauty & Personal Care", "beauty-personal-care", sub, "BEAUTY", itm[2], itm[3], itm[4], itm[5], itm[6], itm[6], itm[7], itm[8], ["beauty", "cosmetics", "personal care", itm[0].lower().split()[0]], ["beauty", "grooming"])
        bea_idx += 1
print(f"Total after beauty: {len(products)} (Expected 265)")

# -------------------------------------------------------------
# 5. HOME, KITCHEN & DÉCOR (65 products)
# -------------------------------------------------------------
home_sub_map = {
    # 12 Cookware
    "cookware-cookers": [
        ("Prestige Deluxe Alpha Stainless Steel Pressure Cooker 3L", "Prestige", "piece", "3 Litre", 259000, 219900, "Alpha induction base pressure cooker with pressure indicator.", "/brand/placeholders/home.svg", {"Base": "Induction Alpha"}),
        ("Hawkins Classic Aluminium Pressure Cooker 5L", "Hawkins", "piece", "5 Litre", 225000, 189900, "Inner lid safety cooker with pressure-locked safety lid.", "/brand/placeholders/home.svg", {"Safety": "Inner Lid"}),
        ("Pigeon Non-Stick Flat Tawa for Roti & Dosa 28cm", "Pigeon", "piece", "28 cm", 99500, 74900, "5-layer non-stick coating with ergonomic bakelite handle.", "/brand/placeholders/home.svg", {"Coating": "5-Layer PTFE"}),
        ("Prestige Omega Deluxe Granite Kadai with Glass Lid 26cm", "Prestige", "piece", "26 cm (2.5L)", 179500, 139900, "Abrasion resistant granite finish non-stick kadai.", "/brand/placeholders/home.svg", {"Lid": "Toughened Glass"}),
        ("Wonderchef Royal Velvet Non-Stick 3-Piece Cookware Set", "Wonderchef", "set", "3 Pieces", 349900, 269900, "Includes frying pan, wok with lid and flat dosa tawa.", "/brand/placeholders/home.svg", {"Color": "Purple Velvet"}),
        ("Butterfly Premium Stainless Steel Milk Pan 1.5L", "Butterfly", "piece", "1.5 Litre", 89900, 69900, "Heavy sandwich bottom milk and tea boiling saucepan with spout.", "/brand/placeholders/home.svg", {"Bottom": "Sandwich Heavy"}),
        ("Meyer Pre-Seasoned Cast Iron Deep Skillet Pan 26cm", "Meyer", "piece", "26 cm", 249900, 199900, "Naturally non-stick cast iron pan enriching food with natural iron.", "/brand/placeholders/home.svg", {"Seasoning": "100% Vegetable Oil"}),
        ("Hawkins Futura Hard Anodised Deep Frying Pan 2.5L", "Hawkins", "piece", "2.5 Litre", 185000, 149900, "Non-reactive hard anodized surface with stainless steel lid.", "/brand/placeholders/home.svg", {"Hard Anodised": "Extra Thick"}),
        ("Vinod Stainless Steel Multipurpose Steamer with Idli Stand", "Vinod", "set", "3-Tier", 229900, 184900, "Cooks idlis, momos, dhokla and steamed vegetables cleanly.", "/brand/placeholders/home.svg", {"Tiers": "3 Containers"}),
        ("Bergner Tri-Ply Stainless Steel Casserole with Lid 20cm", "Bergner", "piece", "2.5 Litre", 289900, 229900, "3-layer construction ensuring 100% even heat without hotspots.", "/brand/placeholders/home.svg", {"Construction": "Tri-Ply 3.0mm"}),
        ("Pigeon Aluminium Outer Lid Pressure Cooker 2L", "Pigeon", "piece", "2 Litre", 129500, 99900, "Compact daily outer lid cooker for boiling dal and rice.", "/brand/placeholders/home.svg", {"Capacity": "2 Litre"}),
        ("Prestige Hard Anodised Tadka Pan with Long Handle", "Prestige", "piece", "10 cm", 49500, 39900, "Heavy gauge tadka pan for pouring hot mustard and ghee tempering.", "/brand/placeholders/home.svg", {"Type": "Tadka Pan"})
    ],
    # 12 Storage
    "kitchen-storage-containers": [
        ("Milton Thermosteel Flip Lid Insulated Water Flask 1000ml", "Milton", "piece", "1000 ml", 109900, 89900, "Double-walled vacuum insulation keeping water cold or hot for 24h.", "/brand/placeholders/home.svg", {"Insulation": "24h Vacuum"}),
        ("Cello Checkers Airtight Plastic Kitchen Storage Set of 18", "Cello", "set", "18 Containers", 169900, 129900, "BPA-free transparent modular kitchen grocery storage canisters.", "/brand/placeholders/home.svg", {"Pieces": "18 Set"}),
        ("Tupperware Heritage Modular Storage Container Set 4-Pack", "Tupperware", "set", "4 Units", 219900, 174900, "Airtight moisture-locking seals preserving spices and snacks.", "/brand/placeholders/home.svg", {"Seal": "Airtight Modular"}),
        ("Borosil Classic Glass Storage Jar with Bamboo Lid 800ml", "Borosil", "piece", "800 ml", 59500, 47500, "100% borosilicate clear glass jar for pasta, cookies and grains.", "/brand/placeholders/home.svg", {"Glass": "100% Borosilicate"}),
        ("Stainless Steel Traditional Masala Dani Spice Box 7-Cups", "Classic Steel", "piece", "Size 11 Inch", 119900, 89900, "Heavy gauge steel spice box with transparent lid and measuring spoon.", "/brand/placeholders/home.svg", {"Cups": "7 Stainless Bowls"}),
        ("Cello Aqua Fresh BPA-Free Fridge Water Bottles 1L (Set of 4)", "Cello", "set", "4 Bottles", 49900, 39900, "Break-resistant slim fridge water bottles with leak-proof screw caps.", "/brand/placeholders/home.svg", {"Material": "BPA Free PET"}),
        ("Milton Micro Wow Insulated Roti Casserole Set of 3", "Milton", "set", "3 Casseroles", 149900, 119900, "Keeps chapatis and curries piping hot for up to 6 hours.", "/brand/placeholders/home.svg", {"Sizes": "1000, 1500, 2000ml"}),
        ("Signoraware Best Executive Stainless Steel Tiffin with Bag", "Signoraware", "set", "3 Containers + Bag", 115000, 89900, "Airtight leak-proof office lunchbox set with insulated jacket.", "/brand/placeholders/home.svg", {"Jacket": "Thermal Insulated"}),
        ("Nayasa Multipurpose 3-Tier Kitchen Rolling Trolley Rack", "Nayasa", "piece", "3 Tiers", 139900, 109900, "Heavy-duty plastic rolling basket rack for onions, potatoes and spices.", "/brand/placeholders/home.svg", {"Wheels": "Caster Wheels"}),
        ("Stainless Steel Heavy Grain Storage Drum Tank 25kg", "Classic Steel", "piece", "25 kg Capacity", 249900, 199900, "Pest-proof stainless steel drum with locking lid for wheat and rice.", "/brand/placeholders/home.svg", {"Capacity": "25 kg"}),
        ("Borosil Klip N Store Airtight Glass Lunch Box 3-Piece", "Borosil", "set", "3 Glass Bowls", 139500, 109900, "Microwave safe, oven proof glass tiffin containers with snap lids.", "/brand/placeholders/home.svg", {"Microwave": "Safe"}),
        ("Cello Modustack Plastic Container Set of 4 (1500ml)", "Cello", "set", "4 Pieces", 99900, 79900, "Space-saving stackable modular canisters with textured grip.", "/brand/placeholders/home.svg", {"Stackable": "Yes"})
    ],
    # 8 Dinnerware
    "dinnerware-crockery": [
        ("Corelle Classic Winter Frost White 16-Piece Dinner Set", "Corelle", "set", "16 Pieces", 499900, 399900, "Triple-layer Vitrelle glass chip-resistant lightweight dinnerware.", "/brand/placeholders/home.svg", {"Glass": "Vitrelle Chip-Proof"}),
        ("Milton Melamine Flora 24-Piece Luxurious Dinner Set", "Milton", "set", "24 Pieces", 279900, 219900, "Floral print 100% food grade break-resistant melamine plates.", "/brand/placeholders/home.svg", {"Grade": "100% Melamine"}),
        ("Vinod Stainless Steel Royal Thali Set of 6", "Vinod", "set", "6 Full Sets", 329900, 259900, "Traditional heavyweight Indian dining thalis with bowls and tumblers.", "/brand/placeholders/home.svg", {"Steel": "High Grade 18/8"}),
        ("Borosil Larah Opalware Green Leaves Dinner Set 18-Piece", "Borosil", "set", "18 Pieces", 199500, 159900, "Bone ash free translucent opal glass microwave safe dinner plates.", "/brand/placeholders/home.svg", {"Opalware": "100% Bone Ash Free"}),
        ("Ocean Imperial Water Beverage Tumblers (Set of 6)", "Ocean", "set", "6 Glasses", 89900, 69900, "Crystal clear lead-free soda lime glass drinkware.", "/brand/placeholders/home.svg", {"Clarity": "Crystal"}),
        ("Clay Craft Fine Ceramic Handcrafted Coffee Mugs (Set of 4)", "Clay Craft", "set", "4 Mugs", 79900, 59900, "Glazed earthenware mugs for morning milk tea and brewed coffee.", "/brand/placeholders/home.svg", {"Capacity": "320 ml"}),
        ("Treo by Milton Glass Dessert Pudding Bowls (Set of 6)", "Treo", "set", "6 Bowls", 69900, 54900, "Classic cut-glass bowls for serving kheer, ice creams and halwa.", "/brand/placeholders/home.svg", {"Design": "Cut Glass"}),
        ("Cello Royal Stainless Steel Cutlery Set 24-Piece with Stand", "Cello", "set", "24 Pieces", 129900, 99900, "Mirror polished forks, tablespoons, soup spoons and teaspoons.", "/brand/placeholders/home.svg", {"Stand": "Rotating Revolving"})
    ],
    # 12 Furnishings
    "furnishings-bedsheets": [
        ("Bombay Dyeing Pure Cotton King Size Bedsheet with 2 Pillow Covers", "Bombay Dyeing", "set", "King Double", 219900, 169900, "100% combed cotton breathable double bedsheet with ethnic prints.", "/brand/placeholders/home.svg", {"Fabric": "100% Cotton"}),
        ("Trident Indulgence 100% Cotton Queen Bedsheet Set", "Trident", "set", "Queen Double", 189900, 144900, "Soft touch peach finish floral printed bedsheet.", "/brand/placeholders/home.svg", {"Thread Count": "220 TC"}),
        ("Spaces Signature 300 TC Glace Cotton Bedsheet Set", "Spaces", "set", "King Double", 279900, 219900, "Luxury sateen weave silky smooth hotel quality bedding.", "/brand/placeholders/home.svg", {"Thread Count": "300 TC"}),
        ("Raymond Home Floral Cotton Single Bedsheet with Pillow Cover", "Raymond Home", "set", "Single", 119900, 89900, "Vibrant colorfast single bed cotton linen.", "/brand/placeholders/home.svg", {"Size": "Single"}),
        ("D'Decor Luxury Jacquard Silk Cushion Covers 16x16 (Set of 5)", "D'Decor", "set", "5 Covers", 149900, 114900, "Brocade zari weave sofa accent cushion cases with zipper.", "/brand/placeholders/home.svg", {"Closure": "Concealed Zip"}),
        ("Story@Home Blackout Eyelet Door Curtains 7 Feet (Set of 2)", "Story@Home", "set", "2 Curtains (7 Ft)", 169900, 129900, "Triple weave thermal blackout curtains with metal grommets.", "/brand/placeholders/home.svg", {"Light Blocking": "90%"}),
        ("Bombay Dyeing Microfibre Reversible AC Comforter Quilt", "Bombay Dyeing", "piece", "Double Quilt", 249900, 194900, "Hypoallergenic soft siliconized fiber light all-weather blanket.", "/brand/placeholders/home.svg", {"GSM": "200 GSM"}),
        ("Trident Cotton Bath Towels 500 GSM (Set of 2)", "Trident", "set", "2 Towels", 129900, 99900, "Super absorbent zero-twist plush cotton bath sheets.", "/brand/placeholders/home.svg", {"GSM": "500 GSM"}),
        ("SleepyCat Memory Foam Orthopedic Bed Pillow", "SleepyCat", "piece", "Standard", 169900, 129900, "Contoured pressure-relieving cervical support memory foam.", "/brand/placeholders/home.svg", {"Cover": "Aloe Infused"}),
        ("Kurlon Anti-Skid Cotton Tufted Door Floor Mat", "Kurlon", "piece", "40x60 cm", 49900, 39900, "High absorbency latex-backed anti-slip entrance doormat.", "/brand/placeholders/home.svg", {"Backing": "Latex Anti-Skid"}),
        ("Home Centre Reversible Single Plush Blanket", "Home Centre", "piece", "Single", 189900, 149900, "Ultra soft micro-flannel winter travel blanket.", "/brand/placeholders/home.svg", {"Material": "Flannel Fleece"}),
        ("Portico New York Bohemian Printed Diwan Set 6-Piece", "Portico", "set", "6 Pieces", 199900, 154900, "Includes 1 diwan sheet, 2 bolster covers and 3 cushion covers.", "/brand/placeholders/home.svg", {"Set": "Diwan Set"})
    ],
    # 8 Wall Decor
    "wall-decor-clocks": [
        ("Ajanta Quartz Wooden Finished Silent Sweep Wall Clock 32cm", "Ajanta", "piece", "32 cm", 89900, 69900, "No-ticking silent sweep mechanism with bold readable digits.", "/brand/placeholders/home.svg", {"Movement": "Silent Sweep"}),
        ("Titan Contemporary Minimalist Metal Wall Clock", "Titan", "piece", "30 cm", 229500, 179900, "Brushed metal frame with precision Japanese quartz movement.", "/brand/placeholders/home.svg", {"Brand": "Titan"}),
        ("Traditional Handcrafted Brass Radha Krishna Wall Hanging", "Indian Craft House", "piece", "12 Inch", 349900, 269900, "Solid heavy brass antique finish Hindu deity art plaque.", "/brand/placeholders/home.svg", {"Material": "Solid Brass"}),
        ("SAF Modern Botanical Canvas Art Framed Prints (Set of 3)", "SAF", "set", "3 Frames", 129900, 94900, "Matte laminated elegant leaf prints with black wooden frames.", "/brand/placeholders/home.svg", {"Frames": "MDF Wood"}),
        ("Medieval Brass Dhokra Art 6-Hook Key Holder Stand", "Tribal Crafts", "piece", "8 Inch", 119900, 89900, "Lost-wax cast indigenous brass tribal figures and hooks.", "/brand/placeholders/home.svg", {"Art": "Bastar Dhokra"}),
        ("Vintage Peacock Engraved Brass Diya Bell Hanging", "Indian Craft House", "piece", "15 Inch", 219900, 169900, "Traditional temple hanging diya with tinkling brass bell.", "/brand/placeholders/home.svg", {"Finish": "Antique Brass"}),
        ("Home Centre Modernist Geometric Metal Wall Accent Mirror", "Home Centre", "piece", "45 cm", 279900, 219900, "Sunburst golden metal wire framed decorative accent mirror.", "/brand/placeholders/home.svg", {"Frame": "Gold Metal"}),
        ("ArtzFolio Framed Lord Ganesha Tanjore Painting Gold Foil", "ArtzFolio", "piece", "14x18 Inch", 299900, 239900, "Embossed 22K gold foil finish spiritual home blessing frame.", "/brand/placeholders/home.svg", {"Gold": "Foil Embossed"})
    ],
    # 8 Cleaning Mops
    "cleaning-mops-bins": [
        ("Gala e-Quick Spin Mop with Microfibre Refill and Bucket", "Gala", "set", "Complete Set", 199900, 149900, "360-degree rotating spin mop with twin bucket wringer.", "/brand/placeholders/home.svg", {"Head": "Microfibre"}),
        ("Scotch-Brite Butterfly Heavy Duty Floor Wiper", "Scotch-Brite", "piece", "Wide 40 cm", 49900, 39900, "Single-swipe water drying rubber blade with durable steel rod.", "/brand/placeholders/home.svg", {"Blade": "Natural Rubber"}),
        ("Gala NoDust Broom Natural Grass Eco Floor Broom", "Gala", "piece", "Full Length", 35000, 27500, "Synthetic washable grass broom that sheds zero dust particles.", "/brand/placeholders/home.svg", {"Type": "Zero Dust"}),
        ("Scotch-Brite Heavy Duty Kitchen Scrub Sponge Pad (6-Pack)", "Scotch-Brite", "pack", "6 Sponges", 18000, 14500, "Stain cutter scrub surface with high soap holding sponge.", "/brand/placeholders/home.svg", {"Pack": "6 Units"}),
        ("Cello Classic Pedal Stainless Steel Step Dustbin 10L", "Cello", "piece", "10 Litre", 119900, 89900, "Hands-free foot pedal garbage bin with removable plastic bucket.", "/brand/placeholders/home.svg", {"Steel": "Anti-Rust"}),
        ("Scotch-Brite Microfibre All-Rounder Cleaning Cloths (3-Pack)", "Scotch-Brite", "pack", "3 Cloths", 29900, 23900, "Lifts grease, dust and grime without scratching delicate glass.", "/brand/placeholders/home.svg", {"Fibre": "Microfibre"}),
        ("Gala Double Lip Heavy Duty Floor Squeegee Wiper", "Gala", "piece", "Standard", 42000, 32500, "Double blade rubber squeegee for rapid bathroom floor drying.", "/brand/placeholders/home.svg", {"Lip": "Double Rubber"}),
        ("Colin Glass and Multi-Surface Cleaner Spray 500ml", "Colin", "spray", "500 ml", 12500, 10500, "Shine boosters removing fingerprints and dirt from glass and mirrors.", "/brand/placeholders/home.svg", {"Shine": "Streak-Free"})
    ],
    # 5 Kitchen Tools
    "kitchen-tools-knives": [
        ("Victorinox Swiss Classic Stainless Steel Chef Knife 20cm", "Victorinox", "piece", "20 cm", 169000, 139000, "Razor-sharp Swiss precision stainless steel multipurpose kitchen knife.", "/brand/placeholders/home.svg", {"Steel": "Swiss High Carbon"}),
        ("Pigeon Stainless Steel Knife Set with Wooden Block Stand (5-Piece)", "Pigeon", "set", "5 Knives + Stand", 99500, 74900, "Includes chef, bread, utility, paring knife and wooden stand.", "/brand/placeholders/home.svg", {"Block": "Natural Wood"}),
        ("Prestige Heavy Duty Stainless Steel Vegetable Peeler & Grater", "Prestige", "piece", "Dual Function", 39500, 29900, "Rust-resistant ultra sharp swivel peeling blade with potato eyer.", "/brand/placeholders/home.svg", {"Blade": "Swivel Sharp"}),
        ("Organic Neem Wood Heavy Duty Chopping Board 12x9 Inch", "EcoCraft", "piece", "12x9 Inch", 79900, 59900, "Naturally antimicrobial chemical-free durable hardwood cutting board.", "/brand/placeholders/home.svg", {"Wood": "Neem Antimicrobial"}),
        ("Ganesh Plastic Quick Vegetable Multi-Cutter with Peeler", "Ganesh", "piece", "Handheld", 29900, 19900, "5 stainless steel extra-sharp blades for rapid chilli and bean chopping.", "/brand/placeholders/home.svg", {"Blades": "5 Blades"})
    ]
}

hom_idx = 1
for sub, list_items in home_sub_map.items():
    for itm in list_items:
        add_item("HOM", hom_idx, itm[0], itm[1], "Home, Kitchen & Décor", "home-kitchen-decor", sub, "HOME", itm[2], itm[3], itm[4], itm[5], itm[6], itm[6], itm[7], itm[8], ["home", "kitchen", "decor", itm[0].lower().split()[0]], ["home", "cookware"])
        hom_idx += 1
print(f"Total after home: {len(products)} (Expected 330)")

# -------------------------------------------------------------
# 6. ELECTRONICS & ELECTRICAL DÉCOR (45 products)
# -------------------------------------------------------------
elec_sub_map = {
    # 10 LED Bulbs
    "led-bulbs-lights": [
        ("Philips 9W Cool Day White B22 LED Bulb (3-Pack)", "Philips", "pack", "3 Bulbs", 45000, 34900, "Energy saving 825 lumens glare-free bright LED bulbs with 1-year warranty.", "/brand/placeholders/electronics.svg", {"Base": "B22", "Wattage": "9W"}),
        ("Syska 9W Inverter Emergency Rechargeable LED Bulb", "Syska", "piece", "1 Bulb", 49900, 38900, "Up to 4 hours backup lighting during power outages.", "/brand/placeholders/electronics.svg", {"Backup": "4 Hours"}),
        ("Havells 20W LED Slim Batten Tubelight 4 Feet", "Havells", "piece", "4 Feet", 39900, 29900, "2000 lumens flicker-free room lighting with surge protection.", "/brand/placeholders/electronics.svg", {"Lumens": "2000 lm"}),
        ("Crompton 12W Energy Saver Cool Daylight B22 Bulb", "Crompton", "piece", "1 Bulb", 19900, 14900, "High lumen output for bright study and living room illumination.", "/brand/placeholders/electronics.svg", {"Wattage": "12W"}),
        ("Wipro Garnet 9W Smart Wi-Fi RGB Color LED Bulb", "Wipro", "piece", "1 Bulb", 89900, 64900, "16 million colors, voice control with Alexa & Google Assistant.", "/brand/placeholders/electronics.svg", {"Connectivity": "Wi-Fi"}),
        ("Philips 14W Round Recessed Ceiling Downlight Panel", "Philips", "piece", "1 Panel", 65000, 49900, "Slim edge-lit circular false ceiling spotlight.", "/brand/placeholders/electronics.svg", {"Cutout": "5 Inch"}),
        ("Syska 5W Warm White LED Bedside Night Bulb", "Syska", "piece", "1 Bulb", 12000, 8900, "Soft yellow warm ambient light for relaxed sleep.", "/brand/placeholders/electronics.svg", {"Color": "Warm White"}),
        ("Eveready 9W Base B22 Emergency Inverter Bulb", "Eveready", "piece", "1 Bulb", 45000, 34900, "Instant auto switch-on battery bulb during blackouts.", "/brand/placeholders/electronics.svg", {"Battery": "2200 mAh"}),
        ("Bajaj 50W High Wattage LED Hammer Bulb for Hallways", "Bajaj", "piece", "1 Bulb", 99900, 74900, "High-intensity industrial brightness for porches and godowns.", "/brand/placeholders/electronics.svg", {"Wattage": "50W"}),
        ("Havells Adore 7W Spot Focus Track Ceiling Lamp", "Havells", "piece", "1 Lamp", 79900, 59900, "Directional 360-degree swivel spotlight for wall art.", "/brand/placeholders/electronics.svg", {"Swivel": "360 Degree"})
    ],
    # 10 Decorative Festival Lights
    "decorative-festival-lights": [
        ("Warm White Copper Wire Fairy String Lights 10m USB", "Starlight", "piece", "10 Metres", 39900, 24900, "100 micro LEDs on moldable insulated copper wire.", "/brand/placeholders/electronics.svg", {"Power": "USB 5V"}),
        ("LED Waterfall Curtain Fairy String Lights 3x3m for Balcony", "Starlight", "piece", "3x3 Metres", 89900, 64900, "300 sparkling warm LEDs with 8 flashing controller modes.", "/brand/placeholders/electronics.svg", {"Modes": "8 Flashing"}),
        ("Multicolour Rice Bulb String Lights 15m for Festival Décor", "Starlight", "piece", "15 Metres", 29900, 19900, "Vibrant festive illumination for Diwali, Christmas and weddings.", "/brand/placeholders/electronics.svg", {"Length": "15m"}),
        ("Warm White Moroccan Metal Ball String Lights 4m", "Home Accent", "piece", "4 Metres", 59900, 42900, "Cut-work golden metal globes casting intricate geometric shadows.", "/brand/placeholders/electronics.svg", {"Balls": "16 Metal Globes"}),
        ("LED Floating Water Sensor Waterproof Candles (Set of 12)", "Starlight", "set", "12 Candles", 49900, 34900, "Smokeless flameless floating tea-lights for rangoli bowls.", "/brand/placeholders/electronics.svg", {"Sensor": "Water Activated"}),
        ("Star Shape Warm White LED Window Hanging Curtain Light", "Starlight", "piece", "12 Stars", 69900, 49900, "Alternating large and small hanging star lights with controller.", "/brand/placeholders/electronics.svg", {"Stars": "6 Large + 6 Small"}),
        ("Flexible Waterproof Outdoor Neon Rope Light Strip 5m", "Syska", "piece", "5 Metres", 99900, 74900, "Uniform dotless neon glow strip with 12V adapter for railings.", "/brand/placeholders/electronics.svg", {"Waterproof": "IP65"}),
        ("Solar Powered Outdoor Garden Stake LED Fairy Lights (8-Pack)", "EcoLite", "set", "8 Stakes", 119900, 89900, "Auto-charge daylight sensor walkway landscape lights.", "/brand/placeholders/electronics.svg", {"Solar": "Monocrystalline"}),
        ("Diwali Special Brass Electric Diya Chandelier Lamp", "Indian Craft House", "piece", "5 Diyas", 149900, 114900, "Traditional brass chandelier with safe LED glowing wicks.", "/brand/placeholders/electronics.svg", {"Material": "Brass + LED"}),
        ("USB Rotating Crystal Magic Ball Disco Party Lamp", "Zebronics", "piece", "Compact", 49900, 34900, "Sound activated RGB stage strobe light for indoor celebrations.", "/brand/placeholders/electronics.svg", {"Light": "RGB Disco"})
    ],
    # 10 Mobile Cables & Chargers
    "mobile-cables-chargers": [
        ("Boat Rugged 65W Braided Fast Charging Type-C Cable 1.5m", "Boat", "piece", "1.5 Metre", 49900, 34900, "Tough nylon braided cable supporting QC 3.0 and 65W fast charge.", "/brand/placeholders/electronics.svg", {"Output": "65W Fast"}),
        ("Mi 33W SonicCharge Fast USB Adapter Charger", "Mi", "piece", "1 Adapter", 99900, 74900, "BIS certified multi-layer surge protection power adapter.", "/brand/placeholders/electronics.svg", {"Wattage": "33W"}),
        ("Ambrane 20000mAh 20W Power Bank with Dual Output", "Ambrane", "piece", "20000 mAh", 199900, 149900, "Type-C PD fast charge compact power bank with LED indicator.", "/brand/placeholders/electronics.svg", {"Battery": "20000 mAh"}),
        ("Portronics Konnect CL Type-C to Lightning Braided Cord", "Portronics", "piece", "1.2 Metre", 59900, 39900, "MFi-spec high speed charging and sync cable for iPhone.", "/brand/placeholders/electronics.svg", {"Sync": "480 Mbps"}),
        ("Boat Type-C to Type-C 100W PD Power Delivery Cable 2m", "Boat", "piece", "2 Metre", 69900, 49900, "Fast charges laptops, MacBooks, tablets and smartphones.", "/brand/placeholders/electronics.svg", {"Power": "100W PD"}),
        ("Anker PowerDrive 24W Dual USB Port Car Charger", "Anker", "piece", "Dual Port", 129900, 89900, "PowerIQ technology safely charging two smartphones on the go.", "/brand/placeholders/electronics.svg", {"Ports": "2 USB"}),
        ("Zebronics 10000mAh Compact Slim Li-Polymer Power Bank", "Zebronics", "piece", "10000 mAh", 129900, 89900, "Pocket-friendly textured finish battery backup pack.", "/brand/placeholders/electronics.svg", {"Weight": "210g"}),
        ("Mi Dual USB 18W Fast Wall Charger Adapter", "Mi", "piece", "1 Adapter", 69900, 49900, "Charges two devices simultaneously with smart thermal control.", "/brand/placeholders/electronics.svg", {"Output": "18W Dual"}),
        ("Portronics 6-in-1 Multi-Device Universal Charging Cable", "Portronics", "piece", "1 Metre", 49900, 34900, "Combines Type-C, Micro-USB and Lightning in one cord.", "/brand/placeholders/electronics.svg", {"Heads": "3 Connectors"}),
        ("Realme 65W SuperDart Fast Charging Adapter and Cable", "Realme", "piece", "Adapter + Cable", 199900, 149900, "Gallium nitride high-efficiency flash charge combo.", "/brand/placeholders/electronics.svg", {"Charging": "SuperDart 65W"})
    ],
    # 5 Extension Boards
    "extension-boards-spikes": [
        ("GM Modular G-Power 4-Socket Surge Protector Board 2m", "GM Modular", "piece", "4 Sockets", 59900, 44900, "Safety shutter sockets with master switch and fuse reset.", "/brand/placeholders/electronics.svg", {"Length": "2m"}),
        ("Anchor Panasonic 4-Socket Heavy Duty Spike Guard 5m", "Anchor", "piece", "4 Sockets (5m)", 85000, 64900, "Heavy-duty copper wiring supporting desktop computers and TVs.", "/brand/placeholders/electronics.svg", {"Cord": "5 Metres"}),
        ("Havells 4-Way Multi-Plug Extension with Individual Switches", "Havells", "piece", "4 Sockets", 99900, 74900, "Individual LED power indicators for each appliance socket.", "/brand/placeholders/electronics.svg", {"Switches": "Individual"}),
        ("Portronics Power Plate 7 Multi-Socket Board with 6 USB Ports", "Portronics", "piece", "8 In 1", 149900, 109900, "Surge protected desktop charging hub with 6 smart USB ports.", "/brand/placeholders/electronics.svg", {"USB Ports": "6 Ports"}),
        ("Cona Smartec 3-Pin Universal Multi-Plug Travel Adapter", "Cona", "piece", "1 Unit", 24900, 16900, "Converts international pin plugs into standard Indian 3-pin wall sockets.", "/brand/placeholders/electronics.svg", {"Safety": "Earthing"}),
    ],
    # 5 Table Lamps
    "table-lamps-study": [
        ("Wipro 6W Rechargeable Eye-Care LED Study Desk Lamp", "Wipro", "piece", "1 Lamp", 129900, 89900, "Touch sensor 3-level brightness dimming with flexible gooseneck.", "/brand/placeholders/electronics.svg", {"Dimming": "3 Levels"}),
        ("Philips Pivot 5W Flexible Neck LED Table Reading Lamp", "Philips", "piece", "1 Lamp", 149900, 109900, "Glare-free diffused beam designed for students and late-night work.", "/brand/placeholders/electronics.svg", {"Neck": "Flexible"}),
        ("Baseus Magnetic Stepless Dimming Wardrobe Night Light", "Baseus", "piece", "1 Unit", 119900, 84900, "Detachable magnetic base rechargeable stick-on mirror lamp.", "/brand/placeholders/electronics.svg", {"Mount": "Magnetic"}),
        ("Syska LED Touch Light with Pen and Mobile Stand Holder", "Syska", "piece", "1 Unit", 99900, 69900, "Desk organizer lamp with multi-compartment stationery stand.", "/brand/placeholders/electronics.svg", {"Feature": "Pen Stand"}),
        ("Amber Ambient Wooden Base Himalayan Rock Salt Lamp 2kg", "Natural Salt", "piece", "2 kg", 129900, 89900, "Hand-carved pink crystal salt casting soothing warm glow.", "/brand/placeholders/electronics.svg", {"Material": "Rock Salt"})
    ],
    # 5 Audio Accessories
    "audio-accessories": [
        ("Boat Bassheads 100 In-Ear Wired Earphones with HD Mic", "Boat", "piece", "Wired", 49900, 34900, "10mm dynamic drivers delivering super extra bass with inline mic.", "/brand/placeholders/electronics.svg", {"Drivers": "10mm Bass"}),
        ("Boult Audio ProBass Curve Wireless Bluetooth Neckband", "Boult Audio", "piece", "Neckband", 149900, 89900, "12 hours playtime with magnetic earbuds and vibration alert.", "/brand/placeholders/electronics.svg", {"Battery": "12 Hours"}),
        ("Portronics SoundDrum 15W Portable Bluetooth Speaker with FM", "Portronics", "piece", "1 Speaker", 199900, 139900, "Water-resistant IPX6 outdoor stereo sound speaker with handsfree mic.", "/brand/placeholders/electronics.svg", {"Power": "15W Stereo"}),
        ("Zebronics Zeb-Bro In-Ear Wired Stereo Earphones 3.5mm Jack", "Zebronics", "piece", "Wired", 29900, 17900, "Comfortable snug fit earbuds with deep bass and calling button.", "/brand/placeholders/electronics.svg", {"Jack": "3.5mm"}),
        ("Portronics Modesk Universal Aluminium Mobile Desk Stand Holder", "Portronics", "piece", "1 Stand", 39900, 24900, "Adjustable viewing angle metal desk stand with anti-skid silicone pads.", "/brand/placeholders/electronics.svg", {"Material": "Aluminium"})
    ]
}

elec_idx = 1
for sub, list_items in elec_sub_map.items():
    for itm in list_items:
        add_item("ELE", elec_idx, itm[0], itm[1], "Electronics & Electrical Décor", "electronics-electrical-decor", sub, "ELECTRONICS", itm[2], itm[3], itm[4], itm[5], itm[6], itm[6], itm[7], itm[8], ["electronics", "gadgets", "lights", itm[0].lower().split()[0]], ["electronics", "lighting"])
        elec_idx += 1
print(f"Total after electronics: {len(products)} (Expected 375)")

# -------------------------------------------------------------
# 7. JEWELLERY & ACCESSORIES (45 products)
# -------------------------------------------------------------
jewel_sub_map = {
    # 10 Jhumka Earrings
    "traditional-jhumka-earrings": [
        ("Voylla Oxidised Silver Peacock Chandbali Jhumkas", "Voylla", "pair", "1 Pair", 129900, 89900, "Intricately detailed peacock motif oxidised bohemian earrings.", "/brand/placeholders/jewellery.svg", {"Metal": "Oxidised Silver"}),
        ("Zaveri Pearls Gold-Plated Meenakari Pearl Jhumki", "Zaveri Pearls", "pair", "1 Pair", 149900, 99900, "Handcrafted meenakari enamel floral dome jhumkas with pearl beads.", "/brand/placeholders/jewellery.svg", {"Plating": "22K Gold"}),
        ("Sukkhi Royal Kundan Drop Jhumkas with Ruby Stones", "Sukkhi", "pair", "1 Pair", 99900, 69900, "Traditional rajputana style kundan stone encrusted festive earrings.", "/brand/placeholders/jewellery.svg", {"Stones": "Kundan & Ruby"}),
        ("Karatcart Antique Temple Jewellery Earrings with Pearls", "Karatcart", "pair", "1 Pair", 119900, 79900, "Goddess Lakshmi engraved matte gold finish temple earrings.", "/brand/placeholders/jewellery.svg", {"Style": "Temple Art"}),
        ("Giva 925 Sterling Silver Classic Solitaire Stud Earrings", "Giva", "pair", "1 Pair", 179900, 139900, "Hallmarked pure 925 sterling silver brilliant cubic zirconia studs.", "/brand/placeholders/jewellery.svg", {"Silver": "925 Pure"}),
        ("Priyaasi Brass Gold-Plated Kundan Dangler Earrings", "Priyaasi", "pair", "1 Pair", 135000, 89900, "Dazzling multi-tier dangler chandelier earrings for wedding receptions.", "/brand/placeholders/jewellery.svg", {"Design": "Chandelier"}),
        ("Shining Diva Ethnic Bollywood Bahubali Ear Chain Jhumka", "Shining Diva", "pair", "1 Set", 99900, 64900, "Over-the-ear hanging chain hair support festive jhumkas.", "/brand/placeholders/jewellery.svg", {"Type": "Kan Chain"}),
        ("Shaze Silver Plated Crystal Cluster Stud Earrings", "Shaze", "pair", "1 Pair", 249900, 189900, "Contemporary cocktail party statement crystal studs.", "/brand/placeholders/jewellery.svg", {"Crystals": "Swarovski"}),
        ("Tribe Amrapali Tribal Silver Coin Drop Earrings", "Amrapali", "pair", "1 Pair", 299900, 229900, "Authentic rustic Rajasthani tribal coin motif artisan earrings.", "/brand/placeholders/jewellery.svg", {"Craft": "Tribal Artisan"}),
        ("Accessorize London Sparkling Zircon Teardrop Earrings", "Accessorize", "pair", "1 Pair", 159900, 114900, "Western party glamour rose gold faceted teardrop drops.", "/brand/placeholders/jewellery.svg", {"Finish": "Rose Gold"})
    ],
    # 10 Necklaces
    "necklaces-mangalsutras": [
        ("Zaveri Pearls Royal Green Kundan Choker Necklace Set", "Zaveri Pearls", "set", "Complete Set", 299900, 199900, "Includes choker collar, matching earrings and traditional maang tikka.", "/brand/placeholders/jewellery.svg", {"Stone": "Green Kundan"}),
        ("Sukkhi 24K Gold-Plated Multi-Layer Rani Haar Set", "Sukkhi", "set", "Haar + Earrings", 249900, 169900, "Majestic multi-strand pearl and gold beaded long rani haar.", "/brand/placeholders/jewellery.svg", {"Length": "Long Haar"}),
        ("Giva 925 Sterling Silver Solitaire Pendant with Chain", "Giva", "piece", "1 Pendant + Chain", 229900, 169900, "Delicate silver cable chain with AAA+ grade sparkling cubic zirconia.", "/brand/placeholders/jewellery.svg", {"Hallmark": "925 Silver"}),
        ("Tanishq Mia 14K Gold-Plated Delicate Floral Pendant", "Tanishq Mia", "piece", "1 Necklace", 399900, 319900, "Minimalist fine jewellery daily office necklace.", "/brand/placeholders/jewellery.svg", {"Gold": "14K Plated"}),
        ("Priyaasi Gold-Plated Short Mangalsutra with Black Beads", "Priyaasi", "piece", "1 Mangalsutra", 119900, 79900, "Contemporary Auspicious thread with modern diamond-cut centre pendant.", "/brand/placeholders/jewellery.svg", {"Style": "Modern Short"}),
        ("Voylla Contemporary Brass Rose Gold Crystal Pendant", "Voylla", "piece", "1 Necklace", 99900, 69900, "Modern interlocking rings romantic crystal gift pendant.", "/brand/placeholders/jewellery.svg", {"Color": "Rose Gold"}),
        ("Karatcart Choker Necklace with Matching Studs and Ring", "Karatcart", "set", "3 Pieces", 189900, 129900, "Faux polki stones set in antique gold foil work collar.", "/brand/placeholders/jewellery.svg", {"Style": "Polki Choker"}),
        ("Meenaz Traditional Maharashtrian Kolhapuri Saaj Necklace", "Meenaz", "piece", "1 Necklace", 149900, 99900, "Traditional 21 panadi auspicious leaves gold tone necklace.", "/brand/placeholders/jewellery.svg", {"Tradition": "Kolhapuri"}),
        ("Shining Diva Bohemian Layered Multi-Charm Coin Necklace", "Shining Diva", "piece", "1 Necklace", 79900, 49900, "Trendy multi-row beach and western wear metallic choker necklace.", "/brand/placeholders/jewellery.svg", {"Layers": "3 Rows"}),
        ("Peora Traditional Kundan & Pearl Bridal Choker Set", "Peora", "set", "Set with Maang Tikka", 349900, 249900, "Hand-strung cluster pearls with shimmering kundan work.", "/brand/placeholders/jewellery.svg", {"Occasion": "Bridal"})
    ],
    # 8 Bangles & Kadas
    "bangles-kadas-bracelets": [
        ("Voylla Brass Antique Carved Lion Head Kada for Men", "Voylla", "piece", "1 Kada", 149900, 99900, "Heavyweight brass engraved bahubali lion face openable kada.", "/brand/placeholders/jewellery.svg", {"Gender": "Men"}),
        ("Zaveri Pearls Gold-Plated Floral Meenakari Bangles (Set of 4)", "Zaveri Pearls", "set", "4 Bangles", 179900, 119900, "Intricately enameled floral royal rajputana bangles.", "/brand/placeholders/jewellery.svg", {"Bangles": "4 Pieces"}),
        ("Sukkhi Traditional Velvet Maroon Chooda Set with Kadas", "Sukkhi", "set", "Complete Chooda", 199900, 139900, "Bridal red and maroon velvet bangles with stone kadas.", "/brand/placeholders/jewellery.svg", {"Bridal": "Yes"}),
        ("Giva 925 Sterling Silver Adjustable Minimalist Tennis Bracelet", "Giva", "piece", "1 Bracelet", 299900, 229900, "Dazzling row of prong-set clear zircons with slider clasp.", "/brand/placeholders/jewellery.svg", {"Clasp": "Slider"}),
        ("Karatcart Brass Gold-Plated Screw Kada with American Diamonds", "Karatcart", "piece", "1 Kada", 129900, 89900, "Luxury Cartier inspired side-screw oval bangle kada.", "/brand/placeholders/jewellery.svg", {"Fit": "Oval Screw"}),
        ("Peora Traditional Glass Bangle Set Multi-Color (24 Pieces)", "Peora", "set", "24 Bangles", 69900, 49900, "Hand-tinted festive glass bangles with gold glitter accents.", "/brand/placeholders/jewellery.svg", {"Count": "24 Glass"}),
        ("Fastrack Stainless Steel Black Matte Cuff Bracelet for Men", "Fastrack", "piece", "1 Cuff", 119500, 89900, "Sleek industrial black PVD coated wrist cuff.", "/brand/placeholders/jewellery.svg", {"Steel": "316L Surgical"}),
        ("Shining Diva Brass Gold-Plated Traditional Broad Kada Pair", "Shining Diva", "pair", "2 Kadas", 139900, 94900, "Filigree openwork broad temple kadas for festive wear.", "/brand/placeholders/jewellery.svg", {"Finish": "Matte Gold"})
    ],
    # 5 Rings & Toe Rings
    "rings-toe-rings": [
        ("Giva 925 Sterling Silver Adjustable Solitaire Finger Ring", "Giva", "piece", "Adjustable", 179900, 129900, "6-prong raised solitaire cubic zirconia in pure silver band.", "/brand/placeholders/jewellery.svg", {"Size": "Adjustable"}),
        ("Voylla Men’s Brass Textured Signet Band Ring", "Voylla", "piece", "Size 20", 89900, 59900, "Masculine engraved pattern signet ring with rhodium polish.", "/brand/placeholders/jewellery.svg", {"Style": "Signet"}),
        ("Zaveri Pearls Pure 92.5 Silver Bichhiya Toe Rings (Pair)", "Zaveri Pearls", "pair", "1 Pair", 119900, 84900, "Hallmarked silver traditional auspicious wedding bichhiya.", "/brand/placeholders/jewellery.svg", {"Silver": "92.5%"}),
        ("Karatcart Rose Gold Plated Crystal Cocktail Party Ring", "Karatcart", "piece", "Adjustable", 99900, 69900, "Floral cluster crystals catching light from every angle.", "/brand/placeholders/jewellery.svg", {"Color": "Rose Gold"}),
        ("Peora Silver Plated Traditional Adjustable Ring Set of 3", "Peora", "set", "3 Rings", 79900, 54900, "Stackable bohemian midi and thumb rings with antique patina.", "/brand/placeholders/jewellery.svg", {"Stackable": "Yes"})
    ],
    # 7 Wrist Watches
    "wrist-watches": [
        ("Titan Neo Analog Men's Watch with Brown Leather Strap", "Titan", "piece", "Men", 499500, 399500, "Quartz movement with date display and genuine calfskin leather strap.", "/brand/placeholders/jewellery.svg", {"Glass": "Mineral Crystal"}),
        ("Fastrack Casual Analog Quartz Unisex Watch with Silicon Strap", "Fastrack", "piece", "Unisex", 199500, 149500, "Youthful sporty dial with water resistance up to 50 metres.", "/brand/placeholders/jewellery.svg", {"Water": "50m"}),
        ("Timex Classic Black Dial Stainless Steel Men's Dress Watch", "Timex", "piece", "Men", 329500, 249500, "Sleek sunray black dial with foldover safety clasp link bracelet.", "/brand/placeholders/jewellery.svg", {"Strap": "Stainless Steel"}),
        ("Titan Raga Viva Rose Gold Dial Women's Designer Watch", "Titan", "piece", "Women", 549500, 439500, "Jewellery inspired thin bracelet watch with faceted crystal glass.", "/brand/placeholders/jewellery.svg", {"Collection": "Raga"}),
        ("Casio Vintage Digital Stainless Steel Gold Tone Watch A168", "Casio", "piece", "Unisex", 399500, 319500, "Retro electro-luminescence backlight, alarm and 1/100s stopwatch.", "/brand/placeholders/jewellery.svg", {"Display": "Digital"}),
        ("Sonata Analog Champagne Dial Men's Formal Gold Watch", "Sonata", "piece", "Men", 149900, 119900, "Reliable Tata product gold plated traditional formal watch.", "/brand/placeholders/jewellery.svg", {"Warranty": "1 Year"}),
        ("Fastrack Reflex Beat Fitness Smart Band with Heart Rate", "Fastrack", "piece", "Unisex", 249500, 179500, "OLED screen, pedometer, calorie tracker and call alerts.", "/brand/placeholders/jewellery.svg", {"Battery": "7 Days"})
    ],
    # 5 Hair Accessories & Brooches
    "hair-accessories-brooches": [
        ("Sukkhi Traditional Gold-Plated Pearl Hair Juda Pin Brooch", "Sukkhi", "piece", "1 Pin", 69900, 44900, "Ornate hair bun accessory with dangling pearl chains.", "/brand/placeholders/jewellery.svg", {"Use": "Hair Juda"}),
        ("Zaveri Pearls Floral Kundan Maang Tikka with Pearl Drops", "Zaveri Pearls", "piece", "1 Tikka", 79900, 49900, "Dainty bridal forehead accessory with hook clip.", "/brand/placeholders/jewellery.svg", {"Type": "Maang Tikka"}),
        ("Accessorize London Metal Pearl Claw Hair Clips (Pack of 3)", "Accessorize", "pack", "3 Clips", 89900, 59900, "Strong spring interlocking jaw clips for holding thick hair.", "/brand/placeholders/jewellery.svg", {"Pack": "3 Units"}),
        ("Priyaasi Gold-Plated Peacock Saree Brooch Pin with Rhinestones", "Priyaasi", "piece", "1 Brooch", 59900, 39900, "Graceful peacock safety pin brooch holding saree pallu.", "/brand/placeholders/jewellery.svg", {"Design": "Peacock"}),
        ("Shining Diva Silk Satin Hair Scrunchies Pastel Pack of 6", "Shining Diva", "pack", "6 Scrunchies", 49900, 34900, "Anti-breakage snag-free pure satin soft hair scrunchies.", "/brand/placeholders/jewellery.svg", {"Fabric": "Silk Satin"})
    ]
}

jew_idx = 1
for sub, list_items in jewel_sub_map.items():
    for itm in list_items:
        add_item("JWL", jew_idx, itm[0], itm[1], "Jewellery & Accessories", "jewellery-accessories", sub, "LIFESTYLE", itm[2], itm[3], itm[4], itm[5], itm[6], itm[6], itm[7], itm[8], ["jewellery", "earrings", "necklace", "watch", itm[0].lower().split()[0]], ["jewellery", "lifestyle"])
        jew_idx += 1
print(f"Total after jewellery: {len(products)} (Expected 420)")

# -------------------------------------------------------------
# 8. BAGS, FOOTWEAR & TRAVEL (30 products)
# -------------------------------------------------------------
bag_sub_map = {
    # 6 Handbags
    "womens-handbags-totes": [
        ("Lavie Betula Women's Faux Leather Large Shoulder Tote Bag", "Lavie", "piece", "1 Bag", 349900, 249900, "Spacious 3-compartment tote fitting 13-inch laptop and daily essentials.", "/brand/placeholders/footwear.svg", {"Material": "PU Vegan Leather"}),
        ("Caprese Solid Structured Handbag with Detachable Sling Strap", "Caprese", "piece", "1 Bag", 399900, 279900, "Structured silhouette with gold hardware and top zip closure.", "/brand/placeholders/footwear.svg", {"Hardware": "Gold Tone"}),
        ("Baggit Textured Vegan Leather Hobo Shoulder Bag", "Baggit", "piece", "1 Bag", 279000, 199900, "Cruelty-free slouchy casual shoulder bag with water-resistant lining.", "/brand/placeholders/footwear.svg", {"PETA Approved": "Yes"}),
        ("Lino Perros Classic Black Satchel Handbag for Women", "Lino Perros", "piece", "1 Bag", 329500, 229500, "Timeless top handle satchel with front metal twist lock.", "/brand/placeholders/footwear.svg", {"Style": "Satchel"}),
        ("ZOUK Handcrafted Printed Vegan Leather Office Laptop Tote", "ZOUK", "piece", "1 Bag (14 Inch)", 429900, 299900, "Proudly Indian handcrafted ikat fabric print laptop tote.", "/brand/placeholders/footwear.svg", {"Craft": "Ikat Print"}),
        ("DailyObjects Classic Canvas Multi-Pocket Everyday Shopping Tote", "DailyObjects", "piece", "1 Bag", 149900, 99900, "Heavy-duty 16oz cotton canvas tote with bottle holder sleeve.", "/brand/placeholders/footwear.svg", {"Canvas": "16 Oz Heavy"})
    ],
    # 6 Backpacks
    "backpacks-bags": [
        ("Wildcraft 35L Water Resistant Travel Laptop Backpack with Rain Cover", "Wildcraft", "piece", "35 Litre", 279900, 219900, "Padded ergonomic back mesh, laptop sleeve and concealed rain cover.", "/brand/placeholders/footwear.svg", {"Capacity": "35L"}),
        ("American Tourister 32L Casual Daypack Backpack with 3 Compartments", "American Tourister", "piece", "32 Litre", 249000, 179900, "Tough polyester fabric with tractum suspension shoulder straps.", "/brand/placeholders/footwear.svg", {"Compartments": "3 Full"}),
        ("Skybags Brat 30L Casual College Backpack with Bottle Holder", "Skybags", "piece", "30 Litre", 199900, 139900, "Trendy printed young college daypack with organizer pocket.", "/brand/placeholders/footwear.svg", {"Pattern": "Printed"}),
        ("Safari 35L Overnighter Travel Duffel Bag with Shoe Pocket", "Safari", "piece", "35 Litre", 219900, 159900, "Separate ventilated dirty shoe compartment and padded shoulder sling.", "/brand/placeholders/footwear.svg", {"Feature": "Shoe Pocket"}),
        ("F Gear Ergonomic Padded School and College Bag 28L", "F Gear", "piece", "28 Litre", 169900, 119900, "Durable water-resistant school backpack with heavy-duty zips.", "/brand/placeholders/footwear.svg", {"Zippers": "YKK"}),
        ("Puma Unisex Core Solid Gym Duffle Bag with Shoulder Strap", "Puma", "piece", "25 Litre", 199900, 149900, "Sleek compact athletic gym bag with dual grab handles.", "/brand/placeholders/footwear.svg", {"Logo": "Puma Cat"})
    ],
    # 4 Wallets
    "wallets-clutches-pouches": [
        ("Woodland Men's Genuine Leather Bi-Fold Wallet in Tan Brown", "Woodland", "piece", "1 Wallet", 199500, 149500, "Natural grain 100% genuine hunter leather with 8 card slots.", "/brand/placeholders/footwear.svg", {"Leather": "100% Genuine"}),
        ("Wildcraft Rugged RFID Blocking Men's Canvas Pocket Wallet", "Wildcraft", "piece", "1 Wallet", 69900, 49900, "Slim lightweight fabric wallet preventing unauthorized card scans.", "/brand/placeholders/footwear.svg", {"Protection": "RFID Blocking"}),
        ("Lavie Women's Zip-Around Textured Party Clutch Purse", "Lavie", "piece", "1 Clutch", 149900, 99900, "Gold metal zipper clutch holding mobile phone, cards and cash.", "/brand/placeholders/footwear.svg", {"Slots": "12 Card Slots"}),
        ("Baggit Tri-Fold Casual Synthetic Card Case Wallet for Women", "Baggit", "piece", "1 Wallet", 99000, 69900, "Compact pastel purse easily slipping into small slings.", "/brand/placeholders/footwear.svg", {"Type": "Tri-Fold"})
    ],
    # 5 Mens Shoes
    "mens-footwear-shoes": [
        ("Bata Men's Formal Genuine Leather Slip-On Dress Shoes Black", "Bata", "pair", "Size 8 UK", 249900, 199900, "Padded insole breathable genuine leather formal dress shoes.", "/brand/placeholders/footwear.svg", {"Sole": "Durable TPR"}),
        ("Red Tape Men's Breathable Mesh Lightweight Walking Sneakers", "Red Tape", "pair", "Size 8 UK", 389900, 189900, "Memory foam cushioned athletic running and walking shoes.", "/brand/placeholders/footwear.svg", {"Upper": "Mesh Knit"}),
        ("Sparx Men's Sporty Canvas Casual Lace-Up Sneakers", "Sparx", "pair", "Size 9 UK", 119900, 89900, "Durable canvas upper with vulcanized non-slip rubber outsole.", "/brand/placeholders/footwear.svg", {"Sole": "Vulcanized"}),
        ("Liberty Men's Formal Oxford Lace-Up Shoes Dark Tan", "Liberty", "pair", "Size 8 UK", 219900, 169900, "Burnished toe cap classic formal Oxford business shoes.", "/brand/placeholders/footwear.svg", {"Style": "Oxford"}),
        ("Woodland Men's Heavy Duty Leather Trekking Outdoor Shoes", "Woodland", "pair", "Size 9 UK", 429500, 349500, "Nubuck leather upper with deep grooved all-terrain traction sole.", "/brand/placeholders/footwear.svg", {"Traction": "All-Terrain"})
    ],
    # 5 Womens Flats
    "womens-flats-sandals": [
        ("Bata Comfit Women's Cushioned Daily Wear Flat Sandals", "Bata", "pair", "Size 5 UK", 129900, 99900, "Arch support footbed designed for long hours of comfortable walking.", "/brand/placeholders/footwear.svg", {"Footbed": "Arch Support"}),
        ("Metro Women's Ethnic Embellished Kolhapuri Chappals", "Metro", "pair", "Size 6 UK", 169000, 129000, "Traditional braided toe-ring ethnic slippers with metallic sequins.", "/brand/placeholders/footwear.svg", {"Style": "Kolhapuri"}),
        ("Inc.5 Women's Formal Pointed Toe Ballet Flat Shoes", "Inc.5", "pair", "Size 6 UK", 189000, 139000, "Cushioned memory insole formal slip-on bellies for office wear.", "/brand/placeholders/footwear.svg", {"Toe": "Pointed"}),
        ("Catwalk Women's Casual Strappy Wedge Heel Sandals", "Catwalk", "pair", "Size 5 UK", 229500, 169500, "2-inch stable cork wedge heels with comfortable ankle strap buckle.", "/brand/placeholders/footwear.svg", {"Heel": "2 Inch Wedge"}),
        ("Mochi Women's Traditional Handcrafted Zari Mojari Jutti", "Mochi", "pair", "Size 6 UK", 249000, 189000, "Genuine leather padded traditional Punjabi jutti with golden zari.", "/brand/placeholders/footwear.svg", {"Craft": "Hand Zari"})
    ],
    # 4 Slippers
    "slippers-flipflops": [
        ("Relaxo Flite Extra Soft Ortho Care Slippers for Men", "Relaxo", "pair", "Size 8 UK", 49900, 39900, "Acupressure footbed relieving heel pain and fatigue.", "/brand/placeholders/footwear.svg", {"Feature": "Acupressure"}),
        ("Bata Foam Cushion Comfortable Home Slides for Women", "Bata", "pair", "Size 5 UK", 59900, 44900, "Waterproof EVA foam slip-on home sliders.", "/brand/placeholders/footwear.svg", {"Material": "EVA Foam"}),
        ("Sparx Water-Resistant Daily Rubber Flip-Flops for Men", "Sparx", "pair", "Size 8 UK", 39900, 29900, "Durable anti-skid grooved sole everyday bathroom slippers.", "/brand/placeholders/footwear.svg", {"Grip": "Anti-Skid"}),
        ("Paragon ParaLite Comfortable Everyday Casual Slippers", "Paragon", "pair", "Size 8 UK", 34900, 26900, "Sturdy soft strap long-lasting daily chappals.", "/brand/placeholders/footwear.svg", {"Durability": "High"})
    ]
}

bag_idx = 1
for sub, list_items in bag_sub_map.items():
    for itm in list_items:
        add_item("BAG", bag_idx, itm[0], itm[1], "Bags, Footwear & Travel", "bags-footwear-travel", sub, "LIFESTYLE", itm[2], itm[3], itm[4], itm[5], itm[6], itm[6], itm[7], itm[8], ["bag", "footwear", "shoes", "wallet", itm[0].lower().split()[0]], ["footwear", "travel"])
        bag_idx += 1
print(f"Total after bags & footwear: {len(products)} (Expected 450)")

# -------------------------------------------------------------
# 9. PHARMACY & WELLNESS (30 products - Strictly OTC Only!)
# -------------------------------------------------------------
pharm_sub_map = {
    # 8 OTC Pain Relief & Digestives
    "otc-pain-digestives": [
        ("Dabur Pudin Hara Liquid Pearls Digestive Drops 10 Pearls", "Dabur", "strip", "10 Pearls", 3500, 3000, "Fast natural relief from stomach ache, gas and indigestion with spearmint.", "/product-images/pharmacy/digene-gel.webp", {"Ayurvedic": "Yes"}),
        ("Eno Fruit Salt Regular Effervescent Antacid Sachet (6-Pack)", "Eno", "pack", "6 x 5g", 6000, 5200, "Relieves acidity in just 6 seconds with gentle effervescent action.", "/product-images/pharmacy/digene-gel.webp", {"Action": "6 Seconds"}),
        ("Amrutanjan Strong Pain Relief Ayurvedic Balm 50g", "Amrutanjan", "jar", "50 g", 14000, 11900, "Camphor and wintergreen oil blend relieving severe headaches and cold.", "/product-images/pharmacy/volini-gel.webp", {"Action": "Hot Action"}),
        ("Vicks VapoRub Steam Inhalation Chest Rub 50g", "Vicks", "jar", "50 g", 17000, 14900, "Provides multi-symptom relief from blocked nose, cough and body ache.", "/product-images/pharmacy/volini-gel.webp", {"Herbs": "Menthol, Camphor, Eucalyptus"}),
        ("Moov Ayurvedic Fast Pain Relief Spray 80g", "Moov", "can", "80 g", 21500, 18500, "Micro-particles penetrate swiftly for quick relief from backache and muscle pain.", "/product-images/pharmacy/volini-gel.webp", {"Formula": "100% Ayurvedic"}),
        ("Volini Joint and Muscle Pain Relief Gel 50g", "Volini", "tube", "50 g", 16500, 13900, "Diclofenac formula scientifically proven for deep neck and knee sprain relief.", "/product-images/pharmacy/volini-gel.webp", {"Active": "Diclofenac Gel"}),
        ("Zandu Balm Ayurvedic Fast Action Headache Relief 25g", "Zandu", "jar", "25 g", 9500, 7900, "Trusted for over 100 years for fast relief from stress headache and body pain.", "/product-images/pharmacy/volini-gel.webp", {"Origin": "Ayurvedic"}),
        ("Strepsils Honey & Lemon Sore Throat Lozenges 8-Pack", "Strepsils", "strip", "8 Lozenges", 4500, 3800, "Dual antibacterial action soothing scratchy and inflamed throat.", "/product-images/pharmacy/digene-gel.webp", {"Flavor": "Honey Lemon"})
    ],
    # 6 First Aid & Antiseptics
    "first-aid-antiseptics": [
        ("Dettol Antiseptic Disinfectant Liquid for First Aid 250ml", "Dettol", "bottle", "250 ml", 16500, 13900, "Proven protection against cuts, scratches, insect bites and wounds.", "/product-images/pharmacy/dettol-antiseptic.webp", {"Purity": "Antiseptic"}),
        ("Savlon Antiseptic Liquid Germ Protection 200ml", "Savlon", "bottle", "200 ml", 12500, 10500, "Gentle on wounds with non-stinging effective germ defense.", "/product-images/pharmacy/dettol-antiseptic.webp", {"Sting": "Non-Stinging"}),
        ("Hansaplast Regular Waterproof Adhesive Bandages (20 Strips)", "Hansaplast", "pack", "20 Strips", 6000, 5000, "Breathable fabric strips with antiseptic wound pad.", "/product-images/pharmacy/hansaplast-strips.webp", {"Strips": "20 Units"}),
        ("Dettol Clean Cut Antibacterial Antiseptic First Aid Cream 30g", "Dettol", "tube", "30 g", 8500, 7200, "Soothing first-aid cream preventing infection in minor burns and scrapes.", "/product-images/pharmacy/dettol-antiseptic.webp", {"Use": "First Aid"}),
        ("Cotton Craft 100% Pure Surgical Cotton Roll Absorbent 100g", "Cotton Craft", "roll", "100 g", 6500, 4900, "Sterilized bleached absorbent cotton for family medicine cabinet.", "/product-images/pharmacy/hansaplast-strips.webp", {"Material": "100% Cotton"}),
        ("Dr. Sabharwal Crepe Elastic Bandage with Fastener Clip 7.5cm", "Dr. Sabharwal", "roll", "7.5 cm x 4m", 12500, 9900, "Firm compression elastic support for sprained ankles, wrists and joints.", "/product-images/pharmacy/hansaplast-strips.webp", {"Width": "7.5 cm"})
    ],
    # 6 Vitamins & Supplements
    "vitamins-supplements": [
        ("Limcee Vitamin C 500mg Chewable Tablets (15-Pack)", "Limcee", "strip", "15 Tablets", 2500, 2100, "Immunity boosting tangy orange chewable Vitamin C with ascorbic acid.", "/product-images/pharmacy/digene-gel.webp", {"Vitamin": "C 500mg"}),
        ("Revital H Daily Health Supplement Capsules with Ginseng (30-Pack)", "Revital", "bottle", "30 Capsules", 34000, 28900, "Combination of Ginseng, 10 vitamins and 9 minerals fighting daily fatigue.", "/brand/placeholders/pharmacy.svg", {"Ginseng": "Natural"}),
        ("Becosules Performance Multivitamin & Amino Acid Capsules (30-Pack)", "Becosules", "strip", "30 Capsules", 19500, 16500, "Vitamin B-Complex with amino acids for mouth ulcers and vitality.", "/brand/placeholders/pharmacy.svg", {"B Complex": "Fortified"}),
        ("Dabur Chyawanprash 2x Immunity Booster Herbal Paste 1kg", "Dabur", "jar", "1 kg", 45000, 37500, "Fortified with amla and 40 Ayurvedic herbs protecting against winter illness.", "/brand/placeholders/pharmacy.svg", {"Amla": "Organic"}),
        ("Himalaya Liv.52 Herbal Liver Care Tablets (100-Pack)", "Himalaya", "bottle", "100 Tablets", 18500, 15500, "Promotes healthy appetite, liver detoxification and digestive vitality.", "/brand/placeholders/pharmacy.svg", {"Herbal": "Yes"}),
        ("Baidyanath Pure Shilajit Resin Natural Stamina Booster 20g", "Baidyanath", "jar", "20 g", 119900, 94900, "Purified Himalayan shilajit with >75% fulvic acid for physical vigor.", "/brand/placeholders/pharmacy.svg", {"Fulvic Acid": "75%"})
    ],
    # 5 Health Monitors
    "monitors-devices": [
        ("Omron HEM 7120 Fully Automatic Digital Arm Blood Pressure Monitor", "Omron", "piece", "1 Monitor", 249000, 199900, "Clinically accurate oscillometric blood pressure and pulse monitor with memory.", "/product-images/pharmacy/omron-bp.webp", {"Warranty": "3 Years"}),
        ("Accu-Chek Active Blood Glucose Glucometer Monitoring System", "Accu-Chek", "kit", "Meter + 10 Strips", 169900, 129900, "Accurate blood sugar measurement in 5 seconds with easy lancet device.", "/product-images/pharmacy/accu-chek.webp", {"Time": "5 Seconds"}),
        ("Dr. Morepen Digi Classic Waterproof Digital Clinical Thermometer", "Dr. Morepen", "piece", "1 Device", 29900, 19900, "Quick 60-second fever alert beep with clear digital LCD display.", "/brand/placeholders/pharmacy.svg", {"Reading": "60 Seconds"}),
        ("Equinox Hot Water Bottle Rubber Bag with Leakproof Cap 2L", "Equinox", "piece", "2 Litre", 49900, 34900, "High-grade natural rubber bag soothing muscle cramps and joint stiffness.", "/brand/placeholders/pharmacy.svg", {"Capacity": "2 Litre"}),
        ("Vicks Personal Steam Inhaler Facial Vaporizer and Inhaler", "Vicks", "piece", "1 Unit", 129900, 99900, "Targeted steam therapy clearing sinus congestion and chest throat blockage.", "/brand/placeholders/pharmacy.svg", {"Use": "Steam Therapy"})
    ],
    # 5 Personal Hygiene
    "hygiene-sanitizers": [
        ("Dettol Instant Hand Sanitizer 70% Alcohol Gel 200ml", "Dettol", "bottle", "200 ml", 10000, 8500, "Kills 99.9% germs instantly without water, enriched with moisturizers.", "/brand/placeholders/pharmacy.svg", {"Alcohol": "70% v/v"}),
        ("Lifebuoy Total Germ Protection Wet Sanitizing Wipes (30-Pack)", "Lifebuoy", "pack", "30 Wipes", 9900, 7900, "Multi-surface skin safe wipes for quick sanitization on the move.", "/brand/placeholders/pharmacy.svg", {"Pack": "30 Sheets"}),
        ("3-Ply Protective Surgical Meltblown Face Mask (50-Pack Box)", "CarePlus", "box", "50 Masks", 29900, 19900, "99% bacterial filtration efficiency with comfortable elastic ear loops.", "/brand/placeholders/pharmacy.svg", {"BFE": ">= 99%"}),
        ("Carefusion Nitrile Disposable Non-Sterile Gloves (50-Pack)", "Carefusion", "box", "50 Gloves", 49900, 37500, "Powder-free textured fingertips nitrile gloves for clean hygiene.", "/brand/placeholders/pharmacy.svg", {"Material": "Nitrile"}),
        ("Whisper Choice Ultra Sanitary Napkin Pads Wings XL (20-Pack)", "Whisper", "pack", "20 Pads", 16000, 13500, "All-night protection pads with wings and rapid fluid absorbing core.", "/brand/placeholders/pharmacy.svg", {"Size": "XL Wings"})
    ]
}

phr_idx = 1
for sub, list_items in pharm_sub_map.items():
    for itm in list_items:
        add_item("PHR", phr_idx, itm[0], itm[1], "Pharmacy & Wellness", "pharmacy-wellness", sub, "PHARMACY", itm[2], itm[3], itm[4], itm[5], itm[6], itm[6], itm[7], itm[8], ["pharmacy", "medicine", "health", "wellness", itm[0].lower().split()[0]], ["otc", "wellness"], {"isPrescription": False})
        phr_idx += 1
print(f"Total after pharmacy: {len(products)} (Expected 480)")

# -------------------------------------------------------------
# 10. SERVICES & OTHER LOCAL PRODUCTS (20 products)
# -------------------------------------------------------------
srv_sub_map = {
    # 4 Laundry
    "laundry-dry-cleaning": [
        ("Professional Wash & Steam Press Ironing Service (Per Pair)", "UrbanClean Indore", "service", "1 Pair (Shirt + Trouser)", 4000, 3000, "Hanger delivery with high-pressure steam wrinkle removal.", "/brand/placeholders/services.svg", {"Turnaround": "24 Hours"}),
        ("Premium Men's Suit & Blazer Dry Cleaning at Doorstep", "UrbanClean Indore", "service", "1 Two-Piece Suit", 35000, 27500, "Eco-friendly solvent cleaning preserving delicate wool fabric drape.", "/brand/placeholders/services.svg", {"Solvent": "Eco Friendly"}),
        ("Heavy Woolen Blanket & Double Quilt Sanitizing Laundry", "UrbanClean Indore", "service", "1 Quilt / Razai", 45000, 35000, "Deep allergen extraction and hygienic sun drying.", "/brand/placeholders/services.svg", {"Sanitization": "UV Sanitized"}),
        ("Curtain & Drapery Steam Wash and On-Site Rehanging", "UrbanClean Indore", "service", "Set of 2 Panels", 50000, 39900, "Professional dust mite removal without dismantling curtain rods.", "/brand/placeholders/services.svg", {"Service": "On-Site"})
    ],
    # 4 Tailoring
    "tailoring-alterations": [
        ("Men's Pant Hemming & Waist Alteration Doorstep Tailor", "Master Tailor Indore", "service", "1 Trouser", 15000, 12000, "Professional tailoring master visits your home for perfect fit.", "/brand/placeholders/services.svg", {"Visit": "Doorstep"}),
        ("Women's Kurti & Blouse Custom Fitting and Restitching", "Master Tailor Indore", "service", "1 Garment", 25000, 19900, "Restitching and contour shaping for festive designer kurtis.", "/brand/placeholders/services.svg", {"Master": "Certified"}),
        ("Traditional Saree Fall Stitching & Pico Edging Service", "Master Tailor Indore", "service", "1 Saree", 12000, 9900, "Neat interlocking pico and color-matched cotton fall attachment.", "/brand/placeholders/services.svg", {"Includes": "Cotton Fall"}),
        ("Custom Curtain Stitching & Eyelet Ring Installation", "Master Tailor Indore", "service", "1 Panel (7-9 Ft)", 35000, 27500, "Custom stitching with durable rust-proof brass and silver eyelets.", "/brand/placeholders/services.svg", {"Eyelets": "Rust Proof"})
    ],
    # 4 Appliance
    "appliance-ac-servicing": [
        ("Split AC Deep Foam Jet Servicing & Cooling Inspection", "CoolTech Services", "service", "1 Indoor + 1 Outdoor Unit", 69900, 49900, "High-pressure water jet coil cleaning, gas pressure check and filter wash.", "/brand/placeholders/services.svg", {"Cleaning": "Jet Pump"}),
        ("Refrigerator Comprehensive Gas Leakage & Cooling Checkup", "CoolTech Services", "service", "1 Refrigerator", 49900, 34900, "Thermostat testing, compressor relay health check and condenser cleaning.", "/brand/placeholders/services.svg", {"Technician": "Certified"}),
        ("Fully Automatic Washing Machine Deep Drum Descaling Service", "CoolTech Services", "service", "1 Machine", 59900, 42500, "Removes stubborn lime scale, soap residue and bacteria from drum.", "/brand/placeholders/services.svg", {"Chemical": "Eco Descaler"}),
        ("Microwave Oven Heating Element Diagnostic & Safety Tuneup", "CoolTech Services", "service", "1 Microwave", 39900, 29900, "Magnetron inspection, turntable motor check and radiation leakage test.", "/brand/placeholders/services.svg", {"Safety": "Radiation Test"})
    ],
    # 4 Salon
    "salon-grooming-home": [
        ("Men's Professional Haircut, Head Massage & Beard Trim at Home", "GlamExpress Indore", "service", "1 Session", 59900, 44900, "Certified stylist arrives with single-use sterile kits and cape.", "/brand/placeholders/services.svg", {"Kit": "Sanitized Disposable"}),
        ("Women's Herbal Radiance Facial & De-Tan Cleanup at Home", "GlamExpress Indore", "service", "60 Mins", 129900, 99900, "Ayurvedic massage cream, face steam and soothing peel-off mask.", "/brand/placeholders/services.svg", {"Duration": "60 Mins"}),
        ("Full Arms, Legs & Underarms Painless Honey Waxing at Home", "GlamExpress Indore", "service", "Complete Package", 89900, 69900, "Rica and warm honey wax leaving skin smooth and hair-free.", "/brand/placeholders/services.svg", {"Wax": "Skin Safe"}),
        ("Complete Relaxing Pedicure & Manicure Spa at Home", "GlamExpress Indore", "service", "75 Mins", 119900, 89900, "Cuticle care, foot scrub, dead skin removal and relaxing cream massage.", "/brand/placeholders/services.svg", {"Session": "75 Mins"})
    ],
    # 4 Electrical & Plumbing
    "electrical-plumbing-repairs": [
        ("Ceiling Fan Repair, Bearing Lubrication & Capacitor Change", "QuickFix Indore", "service", "1 Fan", 29900, 19900, "Diagnosis of slow rotation, wobbling noise and capacitor replacement.", "/brand/placeholders/services.svg", {"Warranty": "30 Days Service"}),
        ("Switchboard Rewiring, MCB Tripping & Short-Circuit Diagnostic", "QuickFix Indore", "service", "Per Callout", 39900, 29900, "Licensed electrician inspects earthing, loose connections and loads.", "/brand/placeholders/services.svg", {"Electrician": "Licensed"}),
        ("Overhead Water Tank Hygienic Cleaning & Sensor Float Repair", "QuickFix Indore", "service", "Up to 1000L Tank", 79900, 59900, "Sludge draining, UV antibacterial treatment and automatic float fix.", "/brand/placeholders/services.svg", {"Treatment": "UV Antibacterial"}),
        ("Kitchen Sink Drain Clog Removal & Tap Leakage Fixing", "QuickFix Indore", "service", "1 Issue", 34900, 24900, "Clears kitchen sink grease blockages and replaces worn tap washers.", "/brand/placeholders/services.svg", {"Tools": "Drain Snake Machine"})
    ]
}

srv_idx = 1
for sub, list_items in srv_sub_map.items():
    for itm in list_items:
        add_item("SRV", srv_idx, itm[0], itm[1], "Services & Other Local Products", "services-other-local", sub, "SERVICES", itm[2], itm[3], itm[4], itm[5], itm[6], itm[6], itm[7], itm[8], ["service", "local", "home service", itm[0].lower().split()[0]], ["services", "local"], {"isService": True})
        srv_idx += 1

print(f"Final total products: {len(products)} (Expected 500)")

# Write out full products-500.json
json_path = os.path.join(out_dir, "products-500.json")
with open(json_path, "w", encoding="utf-8") as f:
    json.dump(products, f, indent=2, ensure_ascii=False)

print(f"Successfully saved {len(products)} products to {json_path}")
