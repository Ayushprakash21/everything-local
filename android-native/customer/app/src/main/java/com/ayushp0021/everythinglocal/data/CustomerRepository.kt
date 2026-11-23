package com.ayushp0021.everythinglocal.data

import com.ayushp0021.everythinglocal.core.authentication.SessionManager
import com.ayushp0021.everythinglocal.core.models.*
import com.ayushp0021.everythinglocal.core.network.EverythingLocalApi
import com.ayushp0021.everythinglocal.core.network.NetworkClient
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.withContext
import java.util.UUID

class CustomerRepository(
    private val sessionManager: SessionManager,
    private val networkClient: NetworkClient = NetworkClient(
        tokenProvider = { kotlinx.coroutines.runBlocking { sessionManager.getToken() } },
        baseUrlProvider = {
            kotlinx.coroutines.runBlocking {
                sessionManager.getCustomBaseUrl() ?: com.ayushp0021.everythinglocal.BuildConfig.API_BASE_URL
            }
        },
        isDebug = com.ayushp0021.everythinglocal.BuildConfig.DEBUG
    )
) {
    private val api: EverythingLocalApi = networkClient.api

    suspend fun getNearbyStores(
        lat: Double = 22.7244,
        lng: Double = 75.8839,
        category: String? = null
    ): List<Store> = withContext(Dispatchers.IO) {
        val catParam = if (category == "all") null else category
        api.getNearbyStores(lat, lng, catParam).stores
    }

    suspend fun searchProducts(
        query: String,
        category: String? = null,
        lat: Double = 22.7244,
        lng: Double = 75.8839
    ): List<Product> = withContext(Dispatchers.IO) {
        val catParam = if (category == "all") null else category
        api.searchProducts(query, catParam, lat, lng).products
    }

    suspend fun getCart(): Cart = withContext(Dispatchers.IO) {
        try {
            api.getCart().cart ?: Cart()
        } catch (e: Exception) {
            Cart()
        }
    }

    suspend fun addToCart(storeId: String, productId: String, quantity: Int = 1): Cart = withContext(Dispatchers.IO) {
        val res = api.addToCart(
            mapOf(
                "storeId" to storeId,
                "productId" to productId,
                "quantity" to quantity.toString()
            )
        )
        res.cart ?: Cart()
    }

    suspend fun removeCartItem(itemId: String): Cart = withContext(Dispatchers.IO) {
        val res = api.removeCartItem(itemId)
        res.cart ?: Cart()
    }

    suspend fun clearCart(): Boolean = withContext(Dispatchers.IO) {
        try {
            api.clearCart().success
        } catch (e: Exception) {
            false
        }
    }

    suspend fun checkout(storeId: String, fulfillmentMode: String): Order = withContext(Dispatchers.IO) {
        val res = api.checkout(
            mapOf(
                "storeId" to storeId,
                "fulfillmentMode" to fulfillmentMode,
                "idempotencyKey" to UUID.randomUUID().toString()
            )
        )
        res.order
    }

    suspend fun getOrders(): List<Order> = withContext(Dispatchers.IO) {
        try {
            api.getCustomerOrders().orders
        } catch (e: Exception) {
            emptyList()
        }
    }

    suspend fun login(emailOrPhone: String, pass: String): User = withContext(Dispatchers.IO) {
        val res = api.login(LoginRequest(emailOrPhone = emailOrPhone, password = pass))
        sessionManager.saveSession(
            token = res.token,
            userId = res.user.id,
            email = res.user.email,
            name = res.user.name,
            role = res.user.role
        )
        res.user
    }

    suspend fun logout() = withContext(Dispatchers.IO) {
        sessionManager.clearSession()
    }

    suspend fun getUserName(): String? = sessionManager.userNameFlow.firstOrNull()
}
