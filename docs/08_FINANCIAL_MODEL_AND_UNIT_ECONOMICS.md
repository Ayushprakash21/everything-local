# 08. FINANCIAL MODEL AND UNIT ECONOMICS
## Product: Everything Local
**Market:** Indore, MP  
**Calculation Standard:** Integer Paise Arithmetic  

---

## 1. Principles of Financial Integrity
1. **Integer Representation:** All calculations are performed in paise. `₹299.00` is represented as `29900`.
2. **Clear Separation of Cash Flow vs Revenue:**
   - **Gross Merchandise Value (GMV):** Total value of goods purchased by consumers. GMV is NOT platform revenue.
   - **Delivery Fees Collected:** Customer delivery payments for merchant or third-party fulfillment are pass-through amounts, not platform revenue.
   - **Platform Net Revenue:** Strictly equal to:
     $$\text{Platform Revenue} = \text{Commission Earned} + \text{Platform Tech Fees} + \text{Merchant Subscriptions} - \text{Payment Gateway Costs}$$
3. **Commission Formula:**
   - Commission is applied to the **Item Subtotal (after item discounts)**.
   - Commission is **NOT** charged on government taxes (GST) or delivery charges.
   - Example: Order with Item Subtotal = ₹500 (50,000 paise), Commission Rate = 3.5%.
     $$\text{Commission} = \lfloor 50000 \times 0.035 \rfloor = 1750 \text{ paise (₹17.50)}$$
     $$\text{Merchant Net Payable} = 50000 - 1750 = 48250 \text{ paise (₹482.50)}$$
4. **Fulfillment Economics:**
   - `PICKUP`: Customer pays ₹0 delivery fee. Merchant delivers across counter. Platform charges standard 3–4% commission on goods.
   - `MERCHANT_DELIVERY`: Customer pays merchant delivery fee (e.g. ₹20). Fee passes 100% to merchant.
   - `PLATFORM_THIRD_PARTY`: Customer pays estimated delivery fee (e.g. ₹35). Platform remits fee directly to logistics partner (e.g., Porter).

## 2. Unit Economic Breakdown (Sample ₹400 Order in Indore)
| Line Item | Customer Paid (Paise) | Platform Split (Paise) | Merchant Split (Paise) | Logistics Provider |
|---|---|---|---|---|
| Items Subtotal | 40,000 (₹400) | - | - | - |
| Delivery Fee (3km) | 3,000 (₹30) | - | - | 3,000 (₹30) |
| Total Paid by Customer | 43,000 (₹430) | - | - | - |
| Platform Commission (3.5%) | - | +1,400 (₹14) | -1,400 (-₹14) | - |
| Gateway Processing (~1.8%) | - | -774 (-₹7.74) | - | - |
| **Net Contribution** | - | **+626 (+₹6.26)** | **38,600 (₹386.00)** | **3,000 (₹30.00)** |

## 3. Financial Ledgers & Settlements
- Orders create immutable financial snapshots at moment of placement and completion.
- Cancellations and refunds trigger opposing debit/credit ledger entries.
- Merchants can view reconciled statements showing weekly batches eligible for NEFT/UPI settlement.
