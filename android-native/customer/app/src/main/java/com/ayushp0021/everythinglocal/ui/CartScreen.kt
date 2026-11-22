package com.ayushp0021.everythinglocal.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
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

@Composable
fun CartScreen(
    viewModel: CustomerViewModel,
    onCheckoutSuccess: () -> Unit,
    onBack: () -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    var fulfillmentMode by remember { mutableStateOf("PICKUP") } // "PICKUP" or "MERCHANT_DELIVERY"
    val minOrderPaise = 29900 // ₹299
    val subtotal = state.cart.subtotalPaise
    val deliveryFee = if (fulfillmentMode == "PICKUP" || subtotal >= minOrderPaise) 0 else 2500 // ₹25
    val total = subtotal + deliveryFee

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("My Shopping Cart", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        },
        bottomBar = {
            if (state.cart.items.isNotEmpty()) {
                Surface(
                    color = Color.White,
                    shadowElevation = 8.dp,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text("Total Amount", fontSize = 12.sp, color = TextMuted)
                                Text(
                                    Formatters.formatPaise(total),
                                    fontWeight = FontWeight.ExtraBold,
                                    fontSize = 18.sp,
                                    color = ForestGreen
                                )
                            }
                            Button(
                                onClick = {
                                    viewModel.checkout(fulfillmentMode) {
                                        onCheckoutSuccess()
                                    }
                                },
                                shape = RoundedCornerShape(12.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = ForestGreen),
                                modifier = Modifier.height(48.dp)
                            ) {
                                Text("Place Order ➔", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                            }
                        }
                    }
                }
            }
        }
    ) { padding ->
        if (state.cart.items.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        Icons.Default.ShoppingCart,
                        contentDescription = null,
                        modifier = Modifier.size(64.dp),
                        tint = Color(0xFFCBD5E1)
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Text("Your cart is empty", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = TextDark)
                    Text("Add items from your neighborhood store to get started", fontSize = 13.sp, color = TextMuted)
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .background(SurfaceOffWhite)
                    .padding(16.dp)
            ) {
                // Single-Store Fulfillment Badge
                item {
                    state.cart.store?.let { store ->
                        Card(
                            colors = CardDefaults.cardColors(containerColor = ForestGreenLight),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier.padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(Icons.Default.Storefront, contentDescription = null, tint = ForestGreen)
                                Spacer(modifier = Modifier.width(8.dp))
                                Column {
                                    Text("Fulfilling from:", fontSize = 11.sp, color = ForestGreenMedium)
                                    Text(store.name, fontWeight = FontWeight.Bold, fontSize = 14.sp, color = ForestGreen)
                                }
                            }
                        }
                        Spacer(modifier = Modifier.height(12.dp))
                    }
                }

                // Minimum Order Value (MOV) Progress Bar
                item {
                    val progress = (subtotal.toFloat() / minOrderPaise.toFloat()).coerceIn(0f, 1f)
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(
                                    if (subtotal >= minOrderPaise) "🎉 Free Delivery Unlocked!" else "Add ${Formatters.formatPaise(minOrderPaise - subtotal)} more for Free Delivery",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = if (subtotal >= minOrderPaise) ForestGreen else AmberDark
                                )
                                Text("MOV: ₹299", fontSize = 11.sp, color = TextMuted)
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                            LinearProgressIndicator(
                                progress = { progress },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(6.dp)
                                    .clip(RoundedCornerShape(3.dp)),
                                color = if (subtotal >= minOrderPaise) ForestGreen else AmberPrimary,
                                trackColor = Color(0xFFE2E8F0)
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(14.dp))
                }

                // Cart Items
                items(state.cart.items) { item ->
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(item.product.name, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                                Text(
                                    Formatters.formatPaise(item.unitPricePaise),
                                    fontSize = 13.sp,
                                    color = ForestGreen,
                                    fontWeight = FontWeight.Bold
                                )
                            }

                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier
                                    .background(ForestGreen, RoundedCornerShape(8.dp))
                                    .padding(horizontal = 4.dp, vertical = 2.dp)
                            ) {
                                IconButton(
                                    onClick = { viewModel.removeFromCart(item.id) },
                                    modifier = Modifier.size(24.dp)
                                ) {
                                    Icon(Icons.Default.Remove, contentDescription = "Decrease", tint = Color.White, modifier = Modifier.size(16.dp))
                                }
                                Text("${item.quantity}", color = Color.White, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 6.dp))
                                IconButton(
                                    onClick = {
                                        val sId = state.cart.storeId ?: ""
                                        if (sId.isNotBlank()) viewModel.addToCart(sId, item.productId)
                                    },
                                    modifier = Modifier.size(24.dp)
                                ) {
                                    Icon(Icons.Default.Add, contentDescription = "Increase", tint = Color.White, modifier = Modifier.size(16.dp))
                                }
                            }
                        }
                    }
                }

                // Fulfillment Mode Selector
                item {
                    Spacer(modifier = Modifier.height(14.dp))
                    Text("Select Fulfillment Mode", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    Spacer(modifier = Modifier.height(6.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        FilterChip(
                            selected = fulfillmentMode == "PICKUP",
                            onClick = { fulfillmentMode = "PICKUP" },
                            label = { Text("Store Pickup (Free)") },
                            leadingIcon = { Icon(Icons.Default.Store, contentDescription = null) },
                            modifier = Modifier.weight(1f)
                        )
                        FilterChip(
                            selected = fulfillmentMode == "MERCHANT_DELIVERY",
                            onClick = { fulfillmentMode = "MERCHANT_DELIVERY" },
                            label = { Text("Delivery") },
                            leadingIcon = { Icon(Icons.Default.Moped, contentDescription = null) },
                            modifier = Modifier.weight(1f)
                        )
                    }
                }

                // Bill Summary
                item {
                    Spacer(modifier = Modifier.height(16.dp))
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Text("Bill Summary", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            Spacer(modifier = Modifier.height(8.dp))
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text("Item Total", color = TextMuted, fontSize = 13.sp)
                                Text(Formatters.formatPaise(subtotal), fontSize = 13.sp)
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text("Delivery Fee", color = TextMuted, fontSize = 13.sp)
                                Text(if (deliveryFee == 0) "FREE" else Formatters.formatPaise(deliveryFee), fontSize = 13.sp, color = if (deliveryFee == 0) ForestGreen else TextDark)
                            }
                            HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text("Grand Total", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                                Text(Formatters.formatPaise(total), fontWeight = FontWeight.Bold, fontSize = 15.sp, color = ForestGreen)
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(20.dp))
                }
            }
        }
    }
}
