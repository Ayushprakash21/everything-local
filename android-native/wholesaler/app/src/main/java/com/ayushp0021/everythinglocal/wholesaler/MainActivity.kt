package com.ayushp0021.everythinglocal.wholesaler

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                WholesalerAppRoot()
            }
        }
    }
}

@Composable
fun WholesalerAppRoot(vm: WholesalerViewModel = viewModel()) {
    val state by vm.uiState.collectAsState()

    if (!state.isLoggedIn) {
        WholesalerLoginScreen(
            isLoading = state.isLoading,
            error = state.error,
            onLogin = { e, p -> vm.login(e, p) }
        )
    } else if (state.needsOnboarding) {
        WholesalerOnboardingScreen(
            isLoading = state.isLoading,
            error = state.error,
            onSubmit = { b, l, g, a, c, pin, ph ->
                vm.registerWholesaler(b, l, g, a, c, pin, ph)
            },
            onLogout = { vm.logout() }
        )
    } else {
        WholesalerDashboardScaffold(state = state, vm = vm)
    }
}

@Composable
fun WholesalerLoginScreen(
    isLoading: Boolean,
    error: String?,
    onLogin: (String, String) -> Unit
) {
    var email by remember { mutableStateOf("wholesaler@everythinglocal.in") }
    var password by remember { mutableStateOf("Password@123") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text("EveryBazaar Wholesale", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Black)
        Text("Your Neighbourhood. Your Marketplace.", style = MaterialTheme.typography.bodySmall)
        Spacer(Modifier.height(24.dp))
        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            label = { Text("Wholesaler Email or Phone") },
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(Modifier.height(12.dp))
        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Password") },
            visualTransformation = PasswordVisualTransformation(),
            modifier = Modifier.fillMaxWidth()
        )
        if (error != null) {
            Spacer(Modifier.height(8.dp))
            Text(error, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
        }
        Spacer(Modifier.height(20.dp))
        Button(
            onClick = { onLogin(email, password) },
            enabled = !isLoading,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text(if (isLoading) "Signing In..." else "Sign In to Wholesaler Console")
        }
    }
}

@Composable
fun WholesalerOnboardingScreen(
    isLoading: Boolean,
    error: String?,
    onSubmit: (String, String, String, String, String, String, String) -> Unit,
    onLogout: () -> Unit
) {
    var businessName by remember { mutableStateOf("") }
    var legalName by remember { mutableStateOf("") }
    var gstin by remember { mutableStateOf("") }
    var address by remember { mutableStateOf("") }
    var city by remember { mutableStateOf("Indore") }
    var pincode by remember { mutableStateOf("452007") }
    var phone by remember { mutableStateOf("") }

    LazyColumn(modifier = Modifier.fillMaxSize().padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item {
            Text("Wholesaler Business Onboarding", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            OutlinedTextField(value = businessName, onValueChange = { businessName = it }, label = { Text("Business Name") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = legalName, onValueChange = { legalName = it }, label = { Text("Legal Business Name") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = gstin, onValueChange = { gstin = it }, label = { Text("GSTIN (Optional)") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = address, onValueChange = { address = it }, label = { Text("Business Address") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = city, onValueChange = { city = it }, label = { Text("City") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = pincode, onValueChange = { pincode = it }, label = { Text("Pincode") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = phone, onValueChange = { phone = it }, label = { Text("Contact Phone") }, modifier = Modifier.fillMaxWidth())
            if (error != null) Text(error, color = MaterialTheme.colorScheme.error)
            Spacer(Modifier.height(8.dp))
            Button(
                onClick = { onSubmit(businessName, legalName, gstin, address, city, pincode, phone) },
                enabled = !isLoading,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Submit Application")
            }
            TextButton(onClick = onLogout, modifier = Modifier.fillMaxWidth()) { Text("Logout") }
        }
    }
}

@Composable
fun WholesalerDashboardScaffold(state: WholesalerUiState, vm: WholesalerViewModel) {
    var selectedTab by remember { mutableIntStateOf(0) }
    val tabs = listOf("Overview", "Products", "Orders", "RFQs", "Profile")

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(state.profile?.businessName ?: "Wholesaler Console", fontWeight = FontWeight.Bold) },
                actions = {
                    TextButton(onClick = { vm.loadConsole() }) { Text("Refresh") }
                    TextButton(onClick = { vm.logout() }) { Text("Logout") }
                }
            )
        },
        bottomBar = {
            NavigationBar {
                tabs.forEachIndexed { index, title ->
                    NavigationBarItem(
                        selected = selectedTab == index,
                        onClick = { selectedTab = index },
                        icon = { Text(title.take(2)) },
                        label = { Text(title) }
                    )
                }
            }
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            when (selectedTab) {
                0 -> {
                    item {
                        Card(modifier = Modifier.fillMaxWidth()) {
                            Column(Modifier.padding(16.dp)) {
                                Text("Verification: ${state.profile?.verificationStatus ?: "PENDING"}", fontWeight = FontWeight.Bold)
                                Text("Total Orders: ${state.metrics.totalOrders} | Pending: ${state.metrics.pendingOrders}")
                                Text("Total GMV: ₹${state.metrics.totalGmvPaise / 100}")
                                Text("Products Listed: ${state.metrics.productsListed} | Low Stock: ${state.metrics.lowStock}")
                                Text("Pending RFQs: ${state.metrics.pendingRfqs} | Accepted Quotes: ${state.metrics.acceptedQuotations}")
                            }
                        }
                    }
                }
                1 -> {
                    items(state.products) { p ->
                        Card(modifier = Modifier.fillMaxWidth()) {
                            Column(Modifier.padding(14.dp)) {
                                Text(p.title, fontWeight = FontWeight.Bold)
                                Text("SKU: ${p.sku} | MOQ: ${p.moq} ${p.unitOfMeasurement} | ₹${p.basePricePaise / 100}")
                                Text("Status: ${p.approvalStatus} | Tiers: ${p.priceTiers.size}")
                            }
                        }
                    }
                }
                2 -> {
                    items(state.orders) { o ->
                        Card(modifier = Modifier.fillMaxWidth()) {
                            Column(Modifier.padding(14.dp)) {
                                Text("${o.orderNumber} — ${o.status}", fontWeight = FontWeight.Bold)
                                Text("Total: ₹${o.totalPaise / 100} | Fulfillment: ${o.fulfillmentMethod}")
                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    OutlinedButton(onClick = { vm.updateOrderStatus(o.id, "CONFIRMED") }) { Text("Confirm") }
                                    OutlinedButton(onClick = { vm.updateOrderStatus(o.id, "DISPATCHED") }) { Text("Dispatch") }
                                }
                            }
                        }
                    }
                }
                3 -> {
                    items(state.rfqs) { r ->
                        Card(modifier = Modifier.fillMaxWidth()) {
                            Column(Modifier.padding(14.dp)) {
                                Text("${r.rfqNumber} (${r.status})", fontWeight = FontWeight.Bold)
                                Text("${r.product?.title ?: ""} • Qty: ${r.requestedQty} • ${r.deliveryCity}")
                                if (r.status == "OPEN") {
                                    Button(onClick = { vm.submitQuote(r.id, (r.product?.basePricePaise ?: 10000), r.requestedQty) }) {
                                        Text("Send Quote")
                                    }
                                }
                            }
                        }
                    }
                }
                4 -> {
                    item {
                        Card(modifier = Modifier.fillMaxWidth()) {
                            Column(Modifier.padding(16.dp)) {
                                Text("Business Profile", fontWeight = FontWeight.Bold)
                                Text("Legal Name: ${state.profile?.legalBusinessName ?: "-"}")
                                Text("Type: ${state.profile?.businessType ?: "-"}")
                                Text("GSTIN: ${state.profile?.gstin ?: "Unregistered"}")
                                Text("Address: ${state.profile?.businessAddress ?: "-"}, ${state.profile?.city ?: ""}")
                                Text("Warehouses: ${state.profile?.warehouses?.size ?: 0}")
                            }
                        }
                    }
                }
            }
        }
    }
}
