package com.ayushp0021.everythinglocal.merchant.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Inventory2
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ayushp0021.everythinglocal.core.common.Formatters
import com.ayushp0021.everythinglocal.core.designsystem.*

@Composable
fun MerchantCatalogueScreen(
    viewModel: MerchantViewModel,
    onNavigateToAddProduct: () -> Unit
) {
    val state by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Store Inventory (${state.products.size})", fontWeight = FontWeight.Bold) },
                actions = {
                    IconButton(onClick = onNavigateToAddProduct) {
                        Icon(Icons.Default.Add, contentDescription = "Add Product", tint = ForestGreen)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        }
    ) { padding ->
        if (state.products.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Default.Inventory2, contentDescription = null, modifier = Modifier.size(64.dp), tint = Color(0xFFCBD5E1))
                    Spacer(modifier = Modifier.height(10.dp))
                    Text("No products in catalogue", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    Text("Tap + to scan and add items to your store", fontSize = 13.sp, color = TextMuted)
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .background(SurfaceOffWhite)
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(state.products) { product ->
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(product.name, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(
                                        Formatters.formatPaise(product.pricePaise),
                                        fontWeight = FontWeight.ExtraBold,
                                        fontSize = 14.sp,
                                        color = ForestGreen
                                    )
                                    if (product.mrpPaise > product.pricePaise) {
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text(
                                            Formatters.formatPaise(product.mrpPaise),
                                            fontSize = 11.sp,
                                            color = TextMuted
                                        )
                                    }
                                }
                                if (!product.barcode.isNullOrBlank()) {
                                    Text("Barcode: ${product.barcode}", fontSize = 11.sp, color = TextMuted)
                                }
                            }

                            // Stock Editor Stepper
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                IconButton(
                                    onClick = {
                                        if (product.stock > 0) viewModel.updateStock(product.id, product.stock - 1)
                                    },
                                    modifier = Modifier.size(28.dp)
                                ) {
                                    Icon(Icons.Default.Remove, contentDescription = "Decrease", tint = TextDark)
                                }
                                Box(
                                    modifier = Modifier
                                        .background(if (product.stock < 5) Color(0xFFFEE2E2) else ForestGreenLight, RoundedCornerShape(6.dp))
                                        .padding(horizontal = 8.dp, vertical = 4.dp)
                                ) {
                                    Text(
                                        "${product.stock} in stock",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 12.sp,
                                        color = if (product.stock < 5) Color(0xFFDC2626) else ForestGreen
                                    )
                                }
                                IconButton(
                                    onClick = {
                                        viewModel.updateStock(product.id, product.stock + 1)
                                    },
                                    modifier = Modifier.size(28.dp)
                                ) {
                                    Icon(Icons.Default.Add, contentDescription = "Increase", tint = TextDark)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
