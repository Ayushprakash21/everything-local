# 07. API CONTRACTS
## Product: Everything Local

---

## 1. Authentication & Identity
- `POST /api/auth/register`
  - Body: `{ email, phone, name, password, role: "CUSTOMER" | "MERCHANT" }`
  - Response: `{ user: { id, email, name, role }, token }`
- `POST /api/auth/login`
  - Body: `{ emailOrPhone, password }`
  - Response: `{ user: { id, email, name, role, storeId? }, token }`
- `GET /api/auth/me`
  - Headers: `Authorization: Bearer <token>`
  - Response: `{ user }`

## 2. Customer Marketplace
- `GET /api/customer/stores?lat=22.7196&lng=75.8577&category=grocery`
  - Returns stores within 3.0 km service radius with computed distance.
- `GET /api/customer/stores/:storeId`
  - Returns store details and active product catalogue.
- `GET /api/customer/products/search?q=milk&lat=...&lng=...`
  - Returns matching products from nearby serviceable stores.
- `GET /api/customer/cart`
  - Returns active cart, validated prices, and shortfall from ₹299 minimum order.
- `POST /api/customer/cart/items`
  - Body: `{ storeId, productId, quantity }`
- `DELETE /api/customer/cart/items/:itemId`
- `POST /api/customer/orders/quote`
  - Validates cart, stock, distance, minimum order (₹299), calculates integer paise breakdown.
- `POST /api/customer/orders/checkout`
  - Body: `{ cartId, fulfillmentMode, deliveryAddressId, paymentMethod, idempotencyKey }`
  - Creates Order, reserves inventory, creates initial financial snapshot.
- `GET /api/customer/orders`
  - Returns past and active orders for logged in customer.
- `GET /api/customer/orders/:orderId`
  - Returns detailed status, timeline events, and invoice breakdown.
- `POST /api/customer/orders/:orderId/cancel`
  - Requests customer cancellation within allowed state window.

## 3. Merchant Storefront Operations
- `GET /api/merchant/store`
  - Returns logged-in merchant's store details.
- `PUT /api/merchant/store`
  - Update operating hours, status (open/closed), service radius.
- `GET /api/merchant/products`
  - List products for merchant's store.
- `POST /api/merchant/products`
  - Create new product (name, MRP, price, stock, SKU, category, image).
- `PUT /api/merchant/products/:id`
  - Update product details, price, or toggle stock availability.
- `GET /api/merchant/orders`
  - Returns orders with status filter (`PLACED`, `ACCEPTED`, `PREPARING`, `READY`).
- `POST /api/merchant/orders/:id/status`
  - Body: `{ status: "ACCEPTED" | "REJECTED" | "PREPARING" | "READY_FOR_PICKUP" | "OUT_FOR_DELIVERY" | "DELIVERED" }`
- `GET /api/merchant/finance/statements`
  - Returns commission statement, sales totals, and net payout balances.

## 4. Admin Management & Governance
- `GET /api/admin/metrics`
  - Overall platform metrics (GMV, net platform revenue, orders, stores).
- `GET /api/admin/merchants`
  - Review all merchants and their verification status.
- `POST /api/admin/merchants/:id/verify`
  - Approve or suspend merchant store.
- `PUT /api/admin/merchants/:id/commission`
  - Override merchant commission rate.
- `GET /api/admin/orders`
  - Platform-wide order feed with status filtering and exception flags.
- `GET /api/admin/finance/ledger`
  - Comprehensive double-entry financial ledger records.
- `POST /api/admin/finance/refunds/:orderId`
  - Execute approved refund and debit commission/merchant ledger accordingly.
- `GET /api/admin/settings`
  - Read and update platform settings (e.g. `MIN_ORDER_VALUE_PAISE`, `DEFAULT_COMMISSION_PCT`, `DEFAULT_SERVICE_RADIUS_KM`).
