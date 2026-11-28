package com.ayushp0021.everythinglocal.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.ayushp0021.everythinglocal.core.common.Formatters
import com.ayushp0021.everythinglocal.core.models.*
import com.ayushp0021.everythinglocal.core.network.NetworkClient
import kotlinx.coroutines.launch

@Composable
fun WholesaleBuyerScreen(
    tokenProvider: () -> String?,
    apiBaseUrl: String
) {
    val scope = rememberCoroutineScope()
    val api = remember {
        NetworkClient(tokenProvider = tokenProvider, baseUrlProvider = { apiBaseUrl }).api
    }

    var products by remember { mutableStateOf<List<WholesaleProductDto>>(emptyList()) }
    var cart by remember { mutableStateOf(WholesaleCartResponse()) }
    var orders by remember { mutableStateOf<List<WholesaleOrderDto>>(emptyList()) }
    var rfqs by remember { mutableStateOf<List<WholesaleRfqDto>>(emptyList()) }
    var selectedTab by remember { mutableIntStateOf(0) }
    var statusMsg by remember { mutableStateOf<String?>(null) }

    fun refresh() {
        scope.launch {
            try {
                products = api.getWholesaleProducts().products
                cart = runCatching { api.getWholesaleCart() }.getOrDefault(WholesaleCartResponse())
                orders = runCatching { api.getWholesaleBuyerOrders().orders }.getOrDefault(emptyList())
                rfqs = runCatching { api.getWholesaleBuyerRfqs().rfqs }.getOrDefault(emptyList())
            } catch (e: Exception) {
                statusMsg = e.message
            }
        }
    }

    LaunchedEffect(Unit) { refresh() }

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text("EveryBazaar Wholesale", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Black)
        Text("Bulk MOQ & Volume Tier Pricing", style = MaterialTheme.typography.bodySmall)
        Spacer(Modifier.height(10.dp))

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            listOf("Catalogue", "Cart (${cart.summary.itemCount})", "Orders (${orders.size})", "RFQs (${rfqs.size})").forEachIndexed { idx, label ->
                FilterChip(
                    selected = selectedTab == idx,
                    onClick = { selectedTab = idx },
                    label = { Text(label) }
                )
            }
        }

        if (statusMsg != null) {
            Text(statusMsg!!, color = MaterialTheme.colorScheme.primary, style = MaterialTheme.typography.bodySmall)
        }

        Spacer(Modifier.height(10.dp))
        LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            when (selectedTab) {
                0 -> {
                    items(products) { p ->
                        Card(modifier = Modifier.fillMaxWidth()) {
                            Column(Modifier.padding(14.dp)) {
                                Text(p.title, fontWeight = FontWeight.Bold)
                                Text("Supplier: ${p.wholesaler?.businessName ?: "Verified"} • MOQ: ${p.moq} ${p.unitOfMeasurement}")
                                Text("Starting ${Formatters.formatPaise(p.basePricePaise)} / ${p.unitOfMeasurement}")
                                Spacer(Modifier.height(6.dp))
                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    Button(onClick = {
                                        scope.launch {
                                            runCatching { api.addToWholesaleCart(WholesaleCartAddRequest(p.id, p.moq)) }
                                                .onSuccess { statusMsg = "Added ${p.moq} ${p.unitOfMeasurement} to Wholesale Cart"; refresh() }
                                                .onFailure { statusMsg = it.message }
                                        }
                                    }) { Text("Add MOQ (${p.moq})") }
                                    OutlinedButton(onClick = {
                                        scope.launch {
                                            runCatching {
                                                api.submitWholesaleRfq(
                                                    WholesaleRfqCreateRequest(
                                                        productId = p.id,
                                                        requestedQty = p.moq * 2,
                                                        deliveryCity = "Indore",
                                                        deliveryPincode = "452001",
                                                        deliveryAddress = "Indore Business Hub"
                                                    )
                                                )
                                            }.onSuccess { statusMsg = "RFQ submitted"; refresh() }
                                                .onFailure { statusMsg = it.message }
                                        }
                                    }) { Text("Request Quote") }
                                }
                            }
                        }
                    }
                }
                1 -> {
                    items(cart.items) { ci ->
                        Card(modifier = Modifier.fillMaxWidth()) {
                            Column(Modifier.padding(14.dp)) {
                                Text(ci.product.title, fontWeight = FontWeight.Bold)
                                Text("Qty: ${ci.quantity} • Total: ${Formatters.formatPaise(ci.lineTotalPaise)}")
                            }
                        }
                    }
                    if (cart.items.isNotEmpty()) {
                        item {
                            Button(
                                onClick = {
                                    scope.launch {
                                        runCatching {
                                            api.checkoutWholesale(
                                                WholesaleCheckoutRequest(
                                                    shippingAddress = WholesaleShippingAddressDto(
                                                        addressLine = "Shop 12, Indore",
                                                        city = "Indore",
                                                        pincode = "452001"
                                                    )
                                                )
                                            )
                                        }.onSuccess { statusMsg = "Wholesale order placed!"; selectedTab = 2; refresh() }
                                            .onFailure { statusMsg = it.message }
                                    }
                                },
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text("Place Wholesale Order (${Formatters.formatPaise(cart.summary.totalPaise)})")
                            }
                        }
                    }
                }
                2 -> {
                    items(orders) { o ->
                        Card(modifier = Modifier.fillMaxWidth()) {
                            Column(Modifier.padding(14.dp)) {
                                Text("${o.orderNumber} • ${o.status}", fontWeight = FontWeight.Bold)
                                Text("Total: ${Formatters.formatPaise(o.totalPaise)} • ${o.fulfillmentMethod}")
                            }
                        }
                    }
                }
                3 -> {
                    items(rfqs) { r ->
                        Card(modifier = Modifier.fillMaxWidth()) {
                            Column(Modifier.padding(14.dp)) {
                                Text("${r.rfqNumber} • ${r.status}", fontWeight = FontWeight.Bold)
                                Text("${r.product?.title ?: ""} • Qty: ${r.requestedQty}")
                            }
                        }
                    }
                }
            }
        }
    }
}
