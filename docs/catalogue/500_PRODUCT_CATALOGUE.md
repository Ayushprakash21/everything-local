# 500-PRODUCT CENTRALIZED MARKETPLACE CATALOGUE

**Platform:** EveryBazaar — Your Neighbourhood. Your Marketplace.  
**Catalog Environment:** DEMO  
**Total Products Seeded:** 500  
**Generation Timestamp:** 2026-11-24T17:54:25.039Z  

---

## 1. Category Distribution Summary

| Category | Product Count | Target Requirement | Status |
| :--- | :---: | :---: | :---: |
| **Grocery & Daily Essentials** | 100 | 100 | ✅ EXACT MATCH |
| **Fruits & Vegetables** | 50 | 50 | ✅ EXACT MATCH |
| **Clothing & Fashion** | 70 | 70 | ✅ EXACT MATCH |
| **Beauty & Personal Care** | 45 | 45 | ✅ EXACT MATCH |
| **Home, Kitchen & Décor** | 65 | 65 | ✅ EXACT MATCH |
| **Electronics & Electrical Décor** | 45 | 45 | ✅ EXACT MATCH |
| **Jewellery & Accessories** | 45 | 45 | ✅ EXACT MATCH |
| **Bags, Footwear & Travel** | 30 | 30 | ✅ EXACT MATCH |
| **Pharmacy & Wellness** | 30 | 30 | ✅ EXACT MATCH |
| **Services & Other Local Products** | 20 | 20 | ✅ EXACT MATCH |
| **TOTAL** | **500** | **500** | **✅ 100% COMPLETE** |

---

## 2. Product Schema & Architectural Standards

Every catalogue product adheres to the following strict specifications:
- **Unique SKU:** E.g., `EB-GRO-001`, `EB-VEG-001`, `EB-FAS-001` (Zero collisions).
- **Unique Slug:** SEO-friendly canonical slug.
- **Hierarchical Classification:** Mapped to top-level `categoryId` and specialized `subcategoryId`.
- **Pricing:** `mrpPaise` and `targetPricePaise` in integer paise (zero float rounding errors).
- **Realistic Imagery:** Authentic WebP photography where available, or neutral category-specific vector placeholders (`/brand/placeholders/<category>.svg`).
- **Statutory Safeguards:**
  - **Zero Prescription Drugs:** All 30 items under Pharmacy & Wellness are licensed OTC (balms, antacids, first-aid, health devices).
  - **Service Modeling:** All 20 items under Services & Other Local Products are marked `isService: true` with appropriate unit measurements (`service`, `session`, `pair`).

---

## 3. Sample Product Records (Top 10 Departments)


### 1. [EB-GRO-001] India Gate Classic Basmati Rice 5kg
- **Department:** GROCERY | **Category:** Grocery & Daily Essentials
- **Brand:** India Gate | **Unit:** pack (5 kg)
- **MRP:** ₹825.00 | **Target Price:** ₹749.00
- **Image URL:** `/product-images/groceries/india-gate-basmati-rice.webp`
- **Short Description:** Aged long-grain aromatic basmati rice.


### 2. [EB-GRO-051] Catch Black Pepper Sprinkler 100g
- **Department:** GROCERY | **Category:** Grocery & Daily Essentials
- **Brand:** Catch | **Unit:** sprinkler (100 g)
- **MRP:** ₹145.00 | **Target Price:** ₹125.00
- **Image URL:** `/brand/placeholders/grocery.svg`
- **Short Description:** Malabar black pepper in table sprinkler.


### 3. [EB-VEG-001] Fresh Green Cauliflower (Gobhi) 1pc
- **Department:** PRODUCE | **Category:** Fruits & Vegetables
- **Brand:** Malwa Mandi | **Unit:** piece (1 pc (~600g))
- **MRP:** ₹45.00 | **Target Price:** ₹35.00
- **Image URL:** `/product-images/fruits-vegetables/fresh-malwa-potatoes.webp`
- **Short Description:** Crisp white florets harvested fresh from local farms.


### 4. [EB-FAS-001] Raymond Classic White Pure Cotton Formal Shirt
- **Department:** FASHION | **Category:** Clothing & Fashion
- **Brand:** Raymond | **Unit:** piece (Size 40)
- **MRP:** ₹2299.00 | **Target Price:** ₹1899.00
- **Image URL:** `/brand/placeholders/fashion.svg`
- **Short Description:** Crisp 100% Giza cotton business shirt.


### 5. [EB-FAS-051] Tokyo Talkies High-Waist Vintage Wide Leg Jeans
- **Department:** FASHION | **Category:** Clothing & Fashion
- **Brand:** Tokyo Talkies | **Unit:** piece (Size 30)
- **MRP:** ₹1899.00 | **Target Price:** ₹1399.00
- **Image URL:** `/brand/placeholders/fashion.svg`
- **Short Description:** 90s throwback retro flared wide leg non-stretch jeans.


### 6. [EB-BEA-031] Dabur Red Ayurvedic Natural Toothpaste 200g
- **Department:** BEAUTY | **Category:** Beauty & Personal Care
- **Brand:** Dabur | **Unit:** tube (200 g)
- **MRP:** ₹130.00 | **Target Price:** ₹109.00
- **Image URL:** `/brand/placeholders/beauty.svg`
- **Short Description:** Time-tested 13 Ayurvedic herbs including clove, pudina and tomar.


### 7. [EB-HOM-036] Raymond Home Floral Cotton Single Bedsheet with Pillow Cover
- **Department:** HOME | **Category:** Home, Kitchen & Décor
- **Brand:** Raymond Home | **Unit:** set (Single)
- **MRP:** ₹1199.00 | **Target Price:** ₹899.00
- **Image URL:** `/brand/placeholders/home.svg`
- **Short Description:** Vibrant colorfast single bed cotton linen.


### 8. [EB-ELE-021] Boat Rugged 65W Braided Fast Charging Type-C Cable 1.5m
- **Department:** ELECTRONICS | **Category:** Electronics & Electrical Décor
- **Brand:** Boat | **Unit:** piece (1.5 Metre)
- **MRP:** ₹499.00 | **Target Price:** ₹349.00
- **Image URL:** `/brand/placeholders/electronics.svg`
- **Short Description:** Tough nylon braided cable supporting QC 3.0 and 65W fast charge.


### 9. [EB-JWL-026] Peora Traditional Glass Bangle Set Multi-Color (24 Pieces)
- **Department:** LIFESTYLE | **Category:** Jewellery & Accessories
- **Brand:** Peora | **Unit:** set (24 Bangles)
- **MRP:** ₹699.00 | **Target Price:** ₹499.00
- **Image URL:** `/brand/placeholders/jewellery.svg`
- **Short Description:** Hand-tinted festive glass bangles with gold glitter accents.


### 10. [EB-PHR-001] Dabur Pudin Hara Liquid Pearls Digestive Drops 10 Pearls
- **Department:** PHARMACY | **Category:** Pharmacy & Wellness
- **Brand:** Dabur | **Unit:** strip (10 Pearls)
- **MRP:** ₹35.00 | **Target Price:** ₹30.00
- **Image URL:** `/product-images/pharmacy/digene-gel.webp`
- **Short Description:** Fast natural relief from stomach ache, gas and indigestion with spearmint.