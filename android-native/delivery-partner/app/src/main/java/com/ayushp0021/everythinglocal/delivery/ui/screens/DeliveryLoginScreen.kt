package com.ayushp0021.everythinglocal.delivery.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ElectricBike
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ayushp0021.everythinglocal.delivery.theme.CourierAmberAccent
import com.ayushp0021.everythinglocal.delivery.theme.CourierBlueDark
import com.ayushp0021.everythinglocal.delivery.theme.CourierBluePrimary
import com.ayushp0021.everythinglocal.delivery.viewmodel.DeliveryViewModel

@Composable
fun DeliveryLoginScreen(
    viewModel: DeliveryViewModel,
    onLoginSuccess: () -> Unit,
    onNavigateToOnboarding: () -> Unit
) {
    var phone by remember { mutableStateOf("") }
    var otp by remember { mutableStateOf("") }
    var otpSent by remember { mutableStateOf(false) }

    val state by viewModel.uiState.collectAsState()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFF8FAFC))
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(28.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Branding Header
                Box(
                    modifier = Modifier
                        .size(64.dp)
                        .background(CourierBluePrimary, RoundedCornerShape(18.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.ElectricBike,
                        contentDescription = "Delivery Partner",
                        tint = Color.White,
                        modifier = Modifier.size(36.dp)
                    )
                }

                Text(
                    text = "Everything Local",
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Bold,
                    color = CourierBlueDark
                )

                Surface(
                    shape = RoundedCornerShape(50),
                    color = CourierAmberAccent.copy(alpha = 0.15f)
                ) {
                    Text(
                        text = "DELIVERY PARTNER FLEET",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = Color(0xFFB45309),
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp)
                    )
                }

                Text(
                    text = if (!otpSent) "Enter your mobile number to sign in or register" else "Enter the 6-digit OTP sent to your phone",
                    fontSize = 13.sp,
                    color = Color(0xFF64748B)
                )

                // Error alert
                if (state.errorMessage != null) {
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = Color(0xFFFEE2E2),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = state.errorMessage ?: "",
                            color = Color(0xFF991B1B),
                            fontSize = 12.sp,
                            modifier = Modifier.padding(10.dp)
                        )
                    }
                }

                // Phone Input
                OutlinedTextField(
                    value = phone,
                    onValueChange = { phone = it },
                    label = { Text("Mobile Number") },
                    placeholder = { Text("e.g. 9876543210") },
                    leadingIcon = { Icon(Icons.Default.Phone, contentDescription = null, tint = CourierBluePrimary) },
                    singleLine = true,
                    enabled = !otpSent && !state.isLoading,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )

                // OTP Input
                if (otpSent) {
                    OutlinedTextField(
                        value = otp,
                        onValueChange = { otp = it },
                        label = { Text("6-Digit OTP") },
                        placeholder = { Text("123456") },
                        leadingIcon = { Icon(Icons.Default.Lock, contentDescription = null, tint = CourierBluePrimary) },
                        singleLine = true,
                        enabled = !state.isLoading,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp)
                    )
                }

                // Action Button
                Button(
                    onClick = {
                        if (!otpSent) {
                            viewModel.sendOtp(phone) { otpSent = true }
                        } else {
                            viewModel.verifyOtp(phone, otp) {
                                if (state.profile == null || state.profile?.approvalStatus == "DRAFT") {
                                    onNavigateToOnboarding()
                                } else {
                                    onLoginSuccess()
                                }
                            }
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = CourierBluePrimary),
                    enabled = !state.isLoading && (if (!otpSent) phone.length >= 10 else otp.length >= 4)
                ) {
                    if (state.isLoading) {
                        CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                    } else {
                        Text(
                            text = if (!otpSent) "Request OTP" else "Verify & Sign In",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                if (otpSent) {
                    TextButton(onClick = { otpSent = false }) {
                        Text("Change phone number", color = CourierBluePrimary, fontSize = 13.sp)
                    }
                }
            }
        }
    }
}
