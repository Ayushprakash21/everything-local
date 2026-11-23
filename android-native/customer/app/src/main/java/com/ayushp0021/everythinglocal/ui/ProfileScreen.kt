package com.ayushp0021.everythinglocal.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
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
import com.ayushp0021.everythinglocal.core.designsystem.*
import kotlinx.coroutines.launch

@Composable
fun ProfileScreen(
    viewModel: CustomerViewModel,
    onNavigateToMerchantOnboarding: () -> Unit = {}
) {
    val state by viewModel.uiState.collectAsState()
    val scrollState = rememberScrollState()
    val coroutineScope = rememberCoroutineScope()

    var activeDialog by remember { mutableStateOf<String?>(null) }
    var showLoginDialog by remember { mutableStateOf(false) }

    // Dialog Sheets State
    var orderSmsEnabled by remember { mutableStateOf(true) }
    var promoNotificationsEnabled by remember { mutableStateOf(false) }
    var selectedPaymentMethod by remember { mutableStateOf("UPI (Google Pay / PhonePe)") }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { CustomerBrandLogo(variant = LogoVariant.COMPACT) },
                actions = {
                    IconButton(onClick = { activeDialog = "HELP" }) {
                        Icon(Icons.Default.HelpOutline, contentDescription = "Support", tint = ForestGreen)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .background(SurfaceOffWhite)
                .verticalScroll(scrollState)
                .padding(16.dp)
        ) {
            // Profile Card (Live User Session)
            Card(
                colors = CardDefaults.cardColors(containerColor = Color.White),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(56.dp)
                            .clip(CircleShape)
                            .background(ForestGreenLight),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.Person, contentDescription = null, tint = ForestGreen, modifier = Modifier.size(32.dp))
                    }
                    Spacer(modifier = Modifier.width(14.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            state.user?.name ?: "Ayush Prakash",
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp,
                            color = TextDark
                        )
                        Text(
                            state.user?.email ?: "ayush@everythinglocal.in",
                            fontSize = 12.sp,
                            color = TextMuted
                        )
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            "Indore Hyperlocal Customer • Active",
                            fontSize = 11.sp,
                            color = ForestGreen,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                    IconButton(onClick = { showLoginDialog = true }) {
                        Icon(Icons.Default.Edit, contentDescription = "Switch Account", tint = TextMuted)
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Settings & Preferences (ALL CLICKABLE)
            Card(
                colors = CardDefaults.cardColors(containerColor = Color.White),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(8.dp)) {
                    AccountOptionRow(
                        icon = Icons.Default.LocationOn,
                        title = "Saved Delivery Addresses",
                        subtitle = "${state.selectedNeighborhood} • Tap to manage",
                        onClick = { activeDialog = "ADDRESSES" }
                    )
                    HorizontalDivider(color = DividerColor)
                    AccountOptionRow(
                        icon = Icons.Default.Payment,
                        title = "Payment Methods & UPI",
                        subtitle = "$selectedPaymentMethod • Tap to manage",
                        onClick = { activeDialog = "PAYMENT" }
                    )
                    HorizontalDivider(color = DividerColor)
                    AccountOptionRow(
                        icon = Icons.Default.Notifications,
                        title = "Notification Preferences",
                        subtitle = if (orderSmsEnabled) "Order updates active" else "Notifications paused",
                        onClick = { activeDialog = "NOTIFICATIONS" }
                    )
                    HorizontalDivider(color = DividerColor)
                    AccountOptionRow(
                        icon = Icons.Default.SupportAgent,
                        title = "Help & Customer Support",
                        subtitle = "Indore Support Desk • FAQ & Chat",
                        onClick = { activeDialog = "HELP" }
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Become a Merchant Partner Entry Point (FULLY FUNCTIONAL CLICKABLE CARD)
            Card(
                colors = CardDefaults.cardColors(containerColor = AmberLight.copy(alpha = 0.25f)),
                shape = RoundedCornerShape(16.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, AmberPrimary.copy(alpha = 0.4f)),
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { activeDialog = "MERCHANT_INFO" }
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(44.dp)
                            .clip(CircleShape)
                            .background(AmberPrimary),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.Storefront, contentDescription = null, tint = Color.Black)
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text("Become a Merchant Partner", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = TextDark)
                        Text("Register your Indore retail shop for 3 km neighbourhood delivery", fontSize = 11.sp, color = TextMuted)
                    }
                    Icon(Icons.Default.ArrowForward, contentDescription = null, tint = TextDark, modifier = Modifier.size(18.dp))
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Logout / Session Button
            Button(
                onClick = {
                    showLoginDialog = true
                },
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFF1F5F9), contentColor = Color(0xFFDC2626)),
                shape = RoundedCornerShape(12.dp)
            ) {
                Icon(Icons.Default.Logout, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text("Sign Out / Switch Account", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
            }

            Spacer(modifier = Modifier.height(20.dp))

            // App Version Info & Official Branding
            Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    CustomerBrandLogo(variant = LogoVariant.COMPACT)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text("Everything Local Native Android v2.0 • Indore Pilot", fontSize = 11.sp, color = TextMuted)
                }
            }
        }
    }

    // ==========================================
    // INTERACTIVE MODALS & SETTINGS PANELS
    // ==========================================

    // 1. Saved Addresses Modal
    if (activeDialog == "ADDRESSES") {
        val indoreAddresses = listOf(
            "Palasia, Main Road, Indore - 452001 (Default)",
            "Saket Nagar, Near Saket Club, Indore - 452018",
            "Vijay Nagar, Scheme No. 54, Indore - 452010",
            "Bhanwarkua Main Market, Indore - 452014"
        )
        AlertDialog(
            onDismissRequest = { activeDialog = null },
            title = { Text("Saved Delivery Addresses", fontWeight = FontWeight.Bold, fontSize = 16.sp) },
            text = {
                Column {
                    Text("Select your primary delivery location in Indore:", fontSize = 12.sp, color = TextMuted)
                    Spacer(modifier = Modifier.height(10.dp))
                    indoreAddresses.forEach { addr ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    val parts = addr.split(",")
                                    viewModel.setNeighborhood(parts[0].trim(), 22.7244, 75.8839)
                                    activeDialog = null
                                }
                                .padding(vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Default.LocationOn, contentDescription = null, tint = ForestGreen, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(addr, fontSize = 13.sp, modifier = Modifier.weight(1f))
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { activeDialog = null }) { Text("Close") }
            }
        )
    }

    // 2. Payment Methods Modal
    if (activeDialog == "PAYMENT") {
        val paymentOptions = listOf(
            "UPI (Google Pay / PhonePe / Paytm)",
            "Cash on Delivery (Pay at Doorstep)",
            "Net Banking & Indian Debit Cards"
        )
        AlertDialog(
            onDismissRequest = { activeDialog = null },
            title = { Text("Payment Methods", fontWeight = FontWeight.Bold, fontSize = 16.sp) },
            text = {
                Column {
                    Text("Preferred checkout payment mode:", fontSize = 12.sp, color = TextMuted)
                    Spacer(modifier = Modifier.height(10.dp))
                    paymentOptions.forEach { opt ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    selectedPaymentMethod = opt
                                    activeDialog = null
                                }
                                .padding(vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            RadioButton(
                                selected = selectedPaymentMethod == opt,
                                onClick = {
                                    selectedPaymentMethod = opt
                                    activeDialog = null
                                },
                                colors = RadioButtonDefaults.colors(selectedColor = ForestGreen)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(opt, fontSize = 13.sp)
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { activeDialog = null }) { Text("Close") }
            }
        )
    }

    // 3. Notification Preferences Modal
    if (activeDialog == "NOTIFICATIONS") {
        AlertDialog(
            onDismissRequest = { activeDialog = null },
            title = { Text("Notification Preferences", fontWeight = FontWeight.Bold, fontSize = 16.sp) },
            text = {
                Column {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text("Order Updates SMS", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                            Text("Live delivery tracking & OTP messages", fontSize = 11.sp, color = TextMuted)
                        }
                        Switch(
                            checked = orderSmsEnabled,
                            onCheckedChange = { orderSmsEnabled = it },
                            colors = SwitchDefaults.colors(checkedThumbColor = ForestGreen, checkedTrackColor = ForestGreenLight)
                        )
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text("Local Store Offers", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                            Text("Discount alerts from nearby Indore shops", fontSize = 11.sp, color = TextMuted)
                        }
                        Switch(
                            checked = promoNotificationsEnabled,
                            onCheckedChange = { promoNotificationsEnabled = it },
                            colors = SwitchDefaults.colors(checkedThumbColor = ForestGreen, checkedTrackColor = ForestGreenLight)
                        )
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { activeDialog = null }) { Text("Done") }
            }
        )
    }

    // 4. Help & Support Modal
    if (activeDialog == "HELP") {
        AlertDialog(
            onDismissRequest = { activeDialog = null },
            title = { Text("Everything Local Helpdesk", fontWeight = FontWeight.Bold, fontSize = 16.sp) },
            text = {
                Column {
                    Text("Indore Hyperlocal Customer Assistance:", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                    Spacer(modifier = Modifier.height(6.dp))
                    Text("• Customer Helpline: +91 731 498 2100", fontSize = 12.sp)
                    Text("• WhatsApp Support: +91 98765 43210", fontSize = 12.sp)
                    Text("• Email: support@everythinglocal.in", fontSize = 12.sp)
                    Text("• Operational Hours: 07:00 AM – 11:00 PM IST", fontSize = 12.sp)
                    Spacer(modifier = Modifier.height(10.dp))
                    Text("Indore Central Hub: Palasia Square, Indore, MP - 452001", fontSize = 11.sp, color = TextMuted)
                }
            },
            confirmButton = {
                Button(
                    onClick = { activeDialog = null },
                    colors = ButtonDefaults.buttonColors(containerColor = ForestGreen)
                ) {
                    Text("Got It")
                }
            }
        )
    }

    // 5. Merchant Partner Info Modal
    if (activeDialog == "MERCHANT_INFO") {
        AlertDialog(
            onDismissRequest = { activeDialog = null },
            title = { Text("Partner With Everything Local", fontWeight = FontWeight.Bold, fontSize = 16.sp) },
            text = {
                Column {
                    Text("Expand your retail business across your 3 km neighbourhood in Indore:", fontSize = 12.sp)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("✓ Zero onboarding or registration fee", fontSize = 12.sp, color = ForestGreen, fontWeight = FontWeight.SemiBold)
                    Text("✓ Daily T+1 automated morning bank payouts", fontSize = 12.sp, color = ForestGreen, fontWeight = FontWeight.SemiBold)
                    Text("✓ Everything Local dedicated delivery rider fleet", fontSize = 12.sp, color = ForestGreen, fontWeight = FontWeight.SemiBold)
                    Text("✓ Barcode scanner & instant catalogue addition", fontSize = 12.sp, color = ForestGreen, fontWeight = FontWeight.SemiBold)
                    Spacer(modifier = Modifier.height(10.dp))
                    Text("Open the Everything Local Merchant App on your Android device to register your store in 8 simple steps.", fontSize = 11.sp, color = TextMuted)
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        activeDialog = null
                        onNavigateToMerchantOnboarding()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = AmberPrimary)
                ) {
                    Text("Close", color = TextDark, fontWeight = FontWeight.Bold)
                }
            }
        )
    }

    // 6. Sign In / Switch Account Modal
    if (showLoginDialog) {
        var emailInput by remember { mutableStateOf("") }
        var passInput by remember { mutableStateOf("") }

        AlertDialog(
            onDismissRequest = { showLoginDialog = false },
            title = { Text("Customer Account Login", fontWeight = FontWeight.Bold, fontSize = 16.sp) },
            text = {
                Column {
                    Text("Sign in with your Everything Local credentials:", fontSize = 12.sp, color = TextMuted)
                    Spacer(modifier = Modifier.height(10.dp))
                    OutlinedTextField(
                        value = emailInput,
                        onValueChange = { emailInput = it },
                        label = { Text("Email or Mobile") },
                        placeholder = { Text("ayush@everythinglocal.in") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = passInput,
                        onValueChange = { passInput = it },
                        label = { Text("Password") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        showLoginDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = ForestGreen)
                ) {
                    Text("Sign In")
                }
            },
            dismissButton = {
                TextButton(onClick = { showLoginDialog = false }) { Text("Cancel") }
            }
        )
    }
}

@Composable
fun AccountOptionRow(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    subtitle: String,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .padding(vertical = 12.dp, horizontal = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icon, contentDescription = null, tint = ForestGreen, modifier = Modifier.size(24.dp))
        Spacer(modifier = Modifier.width(14.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(title, fontWeight = FontWeight.SemiBold, fontSize = 14.sp, color = TextDark)
            Text(subtitle, fontSize = 12.sp, color = TextMuted)
        }
        Icon(Icons.Default.ChevronRight, contentDescription = null, tint = TextMuted)
    }
}
