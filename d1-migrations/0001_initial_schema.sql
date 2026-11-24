-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CUSTOMER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Store" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'grocery',
    "addressLine" TEXT NOT NULL,
    "city" TEXT NOT NULL DEFAULT 'Indore',
    "pincode" TEXT NOT NULL,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "serviceRadiusKm" REAL NOT NULL DEFAULT 3.0,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "commissionRatePct" REAL NOT NULL DEFAULT 3.5,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Store_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "mrpPaise" INTEGER NOT NULL,
    "pricePaise" INTEGER NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "imageUrl" TEXT,
    "sku" TEXT,
    "barcode" TEXT,
    "brand" TEXT,
    "packageSize" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CustomerAddress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'Home',
    "addressLine" TEXT NOT NULL,
    "landmark" TEXT,
    "city" TEXT NOT NULL DEFAULT 'Indore',
    "pincode" TEXT NOT NULL,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CustomerAddress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Cart" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "storeId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Cart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Cart_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CartItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cartId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPricePaise" INTEGER NOT NULL,
    CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLACED',
    "fulfillmentMode" TEXT NOT NULL DEFAULT 'PICKUP',
    "deliveryAddressId" TEXT,
    "itemSubtotalPaise" INTEGER NOT NULL,
    "deliveryFeePaise" INTEGER NOT NULL DEFAULT 0,
    "taxPaise" INTEGER NOT NULL DEFAULT 0,
    "discountPaise" INTEGER NOT NULL DEFAULT 0,
    "totalAmountPaise" INTEGER NOT NULL,
    "commissionPaise" INTEGER NOT NULL,
    "merchantPayablePaise" INTEGER NOT NULL,
    "platformRevenuePaise" INTEGER NOT NULL,
    "idempotencyKey" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPricePaise" INTEGER NOT NULL,
    "totalPricePaise" INTEGER NOT NULL,
    CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OrderEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "actorId" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrderEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FinancialLedgerEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT,
    "parentOrderId" TEXT,
    "storeId" TEXT NOT NULL,
    "entryType" TEXT NOT NULL,
    "amountPaise" INTEGER NOT NULL,
    "runningBalancePaise" INTEGER NOT NULL DEFAULT 0,
    "reference" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FinancialLedgerEntry_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FinancialLedgerEntry_parentOrderId_fkey" FOREIGN KEY ("parentOrderId") REFERENCES "ParentOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FinancialLedgerEntry_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlatformSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "valueJson" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "detailsJson" TEXT,
    "ipAddress" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MerchantSubscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "planName" TEXT NOT NULL,
    "monthlyPricePaise" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "startsAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    CONSTRAINT "MerchantSubscription_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "orderId" TEXT,
    "customerId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Review_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Review_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ServiceCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ServiceProvider" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "profileImageUrl" TEXT,
    "contactPhone" TEXT NOT NULL,
    "contactEmail" TEXT,
    "categorySlug" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "kycDocumentUrl" TEXT,
    "commissionRatePct" REAL NOT NULL DEFAULT 10.0,
    "rating" REAL NOT NULL DEFAULT 4.9,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "hasShopVisit" BOOLEAN NOT NULL DEFAULT true,
    "shopAddressLine" TEXT,
    "shopCity" TEXT NOT NULL DEFAULT 'Indore',
    "shopPincode" TEXT,
    "shopLatitude" REAL,
    "shopLongitude" REAL,
    "hasHomeVisit" BOOLEAN NOT NULL DEFAULT true,
    "homeVisitRadiusKm" REAL NOT NULL DEFAULT 7.0,
    "homeVisitFeePaise" INTEGER NOT NULL DEFAULT 0,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ServiceProvider_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProviderStaff" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "providerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProviderStaff_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ServiceProvider" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ServiceListing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "providerId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "pricePaise" INTEGER NOT NULL,
    "mrpPaise" INTEGER,
    "pricingType" TEXT NOT NULL DEFAULT 'FIXED',
    "durationMinutes" INTEGER NOT NULL DEFAULT 45,
    "allowsShopVisit" BOOLEAN NOT NULL DEFAULT true,
    "allowsHomeVisit" BOOLEAN NOT NULL DEFAULT true,
    "materialIncluded" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ServiceListing_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ServiceProvider" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ServiceListing_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ServiceCategory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ServiceArea" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "providerId" TEXT NOT NULL,
    "locality" TEXT NOT NULL,
    "pincode" TEXT,
    CONSTRAINT "ServiceArea_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ServiceProvider" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProviderAvailability" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "providerId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "slotDurationMinutes" INTEGER NOT NULL DEFAULT 60,
    "isDayOff" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "ProviderAvailability_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ServiceProvider" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AppointmentSlot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "providerId" TEXT NOT NULL,
    "staffId" TEXT,
    "date" TEXT NOT NULL,
    "timeSlot" TEXT NOT NULL,
    "isBooked" BOOLEAN NOT NULL DEFAULT false,
    "bookingId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AppointmentSlot_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ServiceProvider" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AppointmentSlot_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "ProviderStaff" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ServiceBooking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "staffId" TEXT,
    "fulfillmentType" TEXT NOT NULL,
    "bookingDate" TEXT NOT NULL,
    "timeSlot" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_CONFIRMATION',
    "customerAddressLine" TEXT,
    "customerLocality" TEXT,
    "customerCity" TEXT NOT NULL DEFAULT 'Indore',
    "customerPincode" TEXT,
    "customerLat" REAL,
    "customerLng" REAL,
    "instructions" TEXT,
    "serviceFeePaise" INTEGER NOT NULL,
    "travelFeePaise" INTEGER NOT NULL DEFAULT 0,
    "materialFeePaise" INTEGER NOT NULL DEFAULT 0,
    "discountPaise" INTEGER NOT NULL DEFAULT 0,
    "totalAmountPaise" INTEGER NOT NULL,
    "commissionPaise" INTEGER NOT NULL,
    "providerPayablePaise" INTEGER NOT NULL,
    "platformRevenuePaise" INTEGER NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "cancellationReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ServiceBooking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ServiceBooking_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ServiceProvider" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ServiceBooking_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "ServiceListing" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ServiceBooking_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "ProviderStaff" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BookingStatusEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "actorId" TEXT,
    "actorRole" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BookingStatusEvent_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "ServiceBooking" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ServiceReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ServiceReview_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "ServiceBooking" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ServiceReview_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ServiceProvider" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ServiceReview_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProviderEarning" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "providerId" TEXT NOT NULL,
    "bookingId" TEXT,
    "amountPaise" INTEGER NOT NULL,
    "commissionPaise" INTEGER NOT NULL,
    "netEarningPaise" INTEGER NOT NULL,
    "payoutStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "reference" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProviderEarning_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ServiceProvider" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ServicePayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingId" TEXT NOT NULL,
    "amountPaise" INTEGER NOT NULL,
    "paymentMethod" TEXT NOT NULL DEFAULT 'CASH_ON_SERVICE',
    "transactionRef" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PAID',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ServicePayment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "ServiceBooking" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pharmacy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalBusinessName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "addressLine" TEXT NOT NULL,
    "city" TEXT NOT NULL DEFAULT 'Indore',
    "pincode" TEXT NOT NULL,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "operatingHours" TEXT NOT NULL DEFAULT '08:00 AM - 11:00 PM',
    "serviceRadiusKm" REAL NOT NULL DEFAULT 5.0,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "verificationStatus" TEXT NOT NULL DEFAULT 'UNDER_VERIFICATION',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "rejectionReason" TEXT,
    "counterPickup" BOOLEAN NOT NULL DEFAULT true,
    "homeDelivery" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Pharmacy_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PharmacyLicence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pharmacyId" TEXT NOT NULL,
    "licenceType" TEXT NOT NULL,
    "licenceNumber" TEXT NOT NULL,
    "issuingAuthority" TEXT NOT NULL DEFAULT 'Madhya Pradesh Food and Drugs Administration (FDA)',
    "validFrom" DATETIME NOT NULL,
    "validUpto" DATETIME NOT NULL,
    "documentUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "verifiedAt" DATETIME,
    "verifiedByAdminId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PharmacyLicence_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RegisteredPharmacist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pharmacyId" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "registrationNumber" TEXT NOT NULL,
    "councilName" TEXT NOT NULL DEFAULT 'Madhya Pradesh State Pharmacy Council',
    "qualification" TEXT NOT NULL DEFAULT 'B.Pharm / M.Pharm',
    "registrationValidity" DATETIME NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "certificateUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RegisteredPharmacist_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MedicineClassification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "requiresPrescription" BOOLEAN NOT NULL DEFAULT false,
    "isOnlineSalePermitted" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "regulatoryNotes" TEXT
);

-- CreateTable
CREATE TABLE "Medicine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "genericName" TEXT NOT NULL,
    "strength" TEXT NOT NULL,
    "dosageForm" TEXT NOT NULL,
    "packSize" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "mrpPaise" INTEGER NOT NULL,
    "sellingPricePaise" INTEGER NOT NULL,
    "classification" TEXT NOT NULL DEFAULT 'SCHEDULE_H',
    "requiresPrescription" BOOLEAN NOT NULL DEFAULT true,
    "isProhibitedOnline" BOOLEAN NOT NULL DEFAULT false,
    "storageRequirement" TEXT DEFAULT 'Store below 25°C in a dry place',
    "imageUrl" TEXT,
    "barcode" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PharmacyInventory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pharmacyId" TEXT NOT NULL,
    "medicineId" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "expiryDate" DATETIME NOT NULL,
    "stockQuantity" INTEGER NOT NULL DEFAULT 0,
    "mrpPaise" INTEGER NOT NULL,
    "sellingPricePaise" INTEGER NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PharmacyInventory_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PharmacyInventory_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Prescription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "prescriptionNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "pharmacyId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "patientName" TEXT NOT NULL,
    "patientAge" INTEGER NOT NULL,
    "patientGender" TEXT NOT NULL,
    "patientRelation" TEXT NOT NULL DEFAULT 'Self',
    "doctorName" TEXT,
    "doctorRegNumber" TEXT,
    "clinicHospital" TEXT,
    "prescriptionDate" DATETIME,
    "customerNotes" TEXT,
    "pharmacistNotes" TEXT,
    "rejectionReason" TEXT,
    "deliveryAddress" TEXT,
    "deliveryType" TEXT NOT NULL DEFAULT 'HOME_DELIVERY',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Prescription_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Prescription_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PrescriptionDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "prescriptionId" TEXT NOT NULL,
    "pageNumber" INTEGER NOT NULL DEFAULT 1,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PrescriptionDocument_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PrescriptionReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "prescriptionId" TEXT NOT NULL,
    "pharmacistId" TEXT NOT NULL,
    "pharmacistName" TEXT NOT NULL,
    "pharmacistRegNo" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "doctorVerified" BOOLEAN NOT NULL DEFAULT false,
    "validityVerified" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "rejectionReason" TEXT,
    "reviewTimestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PrescriptionReview_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PharmacyQuotation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quotationNumber" TEXT NOT NULL,
    "prescriptionId" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_CUSTOMER',
    "subtotalPaise" INTEGER NOT NULL,
    "taxPaise" INTEGER NOT NULL DEFAULT 0,
    "deliveryFeePaise" INTEGER NOT NULL DEFAULT 0,
    "totalPaise" INTEGER NOT NULL,
    "deliveryType" TEXT NOT NULL DEFAULT 'HOME_DELIVERY',
    "estimatedDeliveryMinutes" INTEGER NOT NULL DEFAULT 30,
    "validUntil" DATETIME NOT NULL,
    "pharmacistNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PharmacyQuotation_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PharmacyQuotation_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuotationItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quotationId" TEXT NOT NULL,
    "medicineId" TEXT,
    "medicineName" TEXT NOT NULL,
    "dosageStrength" TEXT NOT NULL,
    "prescribedQuantity" INTEGER NOT NULL,
    "approvedQuantity" INTEGER NOT NULL,
    "unitPricePaise" INTEGER NOT NULL,
    "totalPricePaise" INTEGER NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "substitutionNote" TEXT,
    CONSTRAINT "QuotationItem_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "PharmacyQuotation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PharmacyOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL,
    "prescriptionId" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "totalAmountPaise" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "deliveryType" TEXT NOT NULL DEFAULT 'HOME_DELIVERY',
    "deliveryAddress" TEXT,
    "paymentStatus" TEXT NOT NULL DEFAULT 'CASH_ON_DELIVERY',
    "dispensedByPharmacist" TEXT,
    "dispensedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PharmacyOrder_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PharmacyOrder_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PharmacyOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DispensingRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "pharmacistId" TEXT NOT NULL,
    "pharmacistName" TEXT NOT NULL,
    "pharmacistRegNo" TEXT NOT NULL,
    "medicineName" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "expiryDate" TEXT NOT NULL,
    "quantityDispensed" INTEGER NOT NULL,
    "dispenseTimestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DispensingRecord_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "PharmacyOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PrescriptionAuditEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "prescriptionId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "actorName" TEXT,
    "action" TEXT NOT NULL,
    "ipAddress" TEXT,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PrescriptionAuditEvent_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ParentOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLACED',
    "paymentStatus" TEXT NOT NULL DEFAULT 'PAID',
    "paymentMethod" TEXT NOT NULL DEFAULT 'ONLINE',
    "deliveryTier" TEXT NOT NULL DEFAULT 'STANDARD_60',
    "deliveryAddress" TEXT NOT NULL,
    "deliveryLatitude" REAL,
    "deliveryLongitude" REAL,
    "deliveryEtaMinutes" INTEGER NOT NULL DEFAULT 45,
    "totalItemSubtotalPaise" INTEGER NOT NULL,
    "totalDeliveryFeePaise" INTEGER NOT NULL DEFAULT 0,
    "totalDiscountPaise" INTEGER NOT NULL DEFAULT 0,
    "totalTaxPaise" INTEGER NOT NULL DEFAULT 0,
    "totalPaidPaise" INTEGER NOT NULL,
    "refundedAmountPaise" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ParentOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MerchantChildOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "parentOrderId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "childOrderNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_ACCEPTANCE',
    "subtotalPaise" INTEGER NOT NULL,
    "commissionRatePct" REAL NOT NULL DEFAULT 5.0,
    "commissionPaise" INTEGER NOT NULL DEFAULT 0,
    "merchantPayablePaise" INTEGER NOT NULL DEFAULT 0,
    "rejectionReason" TEXT,
    "acceptedAt" DATETIME,
    "readyAt" DATETIME,
    "deliveredAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MerchantChildOrder_parentOrderId_fkey" FOREIGN KEY ("parentOrderId") REFERENCES "ParentOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MerchantChildOrder_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MerchantChildOrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "merchantOrderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPricePaise" INTEGER NOT NULL,
    "totalPricePaise" INTEGER NOT NULL,
    "isFulfilled" BOOLEAN NOT NULL DEFAULT true,
    "rejectionReason" TEXT,
    CONSTRAINT "MerchantChildOrderItem_merchantOrderId_fkey" FOREIGN KEY ("merchantOrderId") REFERENCES "MerchantChildOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RiderProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "riderCode" TEXT NOT NULL,
    "vehicleType" TEXT NOT NULL DEFAULT 'MOTORCYCLE',
    "vehicleNumber" TEXT NOT NULL,
    "drivingLicenceNumber" TEXT NOT NULL,
    "panNumber" TEXT,
    "bankAccountNumber" TEXT,
    "bankIfsc" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "currentLatitude" REAL,
    "currentLongitude" REAL,
    "rating" REAL NOT NULL DEFAULT 4.9,
    "totalDeliveries" INTEGER NOT NULL DEFAULT 0,
    "approvalStatus" TEXT NOT NULL DEFAULT 'APPROVED',
    "serviceArea" TEXT NOT NULL DEFAULT 'Indore - All Zones',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RiderProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DeliveryTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskNumber" TEXT NOT NULL,
    "parentOrderId" TEXT,
    "merchantOrderId" TEXT,
    "riderId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "priorityTier" TEXT NOT NULL DEFAULT 'STANDARD_60',
    "pickupLocationName" TEXT NOT NULL,
    "pickupAddress" TEXT NOT NULL,
    "pickupLatitude" REAL NOT NULL,
    "pickupLongitude" REAL NOT NULL,
    "deliveryAddress" TEXT NOT NULL,
    "deliveryLatitude" REAL NOT NULL,
    "deliveryLongitude" REAL NOT NULL,
    "estimatedDistanceKm" REAL NOT NULL DEFAULT 2.5,
    "estimatedMinutes" INTEGER NOT NULL DEFAULT 30,
    "riderBasePayoutPaise" INTEGER NOT NULL DEFAULT 3000,
    "additionalPickupPayoutPaise" INTEGER NOT NULL DEFAULT 0,
    "waitingPayoutPaise" INTEGER NOT NULL DEFAULT 0,
    "surgePayoutPaise" INTEGER NOT NULL DEFAULT 0,
    "totalPayoutPaise" INTEGER NOT NULL DEFAULT 3000,
    "pickupOtp" TEXT NOT NULL,
    "deliveryOtp" TEXT NOT NULL,
    "deliveryOtpHashed" TEXT,
    "deliveryOtpExpiresAt" DATETIME,
    "deliveryOtpAttempts" INTEGER NOT NULL DEFAULT 0,
    "deliveryOtpMaxAttempts" INTEGER NOT NULL DEFAULT 5,
    "pickupOtpHashed" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "acceptanceDeadline" DATETIME,
    "cancellationReason" TEXT,
    "specialHandling" TEXT,
    "acceptedAt" DATETIME,
    "atStoreAt" DATETIME,
    "pickedUpAt" DATETIME,
    "deliveredAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DeliveryTask_parentOrderId_fkey" FOREIGN KEY ("parentOrderId") REFERENCES "ParentOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DeliveryTask_merchantOrderId_fkey" FOREIGN KEY ("merchantOrderId") REFERENCES "MerchantChildOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DeliveryTask_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "RiderProfile" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DeliveryPartnerDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partnerId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentNumber" TEXT,
    "fileUrl" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSizeBytes" INTEGER,
    "verificationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "verifiedByAdminId" TEXT,
    "rejectionReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DeliveryPartnerDocument_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "RiderProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DeliveryPartnerVehicle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partnerId" TEXT NOT NULL,
    "vehicleType" TEXT NOT NULL,
    "registrationNumber" TEXT NOT NULL,
    "makeModel" TEXT,
    "rcDocumentUrl" TEXT,
    "insurancePolicyNumber" TEXT,
    "insuranceExpiryDate" DATETIME,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DeliveryPartnerVehicle_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "RiderProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DeliveryPartnerAvailability" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partnerId" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL,
    "shiftStart" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "shiftEnd" DATETIME,
    "durationMinutes" INTEGER NOT NULL DEFAULT 0,
    "batteryPercentage" INTEGER,
    "networkType" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "emergencyReason" TEXT,
    "lastPingAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DeliveryPartnerAvailability_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "RiderProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DeliveryAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OFFERED',
    "offeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "respondedAt" DATETIME,
    "responseLatencySeconds" INTEGER,
    "declineReason" TEXT,
    CONSTRAINT "DeliveryAssignment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "DeliveryTask" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DeliveryAssignment_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "RiderProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DeliveryLocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partnerId" TEXT NOT NULL,
    "taskId" TEXT,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "accuracyMeters" REAL,
    "speedKmph" REAL,
    "headingDegrees" REAL,
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DeliveryLocation_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "RiderProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DeliveryLocation_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "DeliveryTask" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DeliveryStatusHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "fromStatus" TEXT NOT NULL,
    "toStatus" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "actorId" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "notes" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DeliveryStatusHistory_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "DeliveryTask" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DeliveryProof" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "pickupConfirmedAt" DATETIME,
    "deliveryConfirmedAt" DATETIME,
    "deliveryOtpProvided" TEXT,
    "photoProofUrl" TEXT,
    "signatureUrl" TEXT,
    "recipientNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DeliveryProof_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "DeliveryTask" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DeliveryIncident" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT,
    "partnerId" TEXT NOT NULL,
    "incidentType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "photoUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "reportedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME,
    "resolutionNotes" TEXT,
    "adminAction" TEXT,
    CONSTRAINT "DeliveryIncident_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "DeliveryTask" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DeliveryIncident_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "RiderProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RiderEarningLedger" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "riderId" TEXT NOT NULL,
    "deliveryTaskId" TEXT,
    "type" TEXT NOT NULL,
    "amountPaise" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "settlementStatus" TEXT NOT NULL DEFAULT 'UNSETTLED',
    "settlementId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RiderEarningLedger_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "RiderProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RiderEarningLedger_deliveryTaskId_fkey" FOREIGN KEY ("deliveryTaskId") REFERENCES "DeliveryTask" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "RiderEarningLedger_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "RiderSettlement" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RiderSettlement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "riderId" TEXT NOT NULL,
    "periodStart" DATETIME NOT NULL,
    "periodEnd" DATETIME NOT NULL,
    "totalEarningsPaise" INTEGER NOT NULL,
    "deductionsPaise" INTEGER NOT NULL DEFAULT 0,
    "netPayoutPaise" INTEGER NOT NULL,
    "payoutMethod" TEXT NOT NULL DEFAULT 'BANK_TRANSFER',
    "payoutReference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PROCESSED',
    "processedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RiderSettlement_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "RiderProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DeliveryPricingRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tierCode" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "targetMinutes" INTEGER NOT NULL,
    "baseDeliveryPaise" INTEGER NOT NULL,
    "perKmPaise" INTEGER NOT NULL,
    "prioritySurchargePaise" INTEGER NOT NULL,
    "maxRoadDistanceKm" REAL NOT NULL,
    "additionalPickupPaise" INTEGER NOT NULL DEFAULT 1500,
    "weightSurchargePaisePerKg" INTEGER NOT NULL DEFAULT 500,
    "peakMultiplier" REAL NOT NULL DEFAULT 1.0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CategoryCommissionRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categorySlug" TEXT NOT NULL,
    "categoryName" TEXT NOT NULL,
    "defaultCommissionPct" REAL NOT NULL,
    "listingFeePct" REAL NOT NULL DEFAULT 2.0,
    "minOrderValuePaise" INTEGER NOT NULL DEFAULT 19900,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MerchantSettlementStatement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "statementNumber" TEXT NOT NULL,
    "periodStart" DATETIME NOT NULL,
    "periodEnd" DATETIME NOT NULL,
    "grossSalesPaise" INTEGER NOT NULL,
    "commissionDeductedPaise" INTEGER NOT NULL,
    "listingChargesPaise" INTEGER NOT NULL DEFAULT 0,
    "refundDeductionsPaise" INTEGER NOT NULL DEFAULT 0,
    "netMerchantPayablePaise" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'GENERATED',
    "bankReference" TEXT,
    "settledAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MerchantSettlementStatement_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Household" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "monthlyBudgetPaise" INTEGER NOT NULL DEFAULT 1500000,
    "monthlySpendPaise" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Household_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HouseholdMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "householdId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "canSpend" BOOLEAN NOT NULL DEFAULT true,
    "monthlySpendLimitPaise" INTEGER,
    CONSTRAINT "HouseholdMember_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HouseholdMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HouseholdShoppingItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "householdId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit" TEXT,
    "estimatedPricePaise" INTEGER,
    "isPurchased" BOOLEAN NOT NULL DEFAULT false,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "recurringIntervalDays" INTEGER,
    "lastPurchasedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HouseholdShoppingItem_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CommunityCampaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "productId" TEXT,
    "targetQuantity" INTEGER NOT NULL,
    "currentPledged" INTEGER NOT NULL DEFAULT 0,
    "originalPricePaise" INTEGER NOT NULL,
    "discountedPricePaise" INTEGER NOT NULL,
    "minParticipants" INTEGER NOT NULL DEFAULT 10,
    "currentParticipants" INTEGER NOT NULL DEFAULT 0,
    "endsAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CommunityCampaign_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LoyaltyAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "pointsBalance" INTEGER NOT NULL DEFAULT 100,
    "tier" TEXT NOT NULL DEFAULT 'SILVER',
    "lifetimePoints" INTEGER NOT NULL DEFAULT 100,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LoyaltyAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LoyaltyLedgerEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "pointsChange" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "referenceId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LoyaltyLedgerEntry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LoyaltyAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdCampaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "placement" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "description" TEXT,
    "creativeUrl" TEXT,
    "targetCategory" TEXT,
    "targetLocality" TEXT,
    "dailyBudgetPaise" INTEGER NOT NULL,
    "totalBudgetPaise" INTEGER NOT NULL,
    "spentPaise" INTEGER NOT NULL DEFAULT 0,
    "pricingModel" TEXT NOT NULL DEFAULT 'CPC',
    "status" TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "startsAt" DATETIME NOT NULL,
    "endsAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AdCampaign_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MerchantApplication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "referenceNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "completionPct" INTEGER NOT NULL DEFAULT 10,
    "ownerName" TEXT NOT NULL,
    "ownerPhone" TEXT NOT NULL,
    "ownerEmail" TEXT NOT NULL,
    "isPhoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "communicationConsent" BOOLEAN NOT NULL DEFAULT true,
    "businessName" TEXT,
    "legalName" TEXT,
    "entityType" TEXT,
    "panNumber" TEXT,
    "isGstRegistered" BOOLEAN NOT NULL DEFAULT false,
    "gstin" TEXT,
    "businessRegistrationNumber" TEXT,
    "storeName" TEXT,
    "category" TEXT DEFAULT 'grocery',
    "description" TEXT,
    "addressLine" TEXT,
    "city" TEXT DEFAULT 'Indore',
    "district" TEXT DEFAULT 'Indore',
    "state" TEXT DEFAULT 'Madhya Pradesh',
    "pincode" TEXT,
    "latitude" REAL DEFAULT 22.7196,
    "longitude" REAL DEFAULT 75.8577,
    "storePhotos" TEXT,
    "storeLogoUrl" TEXT,
    "storeCoverPhoto" TEXT,
    "openingTime" TEXT DEFAULT '09:00',
    "closingTime" TEXT DEFAULT '21:00',
    "weeklyClosingDay" TEXT DEFAULT 'None',
    "hasPickup" BOOLEAN NOT NULL DEFAULT true,
    "hasMerchantDelivery" BOOLEAN NOT NULL DEFAULT false,
    "hasPlatformDelivery" BOOLEAN NOT NULL DEFAULT true,
    "deliveryRadiusKm" REAL NOT NULL DEFAULT 3.0,
    "minOrderValuePaise" INTEGER NOT NULL DEFAULT 29900,
    "estimatedPrepMinutes" INTEGER NOT NULL DEFAULT 20,
    "deliveryOperatingHours" TEXT DEFAULT '09:00 - 21:00',
    "fssaiNumber" TEXT,
    "drugLicenseNumber" TEXT,
    "productsCatalogueJson" TEXT,
    "initialProductsCount" INTEGER NOT NULL DEFAULT 0,
    "commissionRatePct" REAL NOT NULL DEFAULT 3.5,
    "listingFeePaise" INTEGER NOT NULL DEFAULT 0,
    "settlementFrequency" TEXT NOT NULL DEFAULT 'T_PLUS_1',
    "adminFeedback" TEXT,
    "rejectionReason" TEXT,
    "reviewedByAdminId" TEXT,
    "reviewedAt" DATETIME,
    "approvedAt" DATETIME,
    "activatedStoreId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MerchantApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MerchantApplication_activatedStoreId_fkey" FOREIGN KEY ("activatedStoreId") REFERENCES "Store" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MerchantDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "verificationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "adminComment" TEXT,
    "rejectionReason" TEXT,
    "isProtected" BOOLEAN NOT NULL DEFAULT true,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MerchantDocument_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "MerchantApplication" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MerchantBankAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "accountHolderName" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "branchName" TEXT,
    "accountType" TEXT NOT NULL DEFAULT 'CURRENT',
    "accountNumber" TEXT NOT NULL,
    "accountNumberMasked" TEXT NOT NULL,
    "ifsc" TEXT NOT NULL,
    "ownershipDeclaration" BOOLEAN NOT NULL DEFAULT true,
    "chequeDocumentUrl" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "pennyDropRef" TEXT,
    "pennyDropBeneficiaryName" TEXT,
    "pennyDropMatchScore" REAL,
    "pennyDropStatus" TEXT NOT NULL DEFAULT 'NOT_INITIATED',
    "verificationMethod" TEXT NOT NULL DEFAULT 'AUTOMATED_PENNY_DROP',
    "verifiedByAdminId" TEXT,
    "rejectionReason" TEXT,
    "lastReverificationTriggeredAt" DATETIME,
    "auditTrail" TEXT,
    "verifiedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MerchantBankAccount_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "MerchantApplication" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MerchantAgreement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "version" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "categoryRates" TEXT NOT NULL,
    "effectiveFrom" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "MerchantAgreementAcceptance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "agreementVersion" TEXT NOT NULL,
    "merchantName" TEXT NOT NULL,
    "merchantEmail" TEXT NOT NULL,
    "acceptedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    CONSTRAINT "MerchantAgreementAcceptance_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "MerchantApplication" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MerchantOnboardingHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "fromStatus" TEXT NOT NULL,
    "toStatus" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "actorId" TEXT,
    "notes" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MerchantOnboardingHistory_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "MerchantApplication" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Store_slug_key" ON "Store"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Order_idempotencyKey_key" ON "Order"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformSetting_key_key" ON "PlatformSetting"("key");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceCategory_slug_key" ON "ServiceCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceProvider_slug_key" ON "ServiceProvider"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentSlot_providerId_date_timeSlot_key" ON "AppointmentSlot"("providerId", "date", "timeSlot");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceBooking_bookingNumber_key" ON "ServiceBooking"("bookingNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceReview_bookingId_key" ON "ServiceReview"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "ServicePayment_bookingId_key" ON "ServicePayment"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "Pharmacy_slug_key" ON "Pharmacy"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "MedicineClassification_code_key" ON "MedicineClassification"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Prescription_prescriptionNumber_key" ON "Prescription"("prescriptionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PharmacyQuotation_quotationNumber_key" ON "PharmacyQuotation"("quotationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PharmacyOrder_orderNumber_key" ON "PharmacyOrder"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PharmacyOrder_prescriptionId_key" ON "PharmacyOrder"("prescriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "ParentOrder_orderNumber_key" ON "ParentOrder"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantChildOrder_childOrderNumber_key" ON "MerchantChildOrder"("childOrderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "RiderProfile_userId_key" ON "RiderProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RiderProfile_riderCode_key" ON "RiderProfile"("riderCode");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryTask_taskNumber_key" ON "DeliveryTask"("taskNumber");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryProof_taskId_key" ON "DeliveryProof"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryPricingRule_tierCode_key" ON "DeliveryPricingRule"("tierCode");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryCommissionRule_categorySlug_key" ON "CategoryCommissionRule"("categorySlug");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantSettlementStatement_statementNumber_key" ON "MerchantSettlementStatement"("statementNumber");

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyAccount_userId_key" ON "LoyaltyAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantApplication_referenceNumber_key" ON "MerchantApplication"("referenceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantBankAccount_applicationId_key" ON "MerchantBankAccount"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantAgreement_version_key" ON "MerchantAgreement"("version");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantAgreementAcceptance_applicationId_key" ON "MerchantAgreementAcceptance"("applicationId");

