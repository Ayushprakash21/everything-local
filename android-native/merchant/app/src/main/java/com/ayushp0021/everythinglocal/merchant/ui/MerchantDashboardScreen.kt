package com.ayushp0021.everythinglocal.merchant.ui

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
import com.ayushp0021.everythinglocal.core.models.Order

@Composable
fun MerchantDashboardScreen(
    viewModel: MerchantViewModel,
    onNavigateToAddProduct: () -> Unit
) {
    val state by viewModel.uiState.collectAsState()

    val pendingOrders = state.orders.filter { it.status == "PLACED" || it.status == "ACCEPTED" || it.status == "PREPARING" }
    val totalRevenuePaise = state.orders.filter { it.status == "DELIVERED" || it.status == "COLLECTED" }.sumOf { it.totalAmountPaise }
    val lowStockCount = state.products.count { it.stock in 1..5 }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                state.store?.name ?: "Merchant Console",
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Icon(Icons.Default.Verified, contentDescription = null, tint = ForestGreenMedium, modifier = Modifier.size(16.dp))
                        }
                        Text(
                            "Everything Local Retail Partner • 3.0 km Radius",
                            fontSize = 11.sp,
                            color = TextMuted
                        )
                    }
                },
                actions = {
                    IconButton(onClick = { viewModel.loadDashboard() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        },
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = onNavigateToAddProduct,
                containerColor = ForestGreen,
                contentColor = Color.White,
                icon = { Icon(Icons.Default.Add, contentDescription = null) },
                text = { Text("Add Product", fontWeight = FontWeight.Bold) }
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .background(SurfaceOffWhite)
                .padding(16.dp)
        ) {
            // KPI Summary Row
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    KpiCard(
                        title = "Pending Orders",
                        value = "${pendingOrders.size}",
                        color = AmberLight,
                        textColor = AmberDark,
                        modifier = Modifier.weight(1f)
                    )
                    KpiCard(
                        title = "Sales Revenue",
                        value = Formatters.formatPaise(totalRevenuePaise),
                        color = ForestGreenLight,
                        textColor = ForestGreen,
                        modifier = Modifier.weight(1f)
                    )
                }
                Spacer(modifier = Modifier.height(10.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    KpiCard(
                        title = "Active Catalogue",
                        value = "${state.products.size} Items",
                        color = Color(0xFFF1F5F9),
                        textColor = TextDark,
                        modifier = Modifier.weight(1f)
                    )
                    KpiCard(
                        title = "Low Stock Alert",
                        value = "$lowStockCount Items",
                        color = if (lowStockCount > 0) Color(0xFFFEE2E2) else Color(0xFFF1F5F9),
                        textColor = if (lowStockCount > 0) Color(0xFFDC2626) else TextMuted,
                        modifier = Modifier.weight(1f)
                    )
                }
                Spacer(modifier = Modifier.height(20.dp))
            }

            // Live Order Dispatch Console
            item {
                Text(
                    text = "Live Order Dispatch (${pendingOrders.size})",
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp,
                    color = TextDark
                )
                Spacer(modifier = Modifier.height(8.dp))
            }

            if (pendingOrders.isEmpty()) {
                item {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(24.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Icon(Icons.Default.CheckCircle, contentDescription = null, tint = ForestGreenMedium, modifier = Modifier.size(36.dp))
                                Spacer(modifier = Modifier.height(6.dp))
                                Text("All caught up!", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                Text("New incoming customer orders will appear here instantly", fontSize = 12.sp, color = TextMuted)
                            }
                        }
                    }
                }
            } else {
                items(pendingOrders) { order ->
                    MerchantOrderCard(
                        order = order,
                        onUpdateStatus = { newStatus ->
                            viewModel.updateOrderStatus(order.id, newStatus)
                        }
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                }
            }

            item {
                Spacer(modifier = Modifier.height(80.dp))
            }
        }
    }
}

@Composable
fun KpiCard(
    title: String,
    value: String,
    color: Color,
    textColor: Color,
    modifier: Modifier = Modifier
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = color),
        shape = RoundedCornerShape(12.dp),
        modifier = modifier
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Text(title, fontSize = 11.sp, color = TextMuted, fontWeight = FontWeight.Medium)
            Spacer(modifier = Modifier.height(4.dp))
            Text(value, fontWeight = FontWeight.ExtraBold, fontSize = 16.sp, color = textColor)
        }
    }
}

@Composable
fun MerchantOrderCard(
    order: Order,
    onUpdateStatus: (String) -> Unit
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = Color.White),
        shape = RoundedCornerShape(14.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Order #${order.orderNumber.ifBlank { order.id.take(8).uppercase() }}",
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp
                )
                Box(
                    modifier = Modifier
                        .background(AmberLight, RoundedCornerShape(6.dp))
                        .padding(horizontal = 8.dp, vertical = 2.dp)
                ) {
                    Text(
                        text = order.status.replace("_", " "),
                        fontWeight = FontWeight.Bold,
                        fontSize = 11.sp,
                        color = AmberDark
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "Items: ${order.items.joinToString { "${it.product?.name ?: "Item"} x${it.quantity}" }}",
                fontSize = 13.sp,
                color = TextDark
            )

            Spacer(modifier = Modifier.height(4.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text("Total: ${Formatters.formatPaise(order.totalAmountPaise)}", fontWeight = FontWeight.Bold, color = ForestGreen, fontSize = 13.sp)
                Text("Mode: ${order.fulfillmentMode.replace("_", " ")}", fontSize = 12.sp, color = TextMuted)
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Action Pipeline Buttons
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                when (order.status) {
                    "PLACED" -> {
                        Button(
                            onClick = { onUpdateStatus("ACCEPTED") },
                            colors = ButtonDefaults.buttonColors(containerColor = ForestGreen),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            Text("Accept Order", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                        OutlinedButton(
                            onClick = { onUpdateStatus("REJECTED") },
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            Text("Reject", color = Color(0xFFDC2626), fontSize = 12.sp)
                        }
                    }
                    "ACCEPTED" -> {
                        Button(
                            onClick = { onUpdateStatus("PREPARING") },
                            colors = ButtonDefaults.buttonColors(containerColor = AmberDark),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("Mark as Preparing", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                    "PREPARING" -> {
                        val nextStatus = if (order.fulfillmentMode == "PICKUP") "READY_FOR_PICKUP" else "OUT_FOR_DELIVERY"
                        Button(
                            onClick = { onUpdateStatus(nextStatus) },
                            colors = ButtonDefaults.buttonColors(containerColor = ForestGreenMedium),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(if (order.fulfillmentMode == "PICKUP") "Ready for Pickup" else "Out for Delivery", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                    "READY_FOR_PICKUP", "OUT_FOR_DELIVERY" -> {
                        val finalStatus = if (order.fulfillmentMode == "PICKUP") "COLLECTED" else "DELIVERED"
                        Button(
                            onClick = { onUpdateStatus(finalStatus) },
                            colors = ButtonDefaults.buttonColors(containerColor = ForestGreen),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("Complete & Fulfill", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}
