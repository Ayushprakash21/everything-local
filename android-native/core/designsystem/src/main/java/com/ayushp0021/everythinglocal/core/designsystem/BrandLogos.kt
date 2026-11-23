package com.ayushp0021.everythinglocal.core.designsystem

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.ShoppingBag
import androidx.compose.material.icons.filled.Storefront
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

enum class LogoVariant {
    LIGHT, DARK, COMPACT
}

@Composable
fun CustomerBrandLogo(
    modifier: Modifier = Modifier,
    variant: LogoVariant = LogoVariant.LIGHT
) {
    val titleColor = if (variant == LogoVariant.DARK) Color.White else Color(0xFF0B1F3B)
    val subtitleColor = if (variant == LogoVariant.DARK) Color(0xFF94A3B8) else Color(0xFF64748B)

    Row(
        modifier = modifier,
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Geometric EL Monogram Icon Badge
        Surface(
            color = Color(0xFF0B1F3B),
            shape = RoundedCornerShape(10.dp),
            modifier = Modifier.size(36.dp)
        ) {
            Box(contentAlignment = Alignment.Center) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        "E",
                        color = Color.White,
                        fontWeight = FontWeight.Black,
                        fontSize = 17.sp
                    )
                    Text(
                        "L",
                        color = AmberPrimary,
                        fontWeight = FontWeight.Black,
                        fontSize = 17.sp
                    )
                }
            }
        }

        Spacer(modifier = Modifier.width(10.dp))

        Column {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    "Everything ",
                    fontWeight = FontWeight.Black,
                    fontSize = 18.sp,
                    color = titleColor,
                    letterSpacing = (-0.5).sp
                )
                Text(
                    "Local",
                    fontWeight = FontWeight.Black,
                    fontSize = 18.sp,
                    color = AmberPrimary,
                    letterSpacing = (-0.5).sp
                )
            }
            if (variant != LogoVariant.COMPACT) {
                Text(
                    "Shop more. Save more. Live better.",
                    fontSize = 10.sp,
                    color = subtitleColor,
                    fontWeight = FontWeight.Medium
                )
            }
        }
    }
}

@Composable
fun MerchantBrandLogo(
    modifier: Modifier = Modifier,
    showTagline: Boolean = true
) {
    Row(
        modifier = modifier,
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Distinct Warm Orange Awning / Merchant Partner Badge
        Surface(
            color = Color(0xFFEA580C),
            shape = RoundedCornerShape(10.dp),
            modifier = Modifier.size(38.dp)
        ) {
            Box(contentAlignment = Alignment.Center) {
                Icon(
                    Icons.Default.Storefront,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(24.dp)
                )
            }
        }

        Spacer(modifier = Modifier.width(10.dp))

        Column {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    "Everything ",
                    fontWeight = FontWeight.Black,
                    fontSize = 17.sp,
                    color = Color(0xFF0B1F3B),
                    letterSpacing = (-0.5).sp
                )
                Text(
                    "Local",
                    fontWeight = FontWeight.Black,
                    fontSize = 17.sp,
                    color = AmberPrimary,
                    letterSpacing = (-0.5).sp
                )
                Spacer(modifier = Modifier.width(6.dp))
                Surface(
                    color = Color(0xFFFFF7ED),
                    shape = RoundedCornerShape(6.dp)
                ) {
                    Text(
                        "MERCHANT",
                        fontSize = 9.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = Color(0xFF9A3412),
                        modifier = Modifier.padding(horizontal = 5.dp, vertical = 2.dp)
                    )
                }
            }
            if (showTagline) {
                Text(
                    "Indore Hyperlocal Retail Partner Console",
                    fontSize = 10.sp,
                    color = Color(0xFF64748B),
                    fontWeight = FontWeight.Medium
                )
            }
        }
    }
}
