package com.ayushp0021.everythinglocal.core.network

import com.jakewharton.retrofit2.converter.kotlinx.serialization.asConverterFactory
import kotlinx.serialization.json.Json
import okhttp3.Interceptor
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import java.util.concurrent.TimeUnit

class NetworkClient(
    private val tokenProvider: () -> String? = { null },
    private val storeIdProvider: () -> String? = { null },
    baseUrl: String = DEFAULT_BASE_URL
) {
    companion object {
        // Standard Android emulator loopback to host PC.
        // For physical device, replace with host PC's Wi-Fi IP address (e.g., http://192.168.1.X:4000/api/)
        const val DEFAULT_BASE_URL = "http://10.0.2.2:4000/api/"
    }

    private val json = Json {
        ignoreUnknownKeys = true
        coerceInputValues = true
        isLenient = true
    }

    private val authInterceptor = Interceptor { chain ->
        val original = chain.request()
        val builder = original.newBuilder()

        tokenProvider()?.let { token ->
            if (token.isNotBlank()) {
                builder.header("Authorization", "Bearer $token")
            }
        }

        storeIdProvider()?.let { storeId ->
            if (storeId.isNotBlank()) {
                builder.header("x-store-id", storeId)
            }
        }

        chain.proceed(builder.build())
    }

    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    }

    private val okHttpClient = OkHttpClient.Builder()
        .addInterceptor(authInterceptor)
        .addInterceptor(loggingInterceptor)
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()

    val api: EverythingLocalApi = Retrofit.Builder()
        .baseUrl(baseUrl)
        .client(okHttpClient)
        .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
        .build()
        .create(EverythingLocalApi::class.java)
}
