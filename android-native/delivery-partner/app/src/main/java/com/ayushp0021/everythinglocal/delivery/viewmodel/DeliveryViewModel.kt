package com.ayushp0021.everythinglocal.delivery.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ayushp0021.everythinglocal.core.models.*
import com.ayushp0021.everythinglocal.delivery.data.DeliveryRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class DeliveryUiState(
    val isLoggedIn: Boolean = false,
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val successMessage: String? = null,
    val profile: DeliveryPartnerProfile? = null,
    val isOnline: Boolean = false,
    val pendingOffers: List<DeliveryTaskOfferDto> = emptyList(),
    val activeTask: DeliveryTaskDto? = null,
    val earnings: DeliveryEarningsResponse? = null,
    val settlements: List<DeliverySettlementDto> = emptyList(),
    val isEmergencyDialogOpen: Boolean = false
)

class DeliveryViewModel(
    private val repository: DeliveryRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(DeliveryUiState(isLoggedIn = repository.isLoggedIn()))
    val uiState: StateFlow<DeliveryUiState> = _uiState.asStateFlow()

    init {
        if (_uiState.value.isLoggedIn) {
            refreshDashboard()
        }
    }

    fun clearMessages() {
        _uiState.update { it.copy(errorMessage = null, successMessage = null) }
    }

    fun refreshDashboard() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            repository.getProfile().onSuccess { profile ->
                _uiState.update { it.copy(profile = profile, isOnline = profile.isOnline) }
            }
            repository.getTaskOffers().onSuccess { offers ->
                _uiState.update { it.copy(pendingOffers = offers) }
            }
            repository.getEarnings().onSuccess { earnings ->
                _uiState.update { it.copy(earnings = earnings) }
            }
            _uiState.update { it.copy(isLoading = false) }
        }
    }

    fun sendOtp(phone: String, onSent: () -> Unit) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            repository.sendOtp(phone)
                .onSuccess {
                    _uiState.update { it.copy(isLoading = false, successMessage = "OTP sent to $phone") }
                    onSent()
                }
                .onFailure { err ->
                    _uiState.update { it.copy(isLoading = false, errorMessage = err.message ?: "Failed to send OTP") }
                }
        }
    }

    fun verifyOtp(phone: String, otp: String, onSuccess: () -> Unit) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            repository.verifyOtp(phone, otp)
                .onSuccess {
                    _uiState.update { state ->
                        state.copy(
                            isLoggedIn = true,
                            isLoading = false,
                            profile = it.partnerProfile
                        )
                    }
                    refreshDashboard()
                    onSuccess()
                }
                .onFailure { err ->
                    _uiState.update { it.copy(isLoading = false, errorMessage = err.message ?: "Invalid OTP") }
                }
        }
    }

    fun submitOnboarding(
        name: String,
        dlNumber: String,
        panNumber: String,
        vehicleType: String,
        vehicleNumber: String,
        bankAccount: String,
        bankIfsc: String,
        emergencyName: String,
        emergencyPhone: String,
        serviceArea: String,
        onSuccess: () -> Unit
    ) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            val req = DeliveryOnboardingRequest(
                name = name,
                drivingLicenceNumber = dlNumber,
                panNumber = panNumber.ifBlank { null },
                vehicleType = vehicleType,
                vehicleNumber = vehicleNumber,
                bankAccountNumber = bankAccount,
                bankIfsc = bankIfsc,
                emergencyContactName = emergencyName.ifBlank { null },
                emergencyContactPhone = emergencyPhone.ifBlank { null },
                serviceArea = serviceArea
            )
            repository.submitOnboarding(req)
                .onSuccess { res ->
                    _uiState.update { it.copy(isLoading = false, profile = res.profile, successMessage = "Application submitted for verification") }
                    onSuccess()
                }
                .onFailure { err ->
                    _uiState.update { it.copy(isLoading = false, errorMessage = err.message ?: "Submission failed") }
                }
        }
    }

    fun toggleOnline(targetOnline: Boolean, emergencyReason: String? = null) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            repository.updateAvailability(targetOnline, emergencyReason = emergencyReason)
                .onSuccess { online ->
                    _uiState.update {
                        it.copy(
                            isOnline = online,
                            isLoading = false,
                            activeTask = if (!online && emergencyReason != null) null else it.activeTask,
                            successMessage = if (online) "You are now ONLINE. Ready for trips!" else "You are now OFFLINE."
                        )
                    }
                }
                .onFailure { err ->
                    _uiState.update { it.copy(isLoading = false, errorMessage = err.message ?: "Failed to update status") }
                }
        }
    }

    fun acceptOffer(taskId: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            repository.acceptTask(taskId)
                .onSuccess { task ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            activeTask = task,
                            pendingOffers = it.pendingOffers.filter { o -> o.taskId != taskId },
                            successMessage = "Trip accepted! Proceed to merchant."
                        )
                    }
                }
                .onFailure { err ->
                    _uiState.update { it.copy(isLoading = false, errorMessage = err.message ?: "Acceptance failed") }
                }
        }
    }

    fun rejectOffer(taskId: String, reason: String = "Courier busy") {
        viewModelScope.launch {
            repository.rejectTask(taskId, reason)
            _uiState.update { it.copy(pendingOffers = it.pendingOffers.filter { o -> o.taskId != taskId }) }
        }
    }

    fun arriveAtStore(taskId: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            repository.arriveAtStore(taskId)
                .onSuccess { task ->
                    _uiState.update { it.copy(isLoading = false, activeTask = task, successMessage = "Arrived at store.") }
                }
                .onFailure { err ->
                    _uiState.update { it.copy(isLoading = false, errorMessage = err.message) }
                }
        }
    }

    fun confirmPickup(taskId: String, otp: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            repository.confirmPickup(taskId, otp)
                .onSuccess { task ->
                    _uiState.update { it.copy(isLoading = false, activeTask = task, successMessage = "Order picked up! Proceed to customer.") }
                }
                .onFailure { err ->
                    _uiState.update { it.copy(isLoading = false, errorMessage = err.message) }
                }
        }
    }

    fun completeDelivery(taskId: String, otp: String, notes: String? = null) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            repository.deliverWithOtp(taskId, otp, notes)
                .onSuccess { res ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            activeTask = null,
                            successMessage = "Trip completed! Earned ₹${(res.payoutPaise ?: 3000) / 100}"
                        )
                    }
                    refreshDashboard()
                }
                .onFailure { err ->
                    _uiState.update { it.copy(isLoading = false, errorMessage = err.message ?: "Invalid OTP") }
                }
        }
    }

    fun reportIncident(taskId: String, type: String, description: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            repository.reportIncident(taskId, type, description)
                .onSuccess {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            activeTask = null,
                            successMessage = "Incident logged. Trip released to support."
                        )
                    }
                    refreshDashboard()
                }
                .onFailure { err ->
                    _uiState.update { it.copy(isLoading = false, errorMessage = err.message) }
                }
        }
    }

    fun setEmergencyDialog(open: Boolean) {
        _uiState.update { it.copy(isEmergencyDialogOpen = open) }
    }

    fun logout() {
        viewModelScope.launch {
            repository.logout()
            _uiState.value = DeliveryUiState(isLoggedIn = false)
        }
    }
}
