package com.ayushp0021.everythinglocal.wholesaler

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.ayushp0021.everythinglocal.core.authentication.SessionManager
import com.ayushp0021.everythinglocal.core.models.*
import com.ayushp0021.everythinglocal.core.network.EverythingLocalApi
import com.ayushp0021.everythinglocal.core.network.NetworkClient
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class WholesalerUiState(
    val isLoggedIn: Boolean = false,
    val isLoading: Boolean = false,
    val error: String? = null,
    val statusMessage: String? = null,
    val user: User? = null,
    val profile: WholesalerProfileDto? = null,
    val needsOnboarding: Boolean = false,
    val metrics: WholesaleConsoleMetricsDto = WholesaleConsoleMetricsDto(),
    val categories: List<WholesaleCategoryDto> = emptyList(),
    val products: List<WholesaleProductDto> = emptyList(),
    val orders: List<WholesaleOrderDto> = emptyList(),
    val rfqs: List<WholesaleRfqDto> = emptyList()
)

class WholesalerViewModel(application: Application) : AndroidViewModel(application) {
    private val sessionManager = SessionManager(application)
    private val networkClient = NetworkClient(
        tokenProvider = { kotlinx.coroutines.runBlocking { sessionManager.getToken() } },
        baseUrlProvider = { BuildConfig.API_BASE_URL },
        isDebug = BuildConfig.IS_DEBUG_NETWORK
    )
    private val api: EverythingLocalApi = networkClient.api

    private val _uiState = MutableStateFlow(
        WholesalerUiState(isLoggedIn = !kotlinx.coroutines.runBlocking { sessionManager.getToken() }.isNullOrBlank())
    )
    val uiState: StateFlow<WholesalerUiState> = _uiState.asStateFlow()

    init {
        if (_uiState.value.isLoggedIn) {
            loadConsole()
        }
    }

    fun login(emailOrPhone: String, password: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            try {
                val res = api.login(LoginRequest(emailOrPhone, password))
                sessionManager.saveSession(
                    token = res.token,
                    userId = res.user.id,
                    email = res.user.email,
                    name = res.user.name,
                    role = res.user.role
                )
                _uiState.value = _uiState.value.copy(
                    isLoggedIn = true,
                    user = res.user,
                    isLoading = false
                )
                loadConsole()
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = e.message ?: "Login failed"
                )
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            sessionManager.clearSession()
            _uiState.value = WholesalerUiState(isLoggedIn = false)
        }
    }

    fun loadConsole() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            try {
                val cats = api.getWholesaleCategories().categories
                val overview = api.getWholesalerConsoleOverview()
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    needsOnboarding = false,
                    categories = cats,
                    profile = overview.profile,
                    metrics = overview.metrics,
                    products = overview.products,
                    orders = overview.orders,
                    rfqs = overview.rfqs
                )
            } catch (e: Exception) {
                val msg = e.message ?: "Failed to load console"
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    needsOnboarding = msg.contains("404") || msg.contains("not found", ignoreCase = true),
                    error = if (msg.contains("404")) null else msg
                )
            }
        }
    }

    fun registerWholesaler(
        businessName: String,
        legalName: String,
        gstin: String,
        address: String,
        city: String,
        pincode: String,
        phone: String
    ) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            try {
                api.registerWholesaler(
                    mapOf(
                        "businessName" to businessName,
                        "legalBusinessName" to legalName,
                        "gstin" to gstin,
                        "businessAddress" to address,
                        "city" to city,
                        "pincode" to pincode,
                        "contactName" to businessName,
                        "contactPhone" to phone
                    )
                )
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    statusMessage = "Application submitted for Super Admin review"
                )
                loadConsole()
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(isLoading = false, error = e.message)
            }
        }
    }

    fun createProduct(
        categoryId: String,
        title: String,
        sku: String,
        unit: String,
        moq: Int,
        pricePaise: Int,
        stock: Int,
        description: String
    ) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            try {
                api.createWholesaleProduct(
                    WholesaleProductCreateRequest(
                        categoryId = categoryId,
                        title = title,
                        description = description,
                        sku = sku,
                        unitOfMeasurement = unit,
                        moq = moq,
                        basePricePaise = pricePaise,
                        initialStock = stock
                    )
                )
                _uiState.value = _uiState.value.copy(statusMessage = "Product submitted for approval")
                loadConsole()
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(isLoading = false, error = e.message)
            }
        }
    }

    fun updateOrderStatus(orderId: String, status: String) {
        viewModelScope.launch {
            try {
                api.updateWholesaleOrderStatus(orderId, mapOf("status" to status))
                loadConsole()
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(error = e.message)
            }
        }
    }

    fun submitQuote(rfqId: String, unitPricePaise: Int, qty: Int) {
        viewModelScope.launch {
            try {
                api.submitWholesalerQuote(
                    rfqId,
                    WholesaleQuoteCreateRequest(
                        quotedUnitPricePaise = unitPricePaise,
                        quotedQty = qty
                    )
                )
                _uiState.value = _uiState.value.copy(statusMessage = "Quotation sent to buyer")
                loadConsole()
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(error = e.message)
            }
        }
    }
}
