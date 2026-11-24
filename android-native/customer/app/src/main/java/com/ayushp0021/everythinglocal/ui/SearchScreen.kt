package com.ayushp0021.everythinglocal.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ayushp0021.everythinglocal.core.common.Formatters
import com.ayushp0021.everythinglocal.core.designsystem.*
import com.ayushp0021.everythinglocal.core.models.Product

@Composable
fun SearchScreen(
    viewModel: CustomerViewModel,
    onBack: () -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    var text by remember { mutableStateOf(state.searchQuery) }
    var selectedProduct by remember { mutableStateOf<Product?>(null) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SurfaceOffWhite)
    ) {
        // Search Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color.White)
                .padding(horizontal = 8.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBack) {
                Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = TextDark)
            }

            OutlinedTextField(
                value = text,
                onValueChange = {
                    text = it
                    viewModel.search(it)
                },
                placeholder = { Text("Search products, brands, kirana...", fontSize = 14.sp) },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = TextMuted) },
                trailingIcon = {
                    if (text.isNotEmpty()) {
                        IconButton(onClick = {
                            text = ""
                            viewModel.search("")
                        }) {
                            Icon(Icons.Default.Clear, contentDescription = "Clear", tint = TextMuted)
                        }
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp)
                    .clip(RoundedCornerShape(12.dp)),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = ForestGreen,
                    unfocusedBorderColor = DividerColor
                ),
                singleLine = true
            )
        }

        if (state.searchResults.isEmpty() && text.isNotBlank()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("No matching products found", color = TextMuted)
            }
        } else {
            LazyVerticalGrid(
                columns = GridCells.Fixed(2),
                contentPadding = PaddingValues(12.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                items(state.searchResults) { product ->
                    val cartItem = state.cart.items.find { it.productId == product.id }
                    ProductCard(
                        product = product,
                        cartQuantity = cartItem?.quantity ?: 0,
                        onAdd = {
                            val sId = product.storeId.ifBlank { product.store?.id ?: "" }
                            if (sId.isNotBlank()) viewModel.addToCart(sId, product.id)
                        },
                        onIncrement = {
                            val sId = product.storeId.ifBlank { product.store?.id ?: "" }
                            if (sId.isNotBlank()) viewModel.addToCart(sId, product.id)
                        },
                        onDecrement = {
                            cartItem?.let { viewModel.removeFromCart(it.id) }
                        },
                        onClick = {
                            selectedProduct = product
                        }
                    )
                }
            }
        }
    }

    selectedProduct?.let { prod ->
        val cartItem = state.cart.items.find { it.productId == prod.id }
        AlertDialog(
            onDismissRequest = { selectedProduct = null },
            title = {
                Text(prod.name, fontWeight = FontWeight.Bold, fontSize = 16.sp)
            },
            text = {
                Column {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            Formatters.formatPaise(prod.pricePaise),
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 18.sp,
                            color = ForestGreen
                        )
                        if (prod.mrpPaise > prod.pricePaise) {
                            Text(
                                "MRP: ${Formatters.formatPaise(prod.mrpPaise)}",
                                fontSize = 12.sp,
                                color = TextMuted
                            )
                        }
                    }
                    if (!prod.packageSize.isNullOrBlank()) {
                        Text("Pack Size: ${prod.packageSize}", fontSize = 12.sp, color = TextMuted)
                    }
                    prod.store?.let { s ->
                        Spacer(modifier = Modifier.height(4.dp))
                        Text("Store: ${s.name} (${s.addressLine})", fontSize = 11.sp, color = ForestGreen, fontWeight = FontWeight.SemiBold)
                    }
                }
            },
            confirmButton = {
                val sId = prod.storeId.ifBlank { prod.store?.id ?: "" }
                Button(
                    onClick = {
                        if (sId.isNotBlank()) {
                            viewModel.addToCart(sId, prod.id)
                        }
                        selectedProduct = null
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = ForestGreen),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text(if (cartItem != null) "Add Another (${cartItem.quantity} in Cart)" else "Add to Cart ➔")
                }
            },
            dismissButton = {
                TextButton(onClick = { selectedProduct = null }) { Text("Close") }
            }
        )
    }
}
