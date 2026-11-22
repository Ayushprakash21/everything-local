package com.ayushp0021.everythinglocal.core.common

import java.text.NumberFormat
import java.util.Locale

object Formatters {
    fun formatPaise(paise: Int): String {
        val rupees = paise / 100.0
        val format = NumberFormat.getCurrencyInstance(Locale("en", "IN"))
        return format.format(rupees).replace("INR", "₹").trim()
    }

    fun formatDistance(km: Double): String {
        return if (km < 1.0) {
            "${(km * 1000).toInt()} m"
        } else {
            String.format(Locale.US, "%.1f km", km)
        }
    }
}
