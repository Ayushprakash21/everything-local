package com.ayushp0021.everythinglocal.merchant.data

import android.content.Context
import android.net.Uri
import com.ayushp0021.everythinglocal.core.authentication.SessionManager
import com.ayushp0021.everythinglocal.core.models.*
import com.ayushp0021.everythinglocal.core.network.EverythingLocalApi
import com.ayushp0021.everythinglocal.core.network.NetworkClient
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.File
import java.io.FileOutputStream

class MerchantRepository(
    private val context: Context,
    private val sessionManager: SessionManager,
    private val networkClient: NetworkClient = NetworkClient(
        tokenProvider = { kotlinx.coroutines.runBlocking { sessionManager.getToken() } },
        storeIdProvider = { kotlinx.coroutines.runBlocking { sessionManager.getStoreId() } }
    )
) {
    private val api: EverythingLocalApi = networkClient.api

    suspend fun getStore(): Store = withContext(Dispatchers.IO) {
        api.getMerchantStore()
    }

    suspend fun getProducts(): List<Product> = withContext(Dispatchers.IO) {
        try {
            api.getMerchantProducts()
        } catch (e: Exception) {
            emptyList()
        }
    }

    suspend fun lookupBarcode(barcode: String): CatalogueLookupResponse = withContext(Dispatchers.IO) {
        try {
            api.lookupBarcode(barcode)
        } catch (e: Exception) {
            CatalogueLookupResponse(matchFound = false, error = e.message)
        }
    }

    suspend fun createProduct(product: Product): Product = withContext(Dispatchers.IO) {
        api.createProduct(product)
    }

    suspend fun updateProduct(id: String, updates: Map<String, String>): Product = withContext(Dispatchers.IO) {
        api.updateProduct(id, updates)
    }

    suspend fun deleteProduct(id: String): Boolean = withContext(Dispatchers.IO) {
        try {
            api.deleteProduct(id)["success"] ?: true
        } catch (e: Exception) {
            false
        }
    }

    suspend fun getOrders(): List<Order> = withContext(Dispatchers.IO) {
        try {
            api.getMerchantOrders().orders
        } catch (e: Exception) {
            emptyList()
        }
    }

    suspend fun updateOrderStatus(orderId: String, newStatus: String): Order = withContext(Dispatchers.IO) {
        val res = api.updateOrderStatus(orderId, OrderStatusUpdateRequest(newStatus))
        res.order
    }

    suspend fun uploadImageFromUri(uri: Uri): ImageUploadResponse = withContext(Dispatchers.IO) {
        // Read file bytes from content resolver and create multipart body
        val contentResolver = context.contentResolver
        val inputStream = contentResolver.openInputStream(uri)
            ?: throw IllegalStateException("Cannot open input stream for image URI")

        val tempFile = File.createTempFile("upload_", ".jpg", context.cacheDir)
        FileOutputStream(tempFile).use { output ->
            inputStream.copyTo(output)
        }

        val requestFile = tempFile.asRequestBody("image/jpeg".toMediaTypeOrNull())
        val body = MultipartBody.Part.createFormData("image", tempFile.name, requestFile)

        val response = api.uploadImage(body)
        tempFile.delete()
        response
    }

    suspend fun login(emailOrPhone: String, pass: String): User = withContext(Dispatchers.IO) {
        val res = api.login(LoginRequest(emailOrPhone = emailOrPhone, password = pass))
        sessionManager.saveSession(
            token = res.token,
            userId = res.user.id,
            email = res.user.email,
            name = res.user.name,
            role = res.user.role,
            storeId = res.user.storeId
        )
        res.user
    }

    suspend fun logout() = withContext(Dispatchers.IO) {
        sessionManager.clearSession()
    }

    // --- Onboarding Operations ---
    suspend fun startOnboarding(req: StartOnboardingRequest): StartOnboardingResponse = withContext(Dispatchers.IO) {
        val res = api.startOnboarding(req)
        res.token?.let { token ->
            sessionManager.saveSession(
                token = token,
                userId = res.application.id,
                email = res.application.ownerEmail,
                name = res.application.ownerName,
                role = "CUSTOMER"
            )
        }
        res
    }

    suspend fun verifyPhoneOtp(ref: String, otp: String): MerchantApplicationDto = withContext(Dispatchers.IO) {
        api.verifyPhoneOtp(VerifyPhoneOtpRequest(referenceNumber = ref, otp = otp)).application
    }

    suspend fun getApplication(ref: String): MerchantApplicationDto = withContext(Dispatchers.IO) {
        api.getApplication(ref).application
    }

    suspend fun updateOnboardingStep(ref: String, stepNum: Int, data: Map<String, String>): MerchantApplicationDto = withContext(Dispatchers.IO) {
        api.updateOnboardingStep(ref, stepNum, data).application
    }

    suspend fun submitOnboardingApplication(ref: String): MerchantApplicationDto = withContext(Dispatchers.IO) {
        api.submitOnboardingApplication(ref).application
    }
}
