# 06. DATA MODEL SPECIFICATION
## Product: Everything Local

---

## 1. Relational Entity Overview
Every monetary field is strictly an integer representing value in Indian paise (`1 INR = 100 paise`).

### Core Entities:
1. `User` (id, email, phone, name, passwordHash, role: CUSTOMER | MERCHANT | ADMIN, createdAt, updatedAt)
2. `Store` (id, ownerId [FK->User], name, slug, description, category, addressLine, city, pincode, latitude, longitude, serviceRadiusKm, isOpen, isVerified, commissionRatePct, createdAt, updatedAt)
3. `Product` (id, storeId [FK->Store], name, description, category, mrpPaise, pricePaise, stock, isAvailable, imageUrl, sku, createdAt, updatedAt)
4. `CustomerAddress` (id, userId [FK->User], label, addressLine, landmark, city, pincode, latitude, longitude, isDefault)
5. `Cart` (id, userId [FK->User], storeId [FK->Store, nullable], updatedAt)
6. `CartItem` (id, cartId [FK->Cart], productId [FK->Product], quantity, unitPricePaise)
7. `Order` (id, orderNumber, customerId [FK->User], storeId [FK->Store], status, fulfillmentMode: PICKUP | MERCHANT_DELIVERY | PLATFORM_DELIVERY, deliveryAddressId, itemSubtotalPaise, deliveryFeePaise, taxPaise, discountPaise, totalAmountPaise, commissionPaise, merchantPayablePaise, platformRevenuePaise, idempotencyKey, createdAt, updatedAt)
8. `OrderItem` (id, orderId [FK->Order], productId [FK->Product], productName, quantity, unitPricePaise, totalPricePaise)
9. `OrderEvent` (id, orderId [FK->Order], status, actorId, note, createdAt)
10. `FinancialLedgerEntry` (id, orderId [FK->Order, nullable], storeId [FK->Store], entryType: ORDER_EARNING | COMMISSION_DEBIT | REFUND_DEBIT | PAYOUT_CREDIT, amountPaise, runningBalancePaise, reference, createdAt)
11. `PlatformSetting` (id, key, valueJson, description, updatedAt)
12. `AuditLog` (id, userId [FK->User], action, resourceType, resourceId, detailsJson, ipAddress, createdAt)
13. `MerchantSubscription` (id, storeId [FK->Store], planName, monthlyPricePaise, status, startsAt, expiresAt)
14. `Review` (id, storeId [FK->Store], orderId [FK->Order], customerId [FK->User], rating, comment, createdAt)
