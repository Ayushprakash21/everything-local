package com.ayushp0021.everythinglocal.core.designsystem

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material.icons.filled.ShoppingBag
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.ayushp0021.everythinglocal.core.common.Formatters
import com.ayushp0021.everythinglocal.core.models.Product

@Composable
fun ProductCard(
    product: Product,
    cartQuantity: Int = 0,
    onAdd: () -> Unit = {},
    onIncrement: () -> Unit = {},
    onDecrement: () -> Unit = {},
    onClick: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    val discountPercent = if (product.mrpPaise > product.pricePaise && product.mrpPaise > 0) {
        val diff = product.mrpPaise - product.pricePaise
        ((diff.toDouble() / product.mrpPaise.toDouble()) * 100).toInt()
    } else 0

    Card(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .clickable { onClick() },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(10.dp)
        ) {
            // Image with Discount Badge & Pack Size
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(130.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(Color(0xFFF1F5F9)),
                contentAlignment = Alignment.Center
            ) {
                val resolvedUrl = ImageUrlResolver.resolve(product.imageUrl)
                if (!resolvedUrl.isNullOrBlank()) {
                    AsyncImage(
                        model = resolvedUrl,
                        contentDescription = product.name,
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop
                    )
                } else {
                    Icon(
                        imageVector = Icons.Default.ShoppingBag,
                        contentDescription = null,
                        modifier = Modifier.size(48.dp),
                        tint = Color(0xFF94A3B8)
                    )
                }

                // Discount Badge
                if (discountPercent > 0) {
                    Box(
                        modifier = Modifier
                            .align(Alignment.TopStart)
                            .padding(6.dp)
                            .background(AmberPrimary, RoundedCornerShape(6.dp))
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    ) {
                        Text(
                            text = "$discountPercent% OFF",
                            color = Color.Black,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                // Pack size pill
                if (!product.packageSize.isNullOrBlank()) {
                    Box(
                        modifier = Modifier
                            .align(Alignment.BottomStart)
                            .padding(6.dp)
                            .background(Color(0xCC000000), RoundedCornerShape(4.dp))
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    ) {
                        Text(
                            text = product.packageSize ?: "",
                            color = Color.White,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Brand
            if (!product.brand.isNullOrBlank()) {
                Text(
                    text = product.brand ?: "",
                    fontSize = 11.sp,
                    color = TextMuted,
                    fontWeight = FontWeight.Medium,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }

            // Product Name
            Text(
                text = product.name,
                fontSize = 14.sp,
                fontWeight = FontWeight.SemiBold,
                color = TextDark,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
                lineHeight = 18.sp,
                modifier = Modifier.height(36.dp)
            )

            Spacer(modifier = Modifier.height(6.dp))

            // Price and Action Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = Formatters.formatPaise(product.pricePaise),
                        fontSize = 15.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = ForestGreen
                    )
                    if (product.mrpPaise > product.pricePaise) {
                        Text(
                            text = Formatters.formatPaise(product.mrpPaise),
                            fontSize = 11.sp,
                            color = TextMuted,
                            textDecoration = TextDecoration.LineThrough
                        )
                    }
                }

                if (cartQuantity == 0) {
                    Button(
                        onClick = onAdd,
                        shape = RoundedCornerShape(8.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = ForestGreenLight,
                            contentColor = ForestGreen
                        ),
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
                        modifier = Modifier
                            .height(34.dp)
                            .border(1.dp, ForestGreenMedium, RoundedCornerShape(8.dp))
                    ) {
                        Text("ADD", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }
                } else {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier
                            .height(34.dp)
                            .background(ForestGreen, RoundedCornerShape(8.dp))
                            .padding(horizontal = 4.dp)
                    ) {
                        IconButton(
                            onClick = onDecrement,
                            modifier = Modifier.size(24.dp)
                        ) {
                            Icon(
                                Icons.Default.Remove,
                                contentDescription = "Decrease",
                                tint = Color.White,
                                modifier = Modifier.size(16.dp)
                            )
                        }
                        Text(
                            text = "$cartQuantity",
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp,
                            modifier = Modifier.padding(horizontal = 6.dp)
                        )
                        IconButton(
                            onClick = onIncrement,
                            modifier = Modifier.size(24.dp)
                        ) {
                            Icon(
                                Icons.Default.Add,
                                contentDescription = "Increase",
                                tint = Color.White,
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}
