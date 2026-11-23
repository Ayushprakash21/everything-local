package com.ayushp0021.everythinglocal.merchant.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ayushp0021.everythinglocal.core.common.Formatters
import com.ayushp0021.everythinglocal.core.designsystem.*
import com.ayushp0021.everythinglocal.core.models.Product

@Composable
fun MerchantCatalogueScreen(
    viewModel: MerchantViewModel,
    onNavigateToAddProduct: () -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    var selectedProductToEdit by remember { mutableStateOf<Product?>(null) }

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
                    Text("Tap + to scan barcode and add items to your store", fontSize = 13.sp, color = TextMuted)
                    Spacer(modifier = Modifier.height(14.dp))
                    Button(
                        onClick = onNavigateToAddProduct,
                        colors = ButtonDefaults.buttonColors(containerColor = ForestGreen),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Add First Product")
                    }
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
                state.statusMessage?.let { msg ->
                    item {
                        Card(
                            colors = CardDefaults.cardColors(containerColor = Color(0xFFDCFCE7)),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(msg, color = Color(0xFF166534), fontSize = 12.sp, modifier = Modifier.padding(10.dp))
                        }
                    }
                }

                items(state.products) { product ->
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { selectedProductToEdit = product }
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
                                if (!product.packageSize.isNullOrBlank()) {
                                    Text("Pack: ${product.packageSize}", fontSize = 11.sp, color = TextMuted)
                                }
                                if (!product.barcode.isNullOrBlank()) {
                                    Text("Barcode: ${product.barcode}", fontSize = 11.sp, color = TextMuted)
                                }
                                Spacer(modifier = Modifier.height(2.dp))
                                Text("Tap to edit details ✎", fontSize = 10.sp, color = AmberDark, fontWeight = FontWeight.SemiBold)
                            }

                            // Stock Quick Stepper
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

    // Edit Product Dialog
    selectedProductToEdit?.let { prod ->
        var editPriceText by remember(prod) { mutableStateOf((prod.pricePaise / 100.0).toString()) }
        var editMrpText by remember(prod) { mutableStateOf((prod.mrpPaise / 100.0).toString()) }
        var editStockText by remember(prod) { mutableStateOf(prod.stock.toString()) }

        AlertDialog(
            onDismissRequest = { selectedProductToEdit = null },
            title = {
                Text("Edit Product Details", fontWeight = FontWeight.Bold, fontSize = 16.sp)
            },
            text = {
                Column {
                    Text(prod.name, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                    Spacer(modifier = Modifier.height(10.dp))
                    OutlinedTextField(
                        value = editPriceText,
                        onValueChange = { editPriceText = it },
                        label = { Text("Selling Price (₹)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = editMrpText,
                        onValueChange = { editMrpText = it },
                        label = { Text("MRP (₹)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = editStockText,
                        onValueChange = { editStockText = it },
                        label = { Text("Available Stock Units") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    OutlinedButton(
                        onClick = {
                            viewModel.deleteProduct(prod.id)
                            selectedProductToEdit = null
                        },
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = Color(0xFFDC2626)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(Icons.Default.Delete, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Remove Product from Store", fontSize = 12.sp)
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val newPrice = ((editPriceText.toDoubleOrNull() ?: 0.0) * 100).toInt()
                        val newMrp = ((editMrpText.toDoubleOrNull() ?: 0.0) * 100).toInt()
                        val newStock = editStockText.toIntOrNull() ?: prod.stock

                        if (newPrice > 0) {
                            viewModel.updateProductPrice(prod.id, newPrice, if (newMrp > 0) newMrp else newPrice)
                            viewModel.updateStock(prod.id, newStock)
                        }
                        selectedProductToEdit = null
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = ForestGreen),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text("Save Changes")
                }
            },
            dismissButton = {
                TextButton(onClick = { selectedProductToEdit = null }) { Text("Cancel") }
            }
        )
    }
}
