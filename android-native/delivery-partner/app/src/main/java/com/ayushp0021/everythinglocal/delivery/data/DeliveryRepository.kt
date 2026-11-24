package com.ayushp0021.everythinglocal.delivery.data

import android.content.Context
import com.ayushp0021.everythinglocal.core.authentication.SessionManager
import com.ayushp0021.everythinglocal.core.models.*
import com.ayushp0021.everythinglocal.core.network.EverythingLocalApi
import com.ayushp0021.everythinglocal.core.network.NetworkClient
import kotlinx.coroutines.runBlocking

class DeliveryRepository(
    private val context: Context,
    val sessionManager: SessionManager,
    private val networkClient: NetworkClient = NetworkClient(
        tokenProvider = { runBlocking { sessionManager.getToken() } },
        baseUrlProvider = {
            runBlocking {
                sessionManager.getCustomBaseUrl() ?: com.ayushp0021.everythinglocal.delivery.BuildConfig.API_BASE_URL
            }
        },
        isDebug = com.ayushp0021.everythinglocal.delivery.BuildConfig.DEBUG
    )
) {
    private val api: EverythingLocalApi = networkClient.api

    suspend fun sendOtp(phone: String): Result<Unit> = runCatching {
        api.sendDeliveryOtp(mapOf("phone" to phone))
    }

    suspend fun verifyOtp(phone: String, otp: String): Result<DeliveryAuthResponse> = runCatching {
        val res = api.verifyDeliveryOtp(mapOf("phone" to phone, "otp" to otp))
        if (res.success && res.token.isNotBlank()) {
            sessionManager.saveSession(
                token = res.token,
                userId = res.user.id,
                email = res.user.email,
                name = res.user.name,
                role = res.user.role
            )
        }
        res
    }

    suspend fun getProfile(): Result<DeliveryPartnerProfile> = runCatching {
        api.getDeliveryProfile().partner
    }

    suspend fun submitOnboarding(req: DeliveryOnboardingRequest): Result<DeliveryOnboardingResponse> = runCatching {
        api.applyDeliveryOnboarding(req)
    }

    suspend fun updateAvailability(
        isOnline: Boolean,
        lat: Double = 22.7533,
        lon: Double = 75.8937,
        emergencyReason: String? = null
    ): Result<Boolean> = runCatching {
        val payload = mutableMapOf(
            "isOnline" to isOnline.toString(),
            "latitude" to lat.toString(),
            "longitude" to lon.toString()
        )
        if (emergencyReason != null) {
            payload["emergencyReason"] = emergencyReason
        }
        api.updateDeliveryAvailability(payload)
        isOnline
    }

    suspend fun updateLocation(lat: Double, lon: Double, taskId: String? = null): Result<Unit> = runCatching {
        val payload = mutableMapOf(
            "latitude" to lat.toString(),
            "longitude" to lon.toString()
        )
        if (taskId != null) {
            payload["taskId"] = taskId
        }
        api.updateDeliveryLocation(payload)
    }

    suspend fun getTaskOffers(): Result<List<DeliveryTaskOfferDto>> = runCatching {
        api.getDeliveryTaskOffers().offers
    }

    suspend fun acceptTask(taskId: String): Result<DeliveryTaskDto> = runCatching {
        api.acceptDeliveryTask(taskId).task
    }

    suspend fun rejectTask(taskId: String, reason: String): Result<DeliveryTaskDto> = runCatching {
        api.rejectDeliveryTask(taskId, mapOf("reason" to reason)).task
    }

    suspend fun arriveAtStore(taskId: String): Result<DeliveryTaskDto> = runCatching {
        api.arriveAtStore(taskId).task
    }

    suspend fun confirmPickup(taskId: String, otp: String): Result<DeliveryTaskDto> = runCatching {
        api.confirmPickup(taskId, mapOf("otp" to otp)).task
    }

    suspend fun deliverWithOtp(taskId: String, otp: String, notes: String? = null): Result<DeliveryTaskResponse> = runCatching {
        val payload = mutableMapOf("otp" to otp)
        if (notes != null) payload["recipientNotes"] = notes
        api.verifyDeliveryAndComplete(taskId, payload)
    }

    suspend fun reportIncident(taskId: String, type: String, description: String): Result<Unit> = runCatching {
        api.reportDeliveryIncident(taskId, mapOf("incidentType" to type, "description" to description))
    }

    suspend fun getEarnings(): Result<DeliveryEarningsResponse> = runCatching {
        api.getDeliveryEarnings()
    }

    suspend fun getSettlements(): Result<DeliverySettlementsResponse> = runCatching {
        api.getDeliverySettlements()
    }

    fun isLoggedIn(): Boolean = runBlocking { sessionManager.getToken() != null }

    suspend fun logout() {
        sessionManager.clearSession()
    }
}
