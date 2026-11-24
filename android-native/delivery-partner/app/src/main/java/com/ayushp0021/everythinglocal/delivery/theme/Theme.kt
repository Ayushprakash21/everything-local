package com.ayushp0021.everythinglocal.delivery.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val DeliveryColorScheme = lightColorScheme(
    primary = CourierBluePrimary,
    onPrimary = CourierSurface,
    primaryContainer = CourierBlueLight,
    onPrimaryContainer = CourierBlueDark,
    secondary = CourierAmberAccent,
    onSecondary = CourierSurface,
    secondaryContainer = CourierAmberLight,
    onSecondaryContainer = CourierAmberDark,
    background = CourierBackground,
    onBackground = CourierTextPrimary,
    surface = CourierSurface,
    onSurface = CourierTextPrimary,
    surfaceVariant = CourierSurfaceVariant,
    onSurfaceVariant = CourierTextSecondary,
    error = CourierErrorRed,
    onError = CourierSurface
)

@Composable
fun DeliveryPartnerTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = DeliveryColorScheme,
        content = content
    )
}
