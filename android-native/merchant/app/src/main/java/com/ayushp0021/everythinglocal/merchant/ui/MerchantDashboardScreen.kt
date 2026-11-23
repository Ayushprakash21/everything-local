package com.ayushp0021.everythinglocal.merchant.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
    onNavigateToAddProduct: () -> Unit,
    onNavigateToInventory: () -> Unit = {},
    onNavigateToLogin: () -> Unit = {},
    onNavigateToOnboarding: () -> Unit = {},
    onNavigateToTracking: () -> Unit = {}
) {
    val state by viewModel.uiState.collectAsState()
    var showServerConfig by remember { mutableStateOf(false) }
    var showStoreSettings by remember { mutableStateOf(false) }
    var selectedOrderForDetail by remember { mutableStateOf<Order?>(null) }

    if (showServerConfig) {
        ServerConfigDialog(viewModel = viewModel, onDismiss = { showServerConfig = false })
    }

    if (showStoreSettings) {
        StoreSettingsDialog(
            storeName = state.store?.name ?: "Merchant Console",
            onDismiss = { showStoreSettings = false },
            onOpenServerConfig = { showServerConfig = true },
            onSwitchStore = onNavigateToLogin
        )
    }

    selectedOrderForDetail?.let { order ->
        OrderDetailDialog(
            order = order,
            onDismiss = { selectedOrderForDetail = null },
            onUpdateStatus = { newStatus ->
                viewModel.updateOrderStatus(order.id, newStatus)
            }
        )
    }

    val pendingOrders = state.orders.filter { it.status == "PLACED" || it.status == "ACCEPTED" || it.status == "PREPARING" }
    val totalRevenuePaise = state.orders.filter { it.status == "DELIVERED" || it.status == "COLLECTED" }.sumOf { it.totalAmountPaise }
    val lowStockCount = state.products.count { it.stock in 1..5 }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.clickable { showStoreSettings = true }
                    ) {
                        Surface(
                            color = Color(0xFFEA580C),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier.size(32.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(Icons.Default.Storefront, contentDescription = null, tint = Color.White, modifier = Modifier.size(20.dp))
                            }
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        Column {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    state.store?.name ?: "Merchant Console",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 15.sp,
                                    color = Color(0xFF0B1F3B)
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Icon(Icons.Default.Verified, contentDescription = null, tint = ForestGreenMedium, modifier = Modifier.size(15.dp))
                            }
                            Text(
                                "Indore Retail Partner • Tap for Settings",
                                fontSize = 10.sp,
                                color = TextMuted
                            )
                        }
                    }
                },
                actions = {
                    IconButton(onClick = { showStoreSettings = true }) {
                        Icon(Icons.Default.Settings, contentDescription = "Store Operations & Settings")
                    }
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
            // Connectivity Error / Unauthenticated Partner Banner
            if (state.errorMessage != null || state.store == null) {
                item {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color(0xFFFEF2F2)),
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.Info, contentDescription = null, tint = Color(0xFFDC2626), modifier = Modifier.size(18.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    if (state.errorMessage?.contains("Cannot connect") == true) "Backend Connection Issue" else "Partner Authentication Required",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 13.sp,
                                    color = Color(0xFF991B1B)
                                )
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                state.errorMessage ?: "Please sign in to your merchant account or register your business to access live inventory and orders.",
                                fontSize = 11.sp,
                                color = Color(0xFF7F1D1D)
                            )
                            Spacer(modifier = Modifier.height(10.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Button(
                                    onClick = onNavigateToLogin,
                                    colors = ButtonDefaults.buttonColors(containerColor = ForestGreen),
                                    shape = RoundedCornerShape(8.dp),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Text("Partner Sign In", fontSize = 11.sp)
                                }
                                Button(
                                    onClick = onNavigateToOnboarding,
                                    colors = ButtonDefaults.buttonColors(containerColor = AmberPrimary),
                                    shape = RoundedCornerShape(8.dp),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Text("Register Store", fontSize = 11.sp)
                                }
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                OutlinedButton(
                                    onClick = onNavigateToTracking,
                                    shape = RoundedCornerShape(8.dp),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Text("Track Application", fontSize = 11.sp)
                                }
                                OutlinedButton(
                                    onClick = { showServerConfig = true },
                                    shape = RoundedCornerShape(8.dp),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Text("Server Config", fontSize = 11.sp)
                                }
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(14.dp))
                }
            }

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
                        onClick = onNavigateToInventory,
                        modifier = Modifier.weight(1f)
                    )
                    KpiCard(
                        title = "Low Stock Alert",
                        value = "$lowStockCount Items",
                        color = if (lowStockCount > 0) Color(0xFFFEE2E2) else Color(0xFFF1F5F9),
                        textColor = if (lowStockCount > 0) Color(0xFFDC2626) else TextMuted,
                        onClick = onNavigateToInventory,
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
                        onClick = { selectedOrderForDetail = order },
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
    onClick: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = color),
        shape = RoundedCornerShape(12.dp),
        modifier = modifier.then(if (onClick != null) Modifier.clickable { onClick() } else Modifier)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(title, fontSize = 11.sp, color = TextMuted, fontWeight = FontWeight.Medium)
                if (onClick != null) {
                    Icon(Icons.Default.ChevronRight, contentDescription = null, tint = TextMuted, modifier = Modifier.size(14.dp))
                }
            }
            Spacer(modifier = Modifier.height(4.dp))
            Text(value, fontWeight = FontWeight.ExtraBold, fontSize = 16.sp, color = textColor)
        }
    }
}

@Composable
fun MerchantOrderCard(
    order: Order,
    onClick: (() -> Unit)? = null,
    onUpdateStatus: (String) -> Unit
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = Color.White),
        shape = RoundedCornerShape(14.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = Modifier
            .fillMaxWidth()
            .then(if (onClick != null) Modifier.clickable { onClick() } else Modifier)
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

@Composable
fun OrderDetailDialog(
    order: Order,
    onDismiss: () -> Unit,
    onUpdateStatus: (String) -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    "Order #${order.orderNumber.ifBlank { order.id.take(8).uppercase() }}",
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp
                )
                Box(
                    modifier = Modifier
                        .background(AmberLight, RoundedCornerShape(6.dp))
                        .padding(horizontal = 8.dp, vertical = 2.dp)
                ) {
                    Text(
                        order.status.replace("_", " "),
                        fontWeight = FontWeight.Bold,
                        fontSize = 11.sp,
                        color = AmberDark
                    )
                }
            }
        },
        text = {
            LazyColumn(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                item {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = SurfaceOffWhite),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(10.dp)) {
                            Text("Fulfillment Details", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = TextDark)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text("Mode: ${order.fulfillmentMode.replace("_", " ")}", fontSize = 12.sp, color = TextDark)
                            order.store?.addressLine?.let { addr ->
                                Text("Store Location: $addr", fontSize = 11.sp, color = TextMuted)
                            }
                        }
                    }
                }
                item {
                    Text("Order Items (${order.items.size})", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                }
                items(order.items) { item ->
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(item.product?.name ?: "Item", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                            Text("Qty: ${item.quantity} × ${Formatters.formatPaise(item.unitPricePaise)}", fontSize = 11.sp, color = TextMuted)
                        }
                        Text(
                            Formatters.formatPaise(item.unitPricePaise * item.quantity),
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp,
                            color = ForestGreen
                        )
                    }
                    Divider(color = Color(0xFFE2E8F0), thickness = 0.5.dp)
                }
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Total Amount", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        Text(Formatters.formatPaise(order.totalAmountPaise), fontWeight = FontWeight.ExtraBold, fontSize = 15.sp, color = ForestGreen)
                    }
                }
            }
        },
        confirmButton = {
            when (order.status) {
                "PLACED" -> {
                    Button(
                        onClick = {
                            onUpdateStatus("ACCEPTED")
                            onDismiss()
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = ForestGreen),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("Accept Order")
                    }
                }
                "ACCEPTED" -> {
                    Button(
                        onClick = {
                            onUpdateStatus("PREPARING")
                            onDismiss()
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = AmberDark),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("Start Preparing")
                    }
                }
                "PREPARING" -> {
                    val nextStatus = if (order.fulfillmentMode == "PICKUP") "READY_FOR_PICKUP" else "OUT_FOR_DELIVERY"
                    Button(
                        onClick = {
                            onUpdateStatus(nextStatus)
                            onDismiss()
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = ForestGreenMedium),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text(if (order.fulfillmentMode == "PICKUP") "Ready for Pickup" else "Dispatch Delivery")
                    }
                }
                "READY_FOR_PICKUP", "OUT_FOR_DELIVERY" -> {
                    val finalStatus = if (order.fulfillmentMode == "PICKUP") "COLLECTED" else "DELIVERED"
                    Button(
                        onClick = {
                            onUpdateStatus(finalStatus)
                            onDismiss()
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = ForestGreen),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("Complete & Fulfill")
                    }
                }
                else -> {
                    Button(
                        onClick = onDismiss,
                        colors = ButtonDefaults.buttonColors(containerColor = ForestGreen),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("Close")
                    }
                }
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Dismiss")
            }
        }
    )
}

@Composable
fun StoreSettingsDialog(
    storeName: String,
    onDismiss: () -> Unit,
    onOpenServerConfig: () -> Unit,
    onSwitchStore: () -> Unit
) {
    var notificationsEnabled by remember { mutableStateOf(true) }
    var soundAlertsEnabled by remember { mutableStateOf(true) }
    var autoAcceptOrders by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Storefront, contentDescription = null, tint = ForestGreen)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Store Operations & Settings", fontWeight = FontWeight.Bold, fontSize = 16.sp)
            }
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = SurfaceOffWhite),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(10.dp)) {
                        Text(storeName, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        Text("Indore Retail Partner • Active", fontSize = 11.sp, color = ForestGreen)
                        Text("Fulfillment Radius: 3.0 km", fontSize = 11.sp, color = TextMuted)
                        Text("Platform Commission: 5% Starter Tier", fontSize = 11.sp, color = TextMuted)
                    }
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Order Push Notifications", fontSize = 13.sp)
                    Switch(checked = notificationsEnabled, onCheckedChange = { notificationsEnabled = it })
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("High Priority Audio Chime", fontSize = 13.sp)
                    Switch(checked = soundAlertsEnabled, onCheckedChange = { soundAlertsEnabled = it })
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Auto-Accept Orders", fontSize = 13.sp)
                    Switch(checked = autoAcceptOrders, onCheckedChange = { autoAcceptOrders = it })
                }

                Divider(color = Color(0xFFE2E8F0))

                OutlinedButton(
                    onClick = {
                        onDismiss()
                        onOpenServerConfig()
                    },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Icon(Icons.Default.Dns, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Configure Backend Server URL", fontSize = 12.sp)
                }

                Button(
                    onClick = {
                        onDismiss()
                        onSwitchStore()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFEF2F2)),
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Icon(Icons.Default.Logout, contentDescription = null, tint = Color(0xFFDC2626), modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Switch Store / Sign Out", color = Color(0xFFDC2626), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }
        },
        confirmButton = {
            Button(
                onClick = onDismiss,
                colors = ButtonDefaults.buttonColors(containerColor = ForestGreen),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text("Save & Close")
            }
        }
    )
}

