package com.ayushp0021.everythinglocal.core.network

import com.jakewharton.retrofit2.converter.kotlinx.serialization.asConverterFactory
import kotlinx.serialization.json.Json
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import okhttp3.Interceptor
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import java.io.IOException
import java.net.ConnectException
import java.net.SocketTimeoutException
import java.net.UnknownHostException
import java.util.concurrent.TimeUnit

open class BackendUnavailableException(
    val endpoint: String,
    cause: Throwable? = null,
    message: String = "Unable to connect to Everything Local backend at $endpoint. Please verify that the server is online and reachable."
) : IOException(message, cause)

class NetworkClient(
    private val tokenProvider: () -> String? = { null },
    private val storeIdProvider: () -> String? = { null },
    val baseUrlProvider: () -> String = { DEFAULT_BASE_URL },
    private val isDebug: Boolean = false
) {
    companion object {
        // Fallback emulator URL for local testing
        const val DEFAULT_BASE_URL = "http://10.0.2.2:4000/api/"
        const val PRODUCTION_BASE_URL = "https://everything-local-api.everything-local.workers.dev/api/"
        const val STAGING_BASE_URL = "https://everybazaar-api-dev.everything-local.workers.dev/api/"
    }

    private val json = Json {
        ignoreUnknownKeys = true
        coerceInputValues = true
        isLenient = true
    }

    // Dynamic Base URL Interceptor: Allows overriding host/port/scheme at runtime without recreating client
    private val dynamicUrlInterceptor = Interceptor { chain ->
        var request = chain.request()
        val currentBaseUrl = baseUrlProvider()
        val currentHttpUrl = currentBaseUrl.toHttpUrlOrNull()
        if (currentHttpUrl != null) {
            val updatedUrl = request.url.newBuilder()
                .scheme(currentHttpUrl.scheme)
                .host(currentHttpUrl.host)
                .port(currentHttpUrl.port)
                .encodedPath(
                    if (request.url.encodedPath.startsWith(currentHttpUrl.encodedPath)) {
                        request.url.encodedPath
                    } else {
                        val basePrefix = currentHttpUrl.encodedPath.removeSuffix("/")
                        val reqPath = request.url.encodedPath.removePrefix("/api").removePrefix("/")
                        "$basePrefix/$reqPath"
                    }
                )
                .build()
            request = request.newBuilder().url(updatedUrl).build()
        }
        chain.proceed(request)
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

    // Connectivity Interceptor: Catches raw socket exceptions and surfaces human-friendly messages
    private val connectivityInterceptor = Interceptor { chain ->
        val request = chain.request()
        try {
            chain.proceed(request)
        } catch (e: ConnectException) {
            val host = request.url.host
            val port = request.url.port
            throw BackendUnavailableException(
                endpoint = "${request.url}",
                cause = e,
                message = "Cannot connect to server at $host:$port. Please ensure the backend is running and reachable."
            )
        } catch (e: UnknownHostException) {
            throw BackendUnavailableException(
                endpoint = "${request.url}",
                cause = e,
                message = "Unable to resolve server host '${request.url.host}'. Please check your network connection."
            )
        } catch (e: SocketTimeoutException) {
            throw BackendUnavailableException(
                endpoint = "${request.url}",
                cause = e,
                message = "Connection to server timed out. Please try again."
            )
        } catch (e: IOException) {
            throw e
        }
    }

    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = if (isDebug) HttpLoggingInterceptor.Level.BODY else HttpLoggingInterceptor.Level.NONE
    }

    private val okHttpClient = OkHttpClient.Builder()
        .addInterceptor(dynamicUrlInterceptor)
        .addInterceptor(authInterceptor)
        .addInterceptor(connectivityInterceptor)
        .apply {
            if (isDebug) {
                addInterceptor(loggingInterceptor)
            }
        }
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()

    val api: EverythingLocalApi = Retrofit.Builder()
        .baseUrl(DEFAULT_BASE_URL)
        .client(okHttpClient)
        .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
        .build()
        .create(EverythingLocalApi::class.java)
}
