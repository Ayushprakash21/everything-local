package com.ayushp0021.everythinglocal.core.models

import kotlinx.serialization.Serializable

@Serializable
data class User(
    val id: String,
    val email: String,
    val phone: String? = null,
    val name: String,
    val role: String, // CUSTOMER, MERCHANT, ADMIN
    val storeId: String? = null,
    val store: Store? = null
)

@Serializable
data class Store(
    val id: String,
    val name: String,
    val slug: String? = null,
    val description: String? = null,
    val category: String = "grocery",
    val addressLine: String = "",
    val city: String = "Indore",
    val pincode: String = "",
    val latitude: Double = 0.0,
    val longitude: Double = 0.0,
    val distanceKm: Double = 0.0,
    val isServiceable: Boolean = true,
    val isPickupAvailable: Boolean = true,
    val serviceRadiusKm: Double = 3.0,
    val rating: Double = 4.8,
    val reviewCount: Int = 0,
    val isOpen: Boolean = true,
    val isVerified: Boolean = true,
    val sampleProducts: List<Product> = emptyList()
)

@Serializable
data class Product(
    val id: String,
    val storeId: String = "",
    val name: String,
    val description: String? = null,
    val category: String = "grocery",
    val mrpPaise: Int = 0,
    val pricePaise: Int = 0,
    val stock: Int = 0,
    val isAvailable: Boolean = true,
    val imageUrl: String? = null,
    val sku: String? = null,
    val barcode: String? = null,
    val brand: String? = null,
    val packageSize: String? = null,
    val store: Store? = null
)

@Serializable
data class Cart(
    val id: String = "",
    val storeId: String? = null,
    val store: Store? = null,
    val items: List<CartItem> = emptyList(),
    val subtotalPaise: Int = 0
)

@Serializable
data class CartItem(
    val id: String = "",
    val productId: String,
    val product: Product,
    val quantity: Int = 1,
    val unitPricePaise: Int = 0
)

@Serializable
data class Order(
    val id: String,
    val orderNumber: String = "",
    val customerId: String = "",
    val storeId: String = "",
    val store: Store? = null,
    val status: String, // PLACED, ACCEPTED, REJECTED, PREPARING, READY_FOR_PICKUP, OUT_FOR_DELIVERY, DELIVERED, COLLECTED, CANCELLED
    val fulfillmentMode: String = "PICKUP", // PICKUP, MERCHANT_DELIVERY, PLATFORM_DELIVERY
    val itemSubtotalPaise: Int = 0,
    val deliveryFeePaise: Int = 0,
    val taxPaise: Int = 0,
    val discountPaise: Int = 0,
    val totalAmountPaise: Int = 0,
    val createdAt: String = "",
    val items: List<OrderItem> = emptyList()
)

@Serializable
data class OrderItem(
    val id: String = "",
    val productId: String = "",
    val product: Product? = null,
    val quantity: Int = 1,
    val unitPricePaise: Int = 0
)

@Serializable
data class OrderQuote(
    val itemSubtotalPaise: Int,
    val deliveryFeePaise: Int,
    val totalAmountPaise: Int,
    val isMOVMet: Boolean,
    val minOrderValuePaise: Int = 29900
)

@Serializable
data class CatalogueLookupResponse(
    val matchFound: Boolean,
    val source: String? = null,
    val product: Product? = null,
    val error: String? = null
)

@Serializable
data class ImageUploadResponse(
    val success: Boolean,
    val url: String,
    val filename: String = "",
    val size: Long = 0,
    val provider: String = "local"
)

@Serializable
data class LoginRequest(
    val emailOrPhone: String,
    val password: String
)

@Serializable
data class RegisterRequest(
    val email: String,
    val phone: String? = null,
    val name: String,
    val password: String,
    val role: String = "CUSTOMER"
)

@Serializable
data class AuthResponse(
    val message: String = "",
    val token: String,
    val user: User
)

@Serializable
data class StoresResponse(
    val totalFound: Int = 0,
    val stores: List<Store> = emptyList()
)

@Serializable
data class ProductsSearchResponse(
    val totalMatches: Int = 0,
    val products: List<Product> = emptyList()
)

@Serializable
data class CartResponse(
    val success: Boolean = true,
    val cart: Cart? = null
)

@Serializable
data class OrdersResponse(
    val orders: List<Order> = emptyList()
)

@Serializable
data class SingleOrderResponse(
    val order: Order
)

@Serializable
data class OrderStatusUpdateRequest(
    val status: String
)

@Serializable
data class MerchantApplicationDto(
    val id: String = "",
    val referenceNumber: String = "",
    val status: String = "DRAFT",
    val currentStep: Int = 1,
    val ownerName: String = "",
    val ownerPhone: String = "",
    val ownerEmail: String = "",
    val isPhoneVerified: Boolean = false,
    val businessName: String? = null,
    val storeName: String? = null,
    val panNumber: String? = null,
    val gstin: String? = null,
    val fssaiNumber: String? = null,
    val drugLicenseNumber: String? = null,
    val category: String? = "Grocery & Daily Staples",
    val addressLine: String? = null,
    val city: String? = "Indore",
    val pincode: String? = "452001",
    val deliveryRadiusKm: Double = 3.0,
    val commissionRatePct: Double = 3.5,
    val adminFeedback: String? = null,
    val rejectionReason: String? = null
)

@Serializable
data class StartOnboardingRequest(
    val ownerName: String,
    val ownerPhone: String,
    val ownerEmail: String,
    val password: String,
    val communicationConsent: Boolean = true
)

@Serializable
data class StartOnboardingResponse(
    val message: String,
    val token: String? = null,
    val application: MerchantApplicationDto
)

@Serializable
data class VerifyPhoneOtpRequest(
    val referenceNumber: String,
    val otp: String
)

@Serializable
data class ApplicationResponse(
    val application: MerchantApplicationDto
)

// --- Delivery Partner Models ---
@Serializable
data class DeliveryPartnerProfile(
    val id: String,
    val userId: String,
    val riderCode: String,
    val vehicleType: String = "SCOOTER",
    val vehicleNumber: String = "",
    val drivingLicenceNumber: String = "",
    val panNumber: String? = null,
    val bankAccountNumber: String? = null,
    val bankIfsc: String? = null,
    val isVerified: Boolean = false,
    val isActive: Boolean = true,
    val isOnline: Boolean = false,
    val currentLatitude: Double? = null,
    val currentLongitude: Double? = null,
    val rating: Double = 5.0,
    val totalDeliveries: Int = 0,
    val approvalStatus: String = "UNDER_REVIEW",
    val serviceArea: String = "Indore - All Zones"
)

@Serializable
data class DeliveryTaskDto(
    val id: String,
    val taskNumber: String,
    val parentOrderId: String? = null,
    val merchantOrderId: String? = null,
    val riderId: String? = null,
    val status: String, // AVAILABLE, OFFERED, ACCEPTED, AT_STORE, PICKED_UP, EN_ROUTE, DELIVERED
    val pickupLocationName: String,
    val pickupAddress: String,
    val pickupLatitude: Double = 0.0,
    val pickupLongitude: Double = 0.0,
    val deliveryAddress: String,
    val deliveryLatitude: Double = 0.0,
    val deliveryLongitude: Double = 0.0,
    val estimatedDistanceKm: Double = 2.5,
    val estimatedMinutes: Int = 30,
    val riderBasePayoutPaise: Int = 3000,
    val surgePayoutPaise: Int = 0,
    val totalPayoutPaise: Int = 3000,
    val pickupOtp: String? = null,
    val deliveryOtpAttempts: Int = 0,
    val deliveryOtpMaxAttempts: Int = 5,
    val acceptanceDeadline: String? = null
)

@Serializable
data class DeliveryTaskOfferDto(
    val id: String,
    val taskId: String,
    val partnerId: String,
    val status: String,
    val expiresAt: String,
    val task: DeliveryTaskDto
)

@Serializable
data class DeliveryAuthResponse(
    val success: Boolean,
    val token: String,
    val isNewUser: Boolean = false,
    val user: User,
    val partnerProfile: DeliveryPartnerProfile? = null
)

@Serializable
data class DeliveryProfileResponse(
    val partner: DeliveryPartnerProfile
)

@Serializable
data class DeliveryTaskOffersResponse(
    val offers: List<DeliveryTaskOfferDto> = emptyList()
)

@Serializable
data class DeliveryTaskResponse(
    val success: Boolean,
    val task: DeliveryTaskDto,
    val payoutPaise: Int? = null
)

@Serializable
data class DeliveryEarningEntryDto(
    val id: String,
    val type: String,
    val amountPaise: Int,
    val description: String,
    val settlementStatus: String,
    val createdAt: String
)

@Serializable
data class DeliveryEarningsResponse(
    val partnerCode: String,
    val rating: Double = 5.0,
    val totalDeliveries: Int = 0,
    val totalEarningsPaise: Int = 0,
    val unsettledEarningsPaise: Int = 0,
    val earnings: List<DeliveryEarningEntryDto> = emptyList()
)

@Serializable
data class DeliverySettlementDto(
    val id: String,
    val payoutReference: String,
    val netPayoutPaise: Int,
    val status: String,
    val processedAt: String
)

@Serializable
data class DeliverySettlementsResponse(
    val settlements: List<DeliverySettlementDto> = emptyList()
)

@Serializable
data class DeliveryOnboardingRequest(
    val name: String,
    val drivingLicenceNumber: String,
    val panNumber: String? = null,
    val vehicleType: String,
    val vehicleNumber: String,
    val bankAccountNumber: String,
    val bankIfsc: String,
    val emergencyContactName: String? = null,
    val emergencyContactPhone: String? = null,
    val serviceArea: String = "Indore - All Zones"
)

@Serializable
data class DeliveryOnboardingResponse(
    val success: Boolean,
    val message: String,
    val profile: DeliveryPartnerProfile
)
