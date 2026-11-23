package com.ayushp0021.everythinglocal.merchant.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
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
import com.ayushp0021.everythinglocal.core.designsystem.*
import com.ayushp0021.everythinglocal.core.models.StartOnboardingRequest
import com.ayushp0021.everythinglocal.merchant.data.MerchantRepository
import kotlinx.coroutines.launch

@Composable
fun MerchantOnboardingScreen(
    repository: MerchantRepository,
    onBack: () -> Unit,
    onOnboardingComplete: () -> Unit
) {
    val coroutineScope = rememberCoroutineScope()
    val scrollState = rememberScrollState()

    var currentStep by remember { mutableIntStateOf(1) }
    var referenceNumber by remember { mutableStateOf("") }
    var applicationStatus by remember { mutableStateOf("DRAFT") }
    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var successMessage by remember { mutableStateOf<String?>(null) }

    // Step 1: Owner
    var ownerName by remember { mutableStateOf("") }
    var ownerPhone by remember { mutableStateOf("") }
    var ownerEmail by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var otpInput by remember { mutableStateOf("") }
    var isOtpSent by remember { mutableStateOf(false) }

    // Step 2: Business
    var businessName by remember { mutableStateOf("") }
    var panNumber by remember { mutableStateOf("") }
    var gstin by remember { mutableStateOf("") }

    // Step 3: Store
    var storeName by remember { mutableStateOf("") }
    var category by remember { mutableStateOf("Grocery & Daily Staples") }
    var addressLine by remember { mutableStateOf("") }
    var pincode by remember { mutableStateOf("452001") }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Merchant Partner Onboarding", fontWeight = FontWeight.Bold, fontSize = 16.sp) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
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
            // Header Card
            Card(
                colors = CardDefaults.cardColors(containerColor = Color.White),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            "Step $currentStep of 4: " + when (currentStep) {
                                1 -> "Owner Verification"
                                2 -> "Business Information"
                                3 -> "Storefront & Location"
                                else -> "Review & Submission"
                            },
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp,
                            color = ForestGreen
                        )
                        if (referenceNumber.isNotEmpty()) {
                            Text(
                                referenceNumber,
                                fontWeight = FontWeight.Bold,
                                fontSize = 11.sp,
                                color = AmberPrimary
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))
                    LinearProgressIndicator(
                        progress = { currentStep / 4f },
                        modifier = Modifier.fillMaxWidth(),
                        color = ForestGreen,
                        trackColor = ForestGreenLight
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

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

            if (successMessage != null) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color(0xFFDCFCE7)),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        successMessage!!,
                        color = Color(0xFF166534),
                        fontSize = 12.sp,
                        modifier = Modifier.padding(12.dp)
                    )
                }
                Spacer(modifier = Modifier.height(12.dp))
            }

            // Step 1: Owner Details & Mobile Verification
            if (currentStep == 1) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("Owner / Proprietor Information", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        Spacer(modifier = Modifier.height(12.dp))

                        OutlinedTextField(
                            value = ownerName,
                            onValueChange = { ownerName = it },
                            label = { Text("Full Legal Name") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )

                        Spacer(modifier = Modifier.height(8.dp))
                        OutlinedTextField(
                            value = ownerPhone,
                            onValueChange = { ownerPhone = it.take(10) },
                            label = { Text("Mobile Number (10 digits)") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )

                        Spacer(modifier = Modifier.height(8.dp))
                        OutlinedTextField(
                            value = ownerEmail,
                            onValueChange = { ownerEmail = it },
                            label = { Text("Email Address") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )

                        Spacer(modifier = Modifier.height(8.dp))
                        OutlinedTextField(
                            value = password,
                            onValueChange = { password = it },
                            label = { Text("Password (min 6 characters)") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        if (!isOtpSent) {
                            Button(
                                onClick = {
                                    if (ownerName.isBlank() || ownerPhone.length < 10 || ownerEmail.isBlank() || password.length < 6) {
                                        errorMessage = "Please fill all fields accurately."
                                        return@Button
                                    }
                                    isLoading = true
                                    errorMessage = null
                                    coroutineScope.launch {
                                        try {
                                            val res = repository.startOnboarding(
                                                StartOnboardingRequest(
                                                    ownerName = ownerName.trim(),
                                                    ownerPhone = ownerPhone.trim(),
                                                    ownerEmail = ownerEmail.trim(),
                                                    password = password
                                                )
                                            )
                                            referenceNumber = res.application.referenceNumber
                                            isOtpSent = true
                                            successMessage = "Verification OTP sent. In test, enter 1234."
                                        } catch (e: Exception) {
                                            errorMessage = e.message ?: "Failed to start registration"
                                        } finally {
                                            isLoading = false
                                        }
                                    }
                                },
                                enabled = !isLoading,
                                modifier = Modifier.fillMaxWidth(),
                                colors = ButtonDefaults.buttonColors(containerColor = ForestGreen),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text(if (isLoading) "Processing..." else "Send Verification Code ➔")
                            }
                        } else {
                            OutlinedTextField(
                                value = otpInput,
                                onValueChange = { otpInput = it.take(6) },
                                label = { Text("Enter OTP (e.g. 1234)") },
                                modifier = Modifier.fillMaxWidth(),
                                singleLine = true
                            )
                            Spacer(modifier = Modifier.height(12.dp))
                            Button(
                                onClick = {
                                    isLoading = true
                                    errorMessage = null
                                    coroutineScope.launch {
                                        try {
                                            repository.verifyPhoneOtp(referenceNumber, otpInput.ifBlank { "1234" })
                                            successMessage = "Mobile number verified!"
                                            currentStep = 2
                                        } catch (e: Exception) {
                                            errorMessage = e.message ?: "OTP verification failed"
                                        } finally {
                                            isLoading = false
                                        }
                                    }
                                },
                                enabled = !isLoading,
                                modifier = Modifier.fillMaxWidth(),
                                colors = ButtonDefaults.buttonColors(containerColor = ForestGreen),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text(if (isLoading) "Verifying..." else "Verify & Continue ➔")
                            }
                        }
                    }
                }
            }

            // Step 2: Business & PAN Information
            if (currentStep == 2) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("Business & Tax Information", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        Spacer(modifier = Modifier.height(12.dp))

                        OutlinedTextField(
                            value = businessName,
                            onValueChange = { businessName = it },
                            label = { Text("Trading / Business Name") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )

                        Spacer(modifier = Modifier.height(8.dp))
                        OutlinedTextField(
                            value = panNumber,
                            onValueChange = { panNumber = it.uppercase().take(10) },
                            label = { Text("PAN Number (10 chars)") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )

                        Spacer(modifier = Modifier.height(8.dp))
                        OutlinedTextField(
                            value = gstin,
                            onValueChange = { gstin = it.uppercase().take(15) },
                            label = { Text("GSTIN (Optional)") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )

                        Spacer(modifier = Modifier.height(16.dp))
                        Button(
                            onClick = {
                                if (businessName.isBlank() || panNumber.length < 10) {
                                    errorMessage = "Please enter valid business name and PAN."
                                    return@Button
                                }
                                isLoading = true
                                errorMessage = null
                                coroutineScope.launch {
                                    try {
                                        repository.updateOnboardingStep(
                                            referenceNumber,
                                            2,
                                            mapOf(
                                                "businessName" to businessName.trim(),
                                                "legalName" to businessName.trim(),
                                                "panNumber" to panNumber.trim(),
                                                "gstin" to gstin.trim()
                                            )
                                        )
                                        currentStep = 3
                                    } catch (e: Exception) {
                                        errorMessage = e.message ?: "Failed to save business info"
                                    } finally {
                                        isLoading = false
                                    }
                                }
                            },
                            enabled = !isLoading,
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(containerColor = ForestGreen),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Text(if (isLoading) "Saving..." else "Save & Continue ➔")
                        }
                    }
                }
            }

            // Step 3: Store & Address
            if (currentStep == 3) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("Storefront & Location", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        Spacer(modifier = Modifier.height(12.dp))

                        OutlinedTextField(
                            value = storeName,
                            onValueChange = { storeName = it },
                            label = { Text("Store Display Name") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )

                        Spacer(modifier = Modifier.height(8.dp))
                        OutlinedTextField(
                            value = addressLine,
                            onValueChange = { addressLine = it },
                            label = { Text("Store Address in Indore") },
                            modifier = Modifier.fillMaxWidth()
                        )

                        Spacer(modifier = Modifier.height(8.dp))
                        OutlinedTextField(
                            value = pincode,
                            onValueChange = { pincode = it.take(6) },
                            label = { Text("PIN Code (e.g. 452001)") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )

                        Spacer(modifier = Modifier.height(16.dp))
                        Button(
                            onClick = {
                                if (storeName.isBlank() || addressLine.isBlank() || pincode.length < 6) {
                                    errorMessage = "Please enter complete store address."
                                    return@Button
                                }
                                isLoading = true
                                errorMessage = null
                                coroutineScope.launch {
                                    try {
                                        repository.updateOnboardingStep(
                                            referenceNumber,
                                            3,
                                            mapOf(
                                                "storeName" to storeName.trim(),
                                                "category" to category,
                                                "addressLine" to addressLine.trim(),
                                                "pincode" to pincode.trim(),
                                                "city" to "Indore"
                                            )
                                        )
                                        currentStep = 4
                                    } catch (e: Exception) {
                                        errorMessage = e.message ?: "Failed to save store info"
                                    } finally {
                                        isLoading = false
                                    }
                                }
                            },
                            enabled = !isLoading,
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(containerColor = ForestGreen),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Text(if (isLoading) "Saving..." else "Save & Continue ➔")
                        }
                    }
                }
            }

            // Step 4: Review & Submit
            if (currentStep == 4) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("Application Review", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        Spacer(modifier = Modifier.height(12.dp))

                        Text("Store: $storeName", fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                        Text("Owner: $ownerName ($ownerPhone)", fontSize = 12.sp, color = TextMuted)
                        Text("PAN: $panNumber", fontSize = 12.sp, color = TextMuted)
                        Text("Location: $addressLine, Indore - $pincode", fontSize = 12.sp, color = TextMuted)
                        Text("Standard Commission: 3.5%", fontSize = 12.sp, color = ForestGreen, fontWeight = FontWeight.Bold)

                        Spacer(modifier = Modifier.height(16.dp))

                        Button(
                            onClick = {
                                isLoading = true
                                errorMessage = null
                                coroutineScope.launch {
                                    try {
                                        // Save bank dummy & submit
                                        repository.updateOnboardingStep(
                                            referenceNumber,
                                            6,
                                            mapOf(
                                                "accountHolderName" to ownerName,
                                                "bankName" to "HDFC Bank",
                                                "accountNumber" to "1234567890",
                                                "ifsc" to "HDFC0001234"
                                            )
                                        )
                                        repository.updateOnboardingStep(
                                            referenceNumber,
                                            7,
                                            mapOf("termsAccepted" to "true")
                                        )
                                        val submitted = repository.submitOnboardingApplication(referenceNumber)
                                        applicationStatus = submitted.status
                                        successMessage = "Application submitted! Status: Under Review."
                                        onOnboardingComplete()
                                    } catch (e: Exception) {
                                        errorMessage = e.message ?: "Failed to submit application"
                                    } finally {
                                        isLoading = false
                                    }
                                }
                            },
                            enabled = !isLoading,
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(containerColor = ForestGreen),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Text(if (isLoading) "Submitting..." else "Submit Partner Application ➔")
                        }
                    }
                }
            }
        }
    }
}
