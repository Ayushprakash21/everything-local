# Native Android API Mapping — Everything Local

**Backend Server Base URL:** `http://10.0.2.2:4000/api` (Android Emulator) or `http://<LAN_IP>:4000/api` (Physical Android Device)  
**Security Headers:** `Authorization: Bearer <JWT>`  
**Tenant Headers:** `x-store-id: <STORE_UUID>` (for Merchant APIs)

---

## 1. Authentication & User Profile (`/api/auth`)

| Endpoint | Method | Role | Request Body | Response Payload | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/auth/register` | `POST` | Public | `{ email, phone?, name, password, role }` | `{ message, token, user }` | Create new customer or merchant account |
| `/api/auth/login` | `POST` | Public | `{ emailOrPhone, password }` | `{ message, token, user: { id, email, name, role, storeId, store } }` | Authenticate credentials and acquire JWT |
| `/api/auth/me` | `GET` | Authenticated | *None* | `{ user: { id, email, phone, name, role, stores, addresses } }` | Fetch authenticated user profile & addresses |

---

## 2. Customer Application APIs (`/api/customer`)

| Endpoint | Method | Auth | Query / Body | Response Payload | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/customer/stores` | `GET` | None | `?lat=...&lng=...&category=...` | `{ location, totalFound, stores: Store[] }` | Discover nearby stores within 3.0 km service radius |
| `/api/customer/stores/{storeId}` | `GET` | None | `?lat=...&lng=...` | `{ store: StoreDetail }` | Detailed store info with complete catalog |
| `/api/customer/products/search` | `GET` | None | `?q=...&category=...&lat=...&lng=...` | `{ query, totalMatches, products: Product[] }` | Search products across nearby stores |
| `/api/customer/cart` | `GET` | Bearer | *None* | `{ cart: { id, storeId, store, items, subtotalPaise } }` | Active shopping cart for single store |
| `/api/customer/cart/items` | `POST` | Bearer | `{ storeId, productId, quantity }` | `{ success, cart }` | Add item or update quantity in cart |
| `/api/customer/cart/items/{itemId}` | `DELETE` | Bearer | *None* | `{ success, cart }` | Remove individual line item from cart |
| `/api/customer/cart` | `DELETE` | Bearer | *None* | `{ success }` | Clear active shopping cart |
| `/api/customer/orders/quote` | `POST` | Bearer | `{ storeId, fulfillmentMode, deliveryAddressId? }` | `{ quote: { itemSubtotalPaise, deliveryFeePaise, totalAmountPaise, isMOVMet, minOrderValuePaise } }` | Calculate pricing breakdown and check ₹299 MOV |
| `/api/customer/orders/checkout` | `POST` | Bearer | `{ storeId, fulfillmentMode, deliveryAddressId?, idempotencyKey }` | `{ success, order }` | Place order with idempotent key |
| `/api/customer/orders` | `GET` | Bearer | *None* | `{ orders: Order[] }` | Fetch customer order history |
| `/api/customer/orders/{id}` | `GET` | Bearer | *None* | `{ order: OrderDetail }` | Fetch order details with live status events |
| `/api/customer/orders/{id}/cancel` | `POST` | Bearer | `{ reason? }` | `{ success, order }` | Cancel order prior to merchant preparation |

---

## 3. Merchant Application APIs (`/api/merchant`)

| Endpoint | Method | Auth & Tenant | Query / Body | Response Payload | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/merchant/store` | `GET` | Bearer | *None* | `{ store: Store }` | Fetch merchant's assigned store profile |
| `/api/merchant/store` | `PUT` | Bearer + `x-store-id` | `{ name?, description?, isOpen?, serviceRadiusKm? }` | `{ success, store }` | Update store configuration & open/closed toggle |
| `/api/merchant/products` | `GET` | Bearer + `x-store-id` | *None* | `{ products: Product[] }` | Complete catalogue of merchant's store |
| `/api/merchant/catalogue/lookup` | `GET` | Bearer + `x-store-id` | `?barcode=...` | `{ matchFound, source, product: { name, brand, barcode, imageUrl, mrpPaise, packageSize } }` | Native barcode lookup via Open Food Facts & internal DB |
| `/api/merchant/catalogue/search` | `GET` | Bearer + `x-store-id` | `?q=...` | `{ totalMatches, products: ProductLookup[] }` | Text search fallback for product lookup |
| `/api/merchant/products` | `POST` | Bearer + `x-store-id` | `{ name, category, mrpPaise, pricePaise, stock, imageUrl?, barcode?, brand?, packageSize? }` | `{ success, product }` | Create new product in inventory |
| `/api/merchant/products/{id}` | `PUT` | Bearer + `x-store-id` | `{ pricePaise?, stock?, isAvailable?, mrpPaise? }` | `{ success, product }` | Update pricing, stock or availability |
| `/api/merchant/products/{id}` | `DELETE` | Bearer + `x-store-id` | *None* | `{ success }` | Remove product from store catalogue |
| `/api/merchant/orders` | `GET` | Bearer + `x-store-id` | *None* | `{ orders: Order[] }` | Active and historical store orders |
| `/api/merchant/orders/{id}/status` | `POST` | Bearer + `x-store-id` | `{ status: 'ACCEPTED' \| 'REJECTED' \| 'PREPARING' \| 'READY_FOR_PICKUP' \| 'OUT_FOR_DELIVERY' \| 'DELIVERED' \| 'COLLECTED' }` | `{ success, order }` | Transition order lifecycle status |
| `/api/merchant/finance/statements` | `GET` | Bearer + `x-store-id` | *None* | `{ balancePaise, totalEarningsPaise, ledgerEntries }` | View double-entry financial earnings ledger |

---

## 4. Media & Upload API (`/api/upload`)

| Endpoint | Method | Auth | Headers | Content | Response Payload | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/upload/image` | `POST` | Bearer | `Content-Type: multipart/form-data` | Field `image`: Binary file (JPEG, PNG, WebP) | `{ success: true, url: string, filename: string, size: number }` | Upload product image from camera or gallery |
| `/api/upload/ingest-url` | `POST` | Bearer | `application/json` | `{ url: string }` | `{ success: true, url: string }` | Ingest external catalogue image into storage |
