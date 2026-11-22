package com.ayushp0021.everythinglocal.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ayushp0021.everythinglocal.core.models.*
import com.ayushp0021.everythinglocal.data.CustomerRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class CustomerUiState(
    val selectedNeighborhood: String = "Palasia, Indore",
    val latitude: Double = 22.7244,
    val longitude: Double = 75.8839,
    val selectedCategory: String = "all",
    val stores: List<Store> = emptyList(),
    val popularProducts: List<Product> = emptyList(),
    val cart: Cart = Cart(),
    val orders: List<Order> = emptyList(),
    val searchQuery: String = "",
    val searchResults: List<Product> = emptyList(),
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val user: User? = null
)

class CustomerViewModel(
    private val repository: CustomerRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(CustomerUiState())
    val uiState: StateFlow<CustomerUiState> = _uiState.asStateFlow()

    init {
        loadHomeData()
        loadCart()
    }

    fun loadHomeData() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            try {
                val stores = repository.getNearbyStores(
                    lat = _uiState.value.latitude,
                    lng = _uiState.value.longitude,
                    category = _uiState.value.selectedCategory
                )

                val sampleList = mutableListOf<Product>()
                stores.forEach { store ->
                    store.sampleProducts.forEach { prod ->
                        sampleList.add(prod.copy(store = store))
                    }
                }

                _uiState.value = _uiState.value.copy(
                    stores = stores,
                    popularProducts = sampleList.distinctBy { it.id }.take(10),
                    isLoading = false
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = "Failed to connect to local store engine: ${e.message}"
                )
            }
        }
    }

    fun selectCategory(cat: String) {
        _uiState.value = _uiState.value.copy(selectedCategory = cat)
        loadHomeData()
    }

    fun setNeighborhood(name: String, lat: Double, lng: Double) {
        _uiState.value = _uiState.value.copy(
            selectedNeighborhood = name,
            latitude = lat,
            longitude = lng
        )
        loadHomeData()
    }

    fun search(query: String) {
        _uiState.value = _uiState.value.copy(searchQuery = query)
        if (query.isBlank()) {
            _uiState.value = _uiState.value.copy(searchResults = emptyList())
            return
        }
        viewModelScope.launch {
            try {
                val results = repository.searchProducts(
                    query = query,
                    category = _uiState.value.selectedCategory,
                    lat = _uiState.value.latitude,
                    lng = _uiState.value.longitude
                )
                _uiState.value = _uiState.value.copy(searchResults = results)
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(searchResults = emptyList())
            }
        }
    }

    fun loadCart() {
        viewModelScope.launch {
            val cart = repository.getCart()
            _uiState.value = _uiState.value.copy(cart = cart)
        }
    }

    fun addToCart(storeId: String, productId: String) {
        viewModelScope.launch {
            try {
                val updatedCart = repository.addToCart(storeId, productId, 1)
                _uiState.value = _uiState.value.copy(cart = updatedCart)
            } catch (e: Exception) {
                // If conflict (different store)
                _uiState.value = _uiState.value.copy(errorMessage = e.message)
            }
        }
    }

    fun removeFromCart(itemId: String) {
        viewModelScope.launch {
            val updatedCart = repository.removeCartItem(itemId)
            _uiState.value = _uiState.value.copy(cart = updatedCart)
        }
    }

    fun checkout(fulfillmentMode: String = "PICKUP", onSuccess: (Order) -> Unit) {
        val currentStoreId = _uiState.value.cart.storeId ?: return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            try {
                val order = repository.checkout(currentStoreId, fulfillmentMode)
                loadCart()
                loadOrders()
                _uiState.value = _uiState.value.copy(isLoading = false)
                onSuccess(order)
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = "Checkout failed: ${e.message}"
                )
            }
        }
    }

    fun loadOrders() {
        viewModelScope.launch {
            val orders = repository.getOrders()
            _uiState.value = _uiState.value.copy(orders = orders)
        }
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(errorMessage = null)
    }
}
