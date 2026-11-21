# EVERYTHING LOCAL — PRODUCT CATALOGUE AND BARCODE INTEGRATION SPECIFICATION

**Version:** 1.1.0  
**Status:** Implemented & Verified  
**Pilot Market:** Indore, Madhya Pradesh, India  

---

## 1. Overview & Architecture

To eliminate the manual friction of merchants having to type out product titles, descriptions, categories, and take photos for every common packaged retail good, Everything Local integrates a native barcode scanning workflow backed by an external product catalogue service.

```mermaid
sequenceDiagram
    autonumber
    actor Merchant as Merchant (Mobile App)
    participant Scanner as Expo Camera Barcode Scanner
    participant Client as Mobile Client (add.tsx)
    participant API as Everything Local API (/api/merchant)
    participant OFF as Open Food Facts Catalogue API
    participant Storage as Image Storage Service (/api/upload)

    Merchant->>Scanner: Opens Scan Barcode (EAN-13, UPC, Code 128)
    Scanner->>Client: Emits raw barcode (e.g. 8901058017687)
    Client->>API: GET /api/merchant/catalogue/lookup?barcode=8901058017687
    API->>OFF: Query https://world.openfoodfacts.org/api/v2/product/{barcode}.json
    OFF-->>API: Returns product metadata & image URL
    API->>API: Normalize category to 5 Everything Local retail sectors
    API-->>Client: Returns { found: true, name, brand, category, packageSize, imageUrl }
    Client->>Client: Pre-populates Add Product confirmation form
    Client->>Storage: Ingests external catalogue image (POST /api/upload/ingest-url)
    Storage-->>Client: Returns permanent internal HTTPS image URL
    Merchant->>Client: Verifies details, sets store MRP, Selling Price, and Stock
    Merchant->>API: POST /api/merchant/products (Confirmed payload)
    API-->>Merchant: Product saved in store catalogue
```

---

## 2. Supported Barcode Symbologies

The native scanner uses `CameraView` with `barcodeScannerSettings` from `expo-camera`:
- **EAN-13 (GTIN-13):** Standard for Indian packaged FMCG goods (starts with `890` for India).
- **EAN-8:** Smaller format for compact retail items.
- **UPC-A & UPC-E:** Universal product codes for international and imported retail goods.
- **Code 128:** High-density alphanumeric barcodes used in logistics and retail inventory.
- **QR Codes:** Supported where relevant to product links or inventory tags.

### Scanner Controls:
- **Duplicate Scan Prevention:** Cooldown ref locks scan event after first detection.
- **Torch Toggle:** Hardware flashlight button for dim stockrooms.
- **Manual Barcode Fallback:** Direct keypad entry when barcodes are scratched or wrinkled.

---

## 3. External Catalogue Provider: Open Food Facts

### Why Open Food Facts Was Selected:
1. **Extensive Indian FMCG Coverage:** Over 3 million crowd-verified grocery, beverage, and dairy items including major Indian brands (Amul, Maggi, Parle, Britannia, Fortune, Tata, Aashirvaad).
2. **Open Access & High Reliability:** Public JSON API without restrictive paywalls.
3. **Transparent Licensing:** Database published under ODbL; product packaging images contributed under Creative Commons Attribution-ShareAlike (CC-BY-SA) or Public Domain.
4. **Rate Limits & Hygiene:** Read requests support up to 100 queries/minute. Requests include custom `User-Agent: EverythingLocal-HyperlocalCommerce/1.0.0 (https://everythinglocal.in; support@everythinglocal.in)` as required by provider guidelines.

### Category Normalization:
External taxonomy is normalized server-side to the 5 core Everything Local retail categories:
- `Grocery Staples`
- `Dairy & Bakery`
- `Vegetables & Fruits`
- `Edible Oils`
- `Beverages & Snacks`

---

## 4. Commercial Safeguards

1. **Selling Price Isolation:** External catalogue data **never** sets the merchant's selling price. Every merchant must enter or confirm their store's MRP, selling price, and stock count.
2. **Price Ceiling Enforcement:** Selling price cannot exceed the Maximum Retail Price (MRP).
3. **No Match Graceful Fallback:** If a barcode is not found in the external database, the merchant is alerted and prompted to enter the title manually or search by keyword, and snap a photo. Product matches or photos are never fabricated.
