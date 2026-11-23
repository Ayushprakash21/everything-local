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
