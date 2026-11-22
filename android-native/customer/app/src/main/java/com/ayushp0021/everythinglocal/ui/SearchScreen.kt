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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ayushp0021.everythinglocal.core.designsystem.*

@Composable
fun SearchScreen(
    viewModel: CustomerViewModel,
    onBack: () -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    var text by remember { mutableStateOf(state.searchQuery) }

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
                        }
                    )
                }
            }
        }
    }
}
