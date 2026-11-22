package com.ayushp0021.everythinglocal.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.ReceiptLong
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
fun OrdersScreen(
    viewModel: CustomerViewModel
) {
    val state by viewModel.uiState.collectAsState()

    LaunchedEffect(Unit) {
        viewModel.loadOrders()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("My Orders", fontWeight = FontWeight.Bold) },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        }
    ) { padding ->
        if (state.orders.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Default.ReceiptLong, contentDescription = null, modifier = Modifier.size(64.dp), tint = Color(0xFFCBD5E1))
                    Spacer(modifier = Modifier.height(10.dp))
                    Text("No past orders found", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    Text("Your placed orders will appear here", fontSize = 13.sp, color = TextMuted)
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
                items(state.orders) { order ->
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
                                        .background(
                                            when (order.status) {
                                                "DELIVERED", "COLLECTED" -> ForestGreenLight
                                                "REJECTED", "CANCELLED" -> Color(0xFFFEE2E2)
                                                else -> AmberLight
                                            },
                                            RoundedCornerShape(6.dp)
                                        )
                                        .padding(horizontal = 8.dp, vertical = 3.dp)
                                ) {
                                    Text(
                                        text = order.status.replace("_", " "),
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = when (order.status) {
                                            "DELIVERED", "COLLECTED" -> ForestGreen
                                            "REJECTED", "CANCELLED" -> Color(0xFFDC2626)
                                            else -> AmberDark
                                        }
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = "Store: ${order.store?.name ?: "Neighborhood Store"}",
                                fontSize = 13.sp,
                                color = TextDark
                            )

                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = "Items (${order.items.size}): ${order.items.joinToString { "${it.product?.name ?: "Item"} x${it.quantity}" }}",
                                fontSize = 12.sp,
                                color = TextMuted,
                                maxLines = 2
                            )

                            HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text("Mode: ${order.fulfillmentMode.replace("_", " ")}", fontSize = 12.sp, color = TextMuted)
                                Text(
                                    text = Formatters.formatPaise(order.totalAmountPaise),
                                    fontWeight = FontWeight.ExtraBold,
                                    fontSize = 15.sp,
                                    color = ForestGreen
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
