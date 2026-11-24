package com.ayushp0021.everythinglocal.merchant.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Business
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Dns
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ayushp0021.everythinglocal.core.designsystem.*

@Composable
fun MerchantLoginScreen(
    viewModel: MerchantViewModel,
    onLoginSuccess: () -> Unit,
    onNavigateToOnboarding: () -> Unit,
    onNavigateToTracking: () -> Unit
) {
    val scrollState = rememberScrollState()
    var emailOrPhone by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var showServerConfig by remember { mutableStateOf(false) }

    if (showServerConfig) {
        ServerConfigDialog(viewModel = viewModel, onDismiss = { showServerConfig = false })
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Everything Local Partner Portal", fontWeight = FontWeight.Bold, fontSize = 16.sp) },
                actions = {
                    IconButton(onClick = { showServerConfig = true }) {
                        Icon(Icons.Default.Dns, contentDescription = "Server Settings")
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
                .padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(modifier = Modifier.height(10.dp))

            // Distinct Everything Local Merchant Brand Logo
            MerchantBrandLogo(
                modifier = Modifier.padding(vertical = 12.dp),
                showTagline = true
            )

            Spacer(modifier = Modifier.height(24.dp))

            if (errorMessage != null) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color(0xFFFEE2E2)),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        errorMessage!!,
                        color = Color(0xFF991B1B),
                        fontSize = 12.sp,
                        modifier = Modifier.padding(12.dp)
                    )
                }
                Spacer(modifier = Modifier.height(12.dp))
            }

            Card(
                colors = CardDefaults.cardColors(containerColor = Color.White),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Text("Partner Sign In", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    Spacer(modifier = Modifier.height(14.dp))

                    OutlinedTextField(
                        value = emailOrPhone,
                        onValueChange = { emailOrPhone = it },
                        label = { Text("Registered Email or Phone") },
                        placeholder = { Text("e.g. sharma.kirana@everythinglocal.in") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    OutlinedTextField(
                        value = password,
                        onValueChange = { password = it },
                        label = { Text("Password") },
                        visualTransformation = PasswordVisualTransformation(),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(20.dp))

                    Button(
                        onClick = {
                            if (emailOrPhone.isBlank() || password.isBlank()) {
                                errorMessage = "Please enter both credentials."
                                return@Button
                            }
                            isLoading = true
                            errorMessage = null
                            viewModel.login(
                                emailOrPhone = emailOrPhone.trim(),
                                pass = password,
                                onSuccess = {
                                    isLoading = false
                                    onLoginSuccess()
                                },
                                onError = { err ->
                                    isLoading = false
                                    errorMessage = err
                                }
                            )
                        },
                        enabled = !isLoading,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = ForestGreen),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text(if (isLoading) "Authenticating..." else "Sign In to Store Dashboard ➔", fontWeight = FontWeight.Bold)
                    }
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // New Merchant Onboarding Card
            Card(
                colors = CardDefaults.cardColors(containerColor = Color.White),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Text("Grow Your Retail Business in Indore", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        "Join 500+ verified Indore retailers on Everything Local. Quick self-service onboarding, statutory compliance check, and daily T+1 payouts.",
                        fontSize = 12.sp,
                        color = TextMuted,
                        lineHeight = 18.sp
                    )
                    Spacer(modifier = Modifier.height(14.dp))

                    Button(
                        onClick = onNavigateToOnboarding,
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = AmberPrimary),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text("Register Your Business (8-Step Wizard)", color = Color.White, fontWeight = FontWeight.Bold)
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    OutlinedButton(
                        onClick = onNavigateToTracking,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text("Track Application Status (EL-MAPP-XXXX)", color = ForestGreen, fontWeight = FontWeight.SemiBold)
                    }
                }
            }
        }
    }
}
