package com.ayushp0021.everythinglocal.core.designsystem

/**
 * Normalizes and resolves relative product image URLs from the Everything Local backend
 * to absolute HTTP/HTTPS endpoints reachable by Android Coil image loader.
 */
object ImageUrlResolver {
    // Default development host for Android Emulator accessing Express backend
    @Volatile
    var baseServerUrl: String = "http://10.0.2.2:4000"

    /**
     * Resolves a raw image URL from the database or API.
     * Handles:
     * - null / empty -> null
     * - absolute http/https URLs -> unchanged
     * - relative paths (/product-images/...) -> prepends baseServerUrl
     */
    fun resolve(rawUrl: String?): String? {
        if (rawUrl.isNullOrBlank()) return null
        val trimmed = rawUrl.trim()
        if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
            return trimmed
        }
        val cleanPath = if (trimmed.startsWith("/")) trimmed else "/$trimmed"
        val cleanBase = baseServerUrl.trimEnd('/')
        return "$cleanBase$cleanPath"
    }
}
