package com.ayushp0021.everythinglocal.core.network

import com.ayushp0021.everythinglocal.core.models.*
import okhttp3.MultipartBody
import retrofit2.http.*

interface EverythingLocalApi {

    // --- Auth Endpoints ---
    @POST("auth/login")
    suspend fun login(@Body req: LoginRequest): AuthResponse

    @POST("auth/register")
    suspend fun register(@Body req: RegisterRequest): AuthResponse

    @GET("auth/me")
    suspend fun getProfile(): AuthResponse

    // --- Customer Endpoints ---
    @GET("customer/stores")
    suspend fun getNearbyStores(
        @Query("lat") lat: Double,
        @Query("lng") lng: Double,
        @Query("category") category: String? = null
    ): StoresResponse

    @GET("customer/stores/{storeId}")
    suspend fun getStoreDetail(
        @Path("storeId") storeId: String,
        @Query("lat") lat: Double,
        @Query("lng") lng: Double
    ): Store

    @GET("customer/products/search")
    suspend fun searchProducts(
        @Query("q") query: String,
        @Query("category") category: String? = null,
        @Query("lat") lat: Double? = null,
        @Query("lng") lng: Double? = null
    ): ProductsSearchResponse

    @GET("customer/cart")
    suspend fun getCart(): CartResponse

    @POST("customer/cart/items")
    suspend fun addToCart(
        @Body body: Map<String, String> // storeId, productId, quantity
    ): CartResponse

    @DELETE("customer/cart/items/{itemId}")
    suspend fun removeCartItem(@Path("itemId") itemId: String): CartResponse

    @DELETE("customer/cart")
    suspend fun clearCart(): CartResponse

    @POST("customer/orders/checkout")
    suspend fun checkout(
        @Body body: Map<String, String>
    ): SingleOrderResponse

    @GET("customer/orders")
    suspend fun getCustomerOrders(): OrdersResponse

    @GET("customer/orders/{id}")
    suspend fun getOrderDetail(@Path("id") orderId: String): SingleOrderResponse

    // --- Merchant Endpoints ---
    @GET("merchant/store")
    suspend fun getMerchantStore(): Store

    @GET("merchant/products")
    suspend fun getMerchantProducts(): List<Product>

    @GET("merchant/catalogue/lookup")
    suspend fun lookupBarcode(@Query("barcode") barcode: String): CatalogueLookupResponse

    @GET("merchant/catalogue/search")
    suspend fun searchCatalogue(@Query("q") query: String): List<Product>

    @POST("merchant/products")
    suspend fun createProduct(@Body product: Product): Product

    @PUT("merchant/products/{id}")
    suspend fun updateProduct(@Path("id") id: String, @Body updates: Map<String, String>): Product

    @DELETE("merchant/products/{id}")
    suspend fun deleteProduct(@Path("id") id: String): Map<String, Boolean>

    @GET("merchant/orders")
    suspend fun getMerchantOrders(): OrdersResponse

    @POST("merchant/orders/{id}/status")
    suspend fun updateOrderStatus(
        @Path("id") orderId: String,
        @Body req: OrderStatusUpdateRequest
    ): SingleOrderResponse

    // --- Upload Endpoint ---
    @Multipart
    @POST("upload/image")
    suspend fun uploadImage(
        @Part image: MultipartBody.Part
    ): ImageUploadResponse
}
