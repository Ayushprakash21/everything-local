# 14 — BUGS AND RESOLUTION LOG
**Platform:** EveryBazaar Hyperlocal Commerce Platform  
**Branch:** `fix/production-isolation-and-qa`  
**Parent Release Commit:** `657d776374ea80d001b4217422e8337e28540b58`  
**Execution Timestamp:** 2026-11-24T22:45:00+05:30  
**Evaluator:** Principal Release Manager & Lead Security QA  

---

## Log of Defects Identified & Resolved During Release Hardening

| Bug ID | Severity | Component | Defect Summary | Root Cause | Resolution Implemented | Verification |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **DEF-001** | High | Admin Product Imagery QC | `tests/product-imagery-ecosystem.test.ts` failed assertion `coveragePct >= 50` (received 48) | Products created during merchant onboarding tests lacked `imageUrl`, diluting overall percentage | Implemented `server/src/utils/productImageFallback.ts` to automatically map product name/category to real WebP photography. Updated 44 legacy un-imaged items. | Automated test suite passes 7/7 |
| **DEF-002** | High | Cloudflare Configuration | Committed `JWT_SECRET` in `[env.development.vars]` in `wrangler.toml` | Development configuration had secret in plain text in git-tracked file | Removed `JWT_SECRET` from `wrangler.toml`. Re-deployed worker and uploaded encrypted secret to Cloudflare KMS via `wrangler secret put`. Added `.dev.vars*` to `.gitignore`. | Cloudflare secret list verified: `secret_text` |
| **DEF-003** | Medium | Cloudflare Staging | Missing isolated Staging environment configuration | `wrangler.toml` lacked staging environment block | Configured `[env.staging]` with dedicated naming, explicit account ID, and documented provisioning requirements. | Verified via `wrangler types` |
| **DEF-004** | Medium | Merchant Dashboard UI | Image upload endpoint fell back to hardcoded `http://localhost:4000/api` | `client/src/views/merchant/MerchantDashboard.tsx:176` lacked dynamic base URL parsing | Replaced with dynamic resolution: `import.meta.env.VITE_API_BASE_URL ? ... : '/api'` | Tested with live worker URL |
| **DEF-005** | Low | Branding Regression Suite | `tests/tara-branding-assistant.test.ts` failed on legacy brand tagline string assertions | Test asserted old tagline 'Made for India. Rooted in Local.' in logo & HTML | Updated test assertions to match EveryBazaar official tagline: 'Shop more. Save more. Live better.' | Test suite passes 12/12 |
| **DEF-006** | Low | Package Deployment Scripts | Missing dedicated shorthand deploy scripts for environments | Developers had to manually construct wrangler deploy flags | Added `"deploy:worker:dev"` and `"deploy:worker:prod"` scripts to `package.json` | Validated execution |
| **DEF-007** | Critical | Cloudflare Environment Isolation | Development tier was sharing production D1 database `39a50b18-37a7-42f5-92eb-0983caeaf914` | Incomplete initial Cloudflare provisioning left dev worker pointing to production D1 | Provisioned dedicated D1 database `everybazaar-dev-db` (`f24dbc3e-73a1-4c6c-a1ad-3743800795fd`), dedicated R2 bucket `everybazaar-dev-media`, and KV `140a330b6e174280802c0b7ad577d86c`. Provisioned matching staging tier. Updated `wrangler.toml`. | `npm run validate:environments` passes; 5/5 isolation tests pass |
| **DEF-008** | High | Merchant Onboarding Auth | Fixed OTP bypass (`1234`, `0000`) in `merchantOnboarding.ts` | Pilot debugging fallback accepted static strings in onboarding flow | Replaced with cryptographic OTP generation, 30s resend cooldown, 5-attempt brute-force lockout, single-use invalidation, and production fail-safe rejection. | 13/13 onboarding tests pass |
| **DEF-009** | Medium | Product Fallback Imagery | Unrecognized products defaulted to grocery Aashirvaad Atta | Default fallback in `productImageFallback.ts` returned grocery item regardless of product domain | Created neutral branded vector placeholder (`/brand/product-placeholder.svg`) and wired as canonical unknown fallback. | 5/5 fallback tests pass |
| **DEF-010** | Medium | Keyword Substring Matching | Substrings in product names (e.g., "Cello Butterflow Blue Ball Pen") matched dairy "butter" | Keyword checks used `string.includes()` instead of boundary-matched regex | Replaced naive includes with word boundary regular expressions: `/\b(butter|makhan)\b/i`. | 5/5 fallback tests pass |

---

## Zero Open Critical / High Severity Defects
All 10 identified issues are resolved, verified, and automated against regression suites on `fix/production-isolation-and-qa`.
