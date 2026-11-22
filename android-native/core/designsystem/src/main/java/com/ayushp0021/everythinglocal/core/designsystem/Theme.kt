package com.ayushp0021.everythinglocal.core.designsystem

import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val AmberPrimary = Color(0xFFF59E0B)
val AmberDark = Color(0xFFD97706)
val AmberLight = Color(0xFFFEF3C7)

val ForestGreen = Color(0xFF064E3B)
val ForestGreenMedium = Color(0xFF047857)
val ForestGreenLight = Color(0xFFECFDF5)

val SurfaceOffWhite = Color(0xFFF8FAFC)
val CardSurface = Color(0xFFFFFFFF)
val TextDark = Color(0xFF0F172A)
val TextMuted = Color(0xFF64748B)
val DividerColor = Color(0xFFE2E8F0)
val ErrorRed = Color(0xFFEF4444)

private val LightColorScheme = lightColorScheme(
    primary = ForestGreen,
    onPrimary = Color.White,
    primaryContainer = ForestGreenLight,
    onPrimaryContainer = ForestGreen,

    secondary = AmberPrimary,
    onSecondary = TextDark,
    secondaryContainer = AmberLight,
    onSecondaryContainer = AmberDark,

    background = SurfaceOffWhite,
    onBackground = TextDark,
    surface = CardSurface,
    onSurface = TextDark,

    error = ErrorRed,
    onError = Color.White
)

@Composable
fun EverythingLocalTheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = LightColorScheme,
        content = content
    )
}
