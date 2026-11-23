package com.ayushp0021.everythinglocal.merchant.ui

import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ayushp0021.everythinglocal.core.models.Order
import com.ayushp0021.everythinglocal.core.models.Product
import com.ayushp0021.everythinglocal.core.models.Store
import com.ayushp0021.everythinglocal.merchant.data.MerchantRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class MerchantUiState(
    val store: Store? = null,
    val products: List<Product> = emptyList(),
    val orders: List<Order> = emptyList(),
    val scannedBarcode: String? = null,
    val lookupMatch: Product? = null,
    val uploadedImageUrl: String? = null,
    val isLoading: Boolean = false,
    val statusMessage: String? = null,
    val errorMessage: String? = null
)

class MerchantViewModel(
    val repository: MerchantRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(MerchantUiState())
    val uiState: StateFlow<MerchantUiState> = _uiState.asStateFlow()

    init {
        loadDashboard()
    }

    fun loadDashboard() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            try {
                val store = repository.getStore()
                val products = repository.getProducts()
                val orders = repository.getOrders()
                _uiState.value = _uiState.value.copy(
                    store = store,
                    products = products,
                    orders = orders,
                    isLoading = false
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = "Failed to load store data: ${e.message}"
                )
            }
        }
    }

    fun onBarcodeScanned(barcode: String) {
        _uiState.value = _uiState.value.copy(scannedBarcode = barcode, isLoading = true)
        viewModelScope.launch {
            val response = repository.lookupBarcode(barcode)
            _uiState.value = _uiState.value.copy(
                lookupMatch = response.product,
                uploadedImageUrl = response.product?.imageUrl,
                isLoading = false,
                statusMessage = if (response.matchFound) "Product found in catalogue!" else "No barcode match. Please enter details manually."
            )
        }
    }

    fun uploadProductImage(uri: Uri) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            try {
                val res = repository.uploadImageFromUri(uri)
                if (res.success) {
                    _uiState.value = _uiState.value.copy(
                        uploadedImageUrl = res.url,
                        isLoading = false,
                        statusMessage = "Image uploaded successfully!"
                    )
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = "Image upload failed: ${e.message}"
                )
            }
        }
    }

    fun saveProduct(
        name: String,
        category: String,
        mrpPaise: Int,
        pricePaise: Int,
        stock: Int,
        brand: String?,
        packageSize: String?,
        barcode: String?,
        onSuccess: () -> Unit
    ) {
        val currentStoreId = _uiState.value.store?.id ?: return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            try {
                val newProduct = Product(
                    id = "",
                    storeId = currentStoreId,
                    name = name,
                    category = category,
                    mrpPaise = mrpPaise,
                    pricePaise = pricePaise,
                    stock = stock,
                    imageUrl = _uiState.value.uploadedImageUrl,
                    barcode = barcode ?: _uiState.value.scannedBarcode,
                    brand = brand,
                    packageSize = packageSize
                )
                repository.createProduct(newProduct)
                loadDashboard()
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    statusMessage = "Product added to catalogue!",
                    scannedBarcode = null,
                    lookupMatch = null,
                    uploadedImageUrl = null
                )
                onSuccess()
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = "Failed to save product: ${e.message}"
                )
            }
        }
    }

    fun updateStock(productId: String, newStock: Int) {
        viewModelScope.launch {
            try {
                repository.updateProduct(productId, mapOf("stock" to newStock.toString()))
                val updatedList = _uiState.value.products.map {
                    if (it.id == productId) it.copy(stock = newStock) else it
                }
                _uiState.value = _uiState.value.copy(products = updatedList)
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(errorMessage = "Stock update failed")
            }
        }
    }

    fun updateOrderStatus(orderId: String, newStatus: String) {
        viewModelScope.launch {
            try {
                val updated = repository.updateOrderStatus(orderId, newStatus)
                val updatedOrders = _uiState.value.orders.map {
                    if (it.id == orderId) updated else it
                }
                _uiState.value = _uiState.value.copy(orders = updatedOrders)
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(errorMessage = "Status update failed: ${e.message}")
            }
        }
    }

    fun clearMessages() {
        _uiState.value = _uiState.value.copy(statusMessage = null, errorMessage = null)
    }
}
