package com.ayushp0021.everythinglocal.merchant.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.ui.text.input.PasswordVisualTransformation
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
    onOnboardingComplete: () -> Unit,
    onNavigateToTracking: (String) -> Unit = {}
) {
    val coroutineScope = rememberCoroutineScope()
    val scrollState = rememberScrollState()

    var currentStep by remember { mutableIntStateOf(1) }
    var referenceNumber by remember { mutableStateOf("") }
    var applicationStatus by remember { mutableStateOf("DRAFT") }
    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var successMessage by remember { mutableStateOf<String?>(null) }

    // Step 1: Owner Details & OTP
    var ownerName by remember { mutableStateOf("") }
    var ownerPhone by remember { mutableStateOf("") }
    var ownerEmail by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var otpInput by remember { mutableStateOf("") }
    var isOtpSent by remember { mutableStateOf(false) }
    var isPhoneVerified by remember { mutableStateOf(false) }

    // Step 2: Business & Tax Details
    var businessName by remember { mutableStateOf("") }
    var legalEntityName by remember { mutableStateOf("") }
    var businessType by remember { mutableStateOf("Proprietorship") }
    var panNumber by remember { mutableStateOf("") }
    var gstin by remember { mutableStateOf("") }

    // Step 3: Store, Category & GPS Location
    var storeName by remember { mutableStateOf("") }
    var category by remember { mutableStateOf("Grocery & Daily Staples") }
    var fssaiNumber by remember { mutableStateOf("") }
    var drugLicenseNumber by remember { mutableStateOf("") }
    var addressLine by remember { mutableStateOf("") }
    var selectedLocality by remember { mutableStateOf("Saket Nagar") }
    var pincode by remember { mutableStateOf("452001") }
    var latitude by remember { mutableStateOf("22.7196") }
    var longitude by remember { mutableStateOf("75.8577") }

    // Step 4: Delivery Configuration
    var deliveryRadiusKm by remember { mutableFloatStateOf(3.0f) }
    var deliveryMode by remember { mutableStateOf("Everything Local Fleet") }
    var openingTime by remember { mutableStateOf("08:00 AM") }
    var closingTime by remember { mutableStateOf("10:00 PM") }

    // Step 5: Bank Details
    var bankName by remember { mutableStateOf("State Bank of India") }
    var accountHolderName by remember { mutableStateOf("") }
    var accountNumber by remember { mutableStateOf("") }
    var confirmAccountNumber by remember { mutableStateOf("") }
    var ifscCode by remember { mutableStateOf("") }

    // Step 6: Statutory Document Registration
    var panDocumentName by remember { mutableStateOf<String?>(null) }
    var fssaiDocumentName by remember { mutableStateOf<String?>(null) }
    var drugLicenseDocName by remember { mutableStateOf<String?>(null) }
    var chequeDocumentName by remember { mutableStateOf<String?>(null) }

    // Step 7: Agreement & Submission
    var agreementAccepted by remember { mutableStateOf(false) }

    val categories = listOf(
        "Grocery & Daily Staples",
        "Fresh Fruits & Vegetables",
        "Pharmacy & Wellness",
        "Electronics & Mobile Accessories",
        "Home & Kitchen",
        "Local Professional Services"
    )

    val indoreLocalities = listOf(
        "Saket Nagar", "Vijay Nagar", "Palasia", "Rajwada", "Bhanwarkua", "Bengali Square", "Annapurna Road"
    )

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Merchant Partner Registration", fontWeight = FontWeight.Bold, fontSize = 16.sp) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    if (referenceNumber.isNotEmpty()) {
                        TextButton(onClick = { onNavigateToTracking(referenceNumber) }) {
                            Text("Track Status", color = ForestGreen, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        }
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
            // Header Progress Card
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
                            "Step $currentStep of 7: " + when (currentStep) {
                                1 -> "Owner Verification"
                                2 -> "Business Identity & Tax"
                                3 -> "Storefront & GPS Location"
                                4 -> "Delivery & Operations"
                                5 -> "Bank & Payout Details"
                                6 -> "Statutory Documents"
                                else -> "Agreement & Submission"
                            },
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp,
                            color = ForestGreen
                        )
                        if (referenceNumber.isNotEmpty()) {
                            Surface(
                                color = AmberLight,
                                shape = RoundedCornerShape(6.dp)
                            ) {
                                Text(
                                    referenceNumber,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 11.sp,
                                    color = AmberDark,
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))
                    LinearProgressIndicator(
                        progress = { currentStep / 7f },
                        modifier = Modifier.fillMaxWidth(),
                        color = ForestGreen,
                        trackColor = ForestGreenLight
                    )
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

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

            // ==========================================
            // STEP 1: Owner Details & Mobile Verification
            // ==========================================
            if (currentStep == 1) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("Owner / Authorized Signatory", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                        Text("Create your partner account. Initial role will be CUSTOMER until authorized verification.", fontSize = 11.sp, color = TextMuted)
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
                            visualTransformation = PasswordVisualTransformation(),
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        if (!isOtpSent) {
                            Button(
                                onClick = {
                                    if (ownerName.isBlank() || ownerPhone.length < 10 || ownerEmail.isBlank() || password.length < 6) {
                                        errorMessage = "Please enter valid owner name, 10-digit mobile, email, and password (min 6 chars)."
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
                                            accountHolderName = ownerName.trim()
                                            isOtpSent = true
                                            successMessage = "OTP sent to ${ownerPhone.trim()}. (In local test environment: enter 1234)"
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
                                Text(if (isLoading) "Creating Draft Application..." else "Generate Reference & Send OTP ➔")
                            }
                        } else {
                            OutlinedTextField(
                                value = otpInput,
                                onValueChange = { otpInput = it.take(6) },
                                label = { Text("Verification OTP (e.g. 1234)") },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                modifier = Modifier.fillMaxWidth(),
                                singleLine = true
                            )
                            Spacer(modifier = Modifier.height(10.dp))
                            Button(
                                onClick = {
                                    isLoading = true
                                    errorMessage = null
                                    coroutineScope.launch {
                                        try {
                                            repository.verifyPhoneOtp(referenceNumber, otpInput.ifBlank { "1234" })
                                            isPhoneVerified = true
                                            successMessage = "Phone verified successfully! Proceeding to business details."
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
                                Text(if (isLoading) "Verifying..." else "Verify OTP & Continue ➔")
                            }
                        }
                    }
                }
            }

            // ==========================================
            // STEP 2: Business & Tax Information
            // ==========================================
            if (currentStep == 2) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("Business & Tax Registration", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                        Spacer(modifier = Modifier.height(12.dp))

                        OutlinedTextField(
                            value = businessName,
                            onValueChange = { businessName = it },
                            label = { Text("Trading Name (e.g. Sharma Kirana)") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )

                        Spacer(modifier = Modifier.height(8.dp))
                        OutlinedTextField(
                            value = legalEntityName,
                            onValueChange = { legalEntityName = it },
                            label = { Text("Registered Legal Entity Name") },
                            placeholder = { Text("e.g. Sharma Traders Pvt Ltd") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )

                        Spacer(modifier = Modifier.height(8.dp))
                        OutlinedTextField(
                            value = panNumber,
                            onValueChange = { panNumber = it.uppercase().take(10) },
                            label = { Text("Business PAN Number (10 chars)") },
                            placeholder = { Text("e.g. ABCDE1234F") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )

                        Spacer(modifier = Modifier.height(8.dp))
                        OutlinedTextField(
                            value = gstin,
                            onValueChange = { gstin = it.uppercase().take(15) },
                            label = { Text("GSTIN (15 chars, optional for unregistered)") },
                            placeholder = { Text("e.g. 23AAAAA0000A1Z5") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )

                        Spacer(modifier = Modifier.height(16.dp))
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedButton(
                                onClick = { currentStep = 1 },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text("Back")
                            }
                            Button(
                                onClick = {
                                    if (businessName.isBlank() || panNumber.length < 10) {
                                        errorMessage = "Please enter valid trading name and 10-character PAN."
                                        return@Button
                                    }
                                    if (storeName.isBlank()) {
                                        storeName = businessName
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
                                                    "legalName" to (legalEntityName.ifBlank { businessName }).trim(),
                                                    "panNumber" to panNumber.trim(),
                                                    "gstin" to gstin.trim(),
                                                    "businessType" to businessType
                                                )
                                            )
                                            currentStep = 3
                                        } catch (e: Exception) {
                                            errorMessage = e.message ?: "Failed to save business details"
                                        } finally {
                                            isLoading = false
                                        }
                                    }
                                },
                                enabled = !isLoading,
                                modifier = Modifier.weight(2f),
                                colors = ButtonDefaults.buttonColors(containerColor = ForestGreen),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text(if (isLoading) "Saving..." else "Save & Continue ➔")
                            }
                        }
                    }
                }
            }

            // ==========================================
            // STEP 3: Storefront, Category & GPS Location
            // ==========================================
            if (currentStep == 3) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("Storefront & Statutory Category", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                        Spacer(modifier = Modifier.height(12.dp))

                        OutlinedTextField(
                            value = storeName,
                            onValueChange = { storeName = it },
                            label = { Text("Store Display Name") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )

                        Spacer(modifier = Modifier.height(10.dp))
                        Text("Store Retail Category:", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                        Spacer(modifier = Modifier.height(4.dp))

                        Column {
                            categories.forEach { cat ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable { category = cat }
                                        .padding(vertical = 4.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    RadioButton(
                                        selected = category == cat,
                                        onClick = { category = cat },
                                        colors = RadioButtonDefaults.colors(selectedColor = ForestGreen)
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(cat, fontSize = 13.sp)
                                }
                            }
                        }

                        // Category specific statutory licenses
                        if (category.contains("Pharmacy")) {
                            Spacer(modifier = Modifier.height(8.dp))
                            OutlinedTextField(
                                value = drugLicenseNumber,
                                onValueChange = { drugLicenseNumber = it.uppercase() },
                                label = { Text("CDSCO / State Drug License Number *") },
                                placeholder = { Text("e.g. MP-IND-2026-DRUG-0982") },
                                modifier = Modifier.fillMaxWidth(),
                                singleLine = true
                            )
                        } else if (category.contains("Grocery") || category.contains("Fresh")) {
                            Spacer(modifier = Modifier.height(8.dp))
                            OutlinedTextField(
                                value = fssaiNumber,
                                onValueChange = { fssaiNumber = it.take(14) },
                                label = { Text("FSSAI License / Registration (14 digits) *") },
                                placeholder = { Text("e.g. 10020026001234") },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                modifier = Modifier.fillMaxWidth(),
                                singleLine = true
                            )
                        }

                        Spacer(modifier = Modifier.height(10.dp))
                        OutlinedTextField(
                            value = addressLine,
                            onValueChange = { addressLine = it },
                            label = { Text("Physical Store Address") },
                            modifier = Modifier.fillMaxWidth()
                        )

                        Spacer(modifier = Modifier.height(8.dp))
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedTextField(
                                value = selectedLocality,
                                onValueChange = { selectedLocality = it },
                                label = { Text("Indore Locality") },
                                modifier = Modifier.weight(1f),
                                singleLine = true
                            )
                            OutlinedTextField(
                                value = pincode,
                                onValueChange = { pincode = it.take(6) },
                                label = { Text("PIN Code") },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                modifier = Modifier.weight(1f),
                                singleLine = true
                            )
                        }

                        Spacer(modifier = Modifier.height(10.dp))
                        Text("GPS Geolocation (Indore Coordinates):", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                        Spacer(modifier = Modifier.height(4.dp))
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedTextField(
                                value = latitude,
                                onValueChange = { latitude = it },
                                label = { Text("Latitude") },
                                modifier = Modifier.weight(1f),
                                singleLine = true
                            )
                            OutlinedTextField(
                                value = longitude,
                                onValueChange = { longitude = it },
                                label = { Text("Longitude") },
                                modifier = Modifier.weight(1f),
                                singleLine = true
                            )
                        }

                        Spacer(modifier = Modifier.height(6.dp))
                        TextButton(
                            onClick = {
                                latitude = "22.7196"
                                longitude = "75.8577"
                                successMessage = "GPS coordinates set to Indore Central."
                            }
                        ) {
                            Icon(Icons.Default.MyLocation, contentDescription = null, tint = ForestGreen, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Use Current GPS Coordinates", fontSize = 12.sp, color = ForestGreen)
                        }

                        Spacer(modifier = Modifier.height(14.dp))
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedButton(
                                onClick = { currentStep = 2 },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text("Back")
                            }
                            Button(
                                onClick = {
                                    if (storeName.isBlank() || addressLine.isBlank() || pincode.length < 6) {
                                        errorMessage = "Please enter store display name, address, and valid 6-digit PIN code."
                                        return@Button
                                    }
                                    if (category.contains("Pharmacy") && drugLicenseNumber.isBlank()) {
                                        errorMessage = "Drug License Number is mandatory for Pharmacy & Wellness."
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
                                                    "locality" to selectedLocality.trim(),
                                                    "city" to "Indore",
                                                    "pincode" to pincode.trim(),
                                                    "latitude" to latitude.trim(),
                                                    "longitude" to longitude.trim(),
                                                    "fssaiNumber" to fssaiNumber.trim(),
                                                    "drugLicenseNumber" to drugLicenseNumber.trim()
                                                )
                                            )
                                            currentStep = 4
                                        } catch (e: Exception) {
                                            errorMessage = e.message ?: "Failed to save storefront details"
                                        } finally {
                                            isLoading = false
                                        }
                                    }
                                },
                                enabled = !isLoading,
                                modifier = Modifier.weight(2f),
                                colors = ButtonDefaults.buttonColors(containerColor = ForestGreen),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text(if (isLoading) "Saving..." else "Save & Continue ➔")
                            }
                        }
                    }
                }
            }

            // ==========================================
            // STEP 4: Delivery & Operations
            // ==========================================
            if (currentStep == 4) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("Delivery Radius & Store Logistics", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                        Spacer(modifier = Modifier.height(12.dp))

                        Text("Hyperlocal Service Radius: ${"%.1f".format(deliveryRadiusKm)} km", fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                        Slider(
                            value = deliveryRadiusKm,
                            onValueChange = { deliveryRadiusKm = it },
                            valueRange = 1.0f..15.0f,
                            steps = 13,
                            colors = SliderDefaults.colors(thumbColor = ForestGreen, activeTrackColor = ForestGreen)
                        )

                        Spacer(modifier = Modifier.height(10.dp))
                        Text("Fulfillment Logistics Mode:", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            RadioButton(
                                selected = deliveryMode == "Everything Local Fleet",
                                onClick = { deliveryMode = "Everything Local Fleet" },
                                colors = RadioButtonDefaults.colors(selectedColor = ForestGreen)
                            )
                            Text("Everything Local Rider Network", fontSize = 12.sp)
                        }
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            RadioButton(
                                selected = deliveryMode == "Merchant Self-Delivery",
                                onClick = { deliveryMode = "Merchant Self-Delivery" },
                                colors = RadioButtonDefaults.colors(selectedColor = ForestGreen)
                            )
                            Text("Merchant Self-Delivery Staff", fontSize = 12.sp)
                        }

                        Spacer(modifier = Modifier.height(10.dp))
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedTextField(
                                value = openingTime,
                                onValueChange = { openingTime = it },
                                label = { Text("Opens At") },
                                modifier = Modifier.weight(1f),
                                singleLine = true
                            )
                            OutlinedTextField(
                                value = closingTime,
                                onValueChange = { closingTime = it },
                                label = { Text("Closes At") },
                                modifier = Modifier.weight(1f),
                                singleLine = true
                            )
                        }

                        Spacer(modifier = Modifier.height(16.dp))
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedButton(
                                onClick = { currentStep = 3 },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text("Back")
                            }
                            Button(
                                onClick = {
                                    isLoading = true
                                    errorMessage = null
                                    coroutineScope.launch {
                                        try {
                                            repository.updateOnboardingStep(
                                                referenceNumber,
                                                4,
                                                mapOf(
                                                    "deliveryRadiusKm" to deliveryRadiusKm.toString(),
                                                    "deliveryMode" to deliveryMode,
                                                    "openingTime" to openingTime,
                                                    "closingTime" to closingTime
                                                )
                                            )
                                            currentStep = 5
                                        } catch (e: Exception) {
                                            errorMessage = e.message ?: "Failed to save delivery parameters"
                                        } finally {
                                            isLoading = false
                                        }
                                    }
                                },
                                enabled = !isLoading,
                                modifier = Modifier.weight(2f),
                                colors = ButtonDefaults.buttonColors(containerColor = ForestGreen),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text(if (isLoading) "Saving..." else "Save & Continue ➔")
                            }
                        }
                    }
                }
            }

            // ==========================================
            // STEP 5: Bank Details & Masked Display
            // ==========================================
            if (currentStep == 5) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("Settlement Bank Account (T+1 Daily Payouts)", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                        Text("Earnings are settled directly to this account every morning.", fontSize = 11.sp, color = TextMuted)
                        Spacer(modifier = Modifier.height(12.dp))

                        OutlinedTextField(
                            value = bankName,
                            onValueChange = { bankName = it },
                            label = { Text("Bank Name (e.g. HDFC Bank, SBI)") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )

                        Spacer(modifier = Modifier.height(8.dp))
                        OutlinedTextField(
                            value = accountHolderName,
                            onValueChange = { accountHolderName = it },
                            label = { Text("Account Holder Legal Name") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )

                        Spacer(modifier = Modifier.height(8.dp))
                        OutlinedTextField(
                            value = accountNumber,
                            onValueChange = { accountNumber = it.filter { char -> char.isDigit() } },
                            label = { Text("Account Number") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )

                        Spacer(modifier = Modifier.height(8.dp))
                        OutlinedTextField(
                            value = confirmAccountNumber,
                            onValueChange = { confirmAccountNumber = it.filter { char -> char.isDigit() } },
                            label = { Text("Confirm Account Number") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )

                        Spacer(modifier = Modifier.height(8.dp))
                        OutlinedTextField(
                            value = ifscCode,
                            onValueChange = { ifscCode = it.uppercase().take(11) },
                            label = { Text("IFSC Code (11 alphanumeric)") },
                            placeholder = { Text("e.g. SBIN0001234") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )

                        if (accountNumber.isNotEmpty() && accountNumber.length >= 4) {
                            Spacer(modifier = Modifier.height(10.dp))
                            Surface(
                                color = SurfaceOffWhite,
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text(
                                    "Masked Display on Slips: •••• •••• ${accountNumber.takeLast(4)}",
                                    fontSize = 12.sp,
                                    color = TextMuted,
                                    modifier = Modifier.padding(8.dp)
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(16.dp))
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedButton(
                                onClick = { currentStep = 4 },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text("Back")
                            }
                            Button(
                                onClick = {
                                    if (bankName.isBlank() || accountHolderName.isBlank() || accountNumber.length < 9 || ifscCode.length < 11) {
                                        errorMessage = "Please enter valid bank name, account holder, account number (min 9 digits), and 11-char IFSC code."
                                        return@Button
                                    }
                                    if (accountNumber != confirmAccountNumber) {
                                        errorMessage = "Account numbers do not match."
                                        return@Button
                                    }
                                    isLoading = true
                                    errorMessage = null
                                    coroutineScope.launch {
                                        try {
                                            repository.updateOnboardingStep(
                                                referenceNumber,
                                                6,
                                                mapOf(
                                                    "bankName" to bankName.trim(),
                                                    "accountHolderName" to accountHolderName.trim(),
                                                    "accountNumber" to accountNumber.trim(),
                                                    "ifsc" to ifscCode.trim(),
                                                    "accountType" to "CURRENT"
                                                )
                                            )
                                            currentStep = 6
                                        } catch (e: Exception) {
                                            errorMessage = e.message ?: "Failed to save bank information"
                                        } finally {
                                            isLoading = false
                                        }
                                    }
                                },
                                enabled = !isLoading,
                                modifier = Modifier.weight(2f),
                                colors = ButtonDefaults.buttonColors(containerColor = ForestGreen),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text(if (isLoading) "Saving..." else "Save & Continue ➔")
                            }
                        }
                    }
                }
            }

            // ==========================================
            // STEP 6: Statutory Document Registration
            // ==========================================
            if (currentStep == 6) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("Business Statutory Documents", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                        Text("Upload clear scans or photos for administrative verification.", fontSize = 11.sp, color = TextMuted)
                        Spacer(modifier = Modifier.height(14.dp))

                        // Doc 1: PAN Card
                        DocumentRow(
                            label = "Business PAN Card *",
                            fileName = panDocumentName ?: "pan_card_${panNumber.ifBlank { "preview" }}.pdf",
                            onUpload = {
                                panDocumentName = "pan_card_uploaded.pdf"
                                successMessage = "PAN Document staged."
                            }
                        )

                        Spacer(modifier = Modifier.height(10.dp))

                        // Doc 2: Statutory License
                        if (category.contains("Pharmacy")) {
                            DocumentRow(
                                label = "Drug License Certificate *",
                                fileName = drugLicenseDocName ?: "drug_license_${drugLicenseNumber.ifBlank { "preview" }}.pdf",
                                onUpload = {
                                    drugLicenseDocName = "drug_license_verified.pdf"
                                    successMessage = "Drug license document staged."
                                }
                            )
                        } else {
                            DocumentRow(
                                label = "FSSAI / Trade License Certificate *",
                                fileName = fssaiDocumentName ?: "fssai_cert_${fssaiNumber.ifBlank { "preview" }}.pdf",
                                onUpload = {
                                    fssaiDocumentName = "fssai_cert_uploaded.pdf"
                                    successMessage = "FSSAI document staged."
                                }
                            )
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        // Doc 3: Cancelled Cheque
                        DocumentRow(
                            label = "Cancelled Cheque / Bank Statement *",
                            fileName = chequeDocumentName ?: "cancelled_cheque_${bankName.take(4).lowercase()}.pdf",
                            onUpload = {
                                chequeDocumentName = "cancelled_cheque_uploaded.pdf"
                                successMessage = "Bank proof document staged."
                            }
                        )

                        Spacer(modifier = Modifier.height(16.dp))
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedButton(
                                onClick = { currentStep = 5 },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text("Back")
                            }
                            Button(
                                onClick = {
                                    currentStep = 7
                                },
                                modifier = Modifier.weight(2f),
                                colors = ButtonDefaults.buttonColors(containerColor = ForestGreen),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text("Proceed to Agreement ➔")
                            }
                        }
                    }
                }
            }

            // ==========================================
            // STEP 7: Agreement & Submission
            // ==========================================
            if (currentStep == 7) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("Commercial Agreement & Submission", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                        Spacer(modifier = Modifier.height(12.dp))

                        // Commission Rate Box
                        val commissionRate = when {
                            category.contains("Pharmacy") -> 2.5
                            category.contains("Electronics") -> 4.0
                            else -> 3.5
                        }

                        Card(
                            colors = CardDefaults.cardColors(containerColor = Color(0xFFF0FDF4)),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Text("Standard Indore Hyperlocal Terms:", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = ForestGreen)
                                Spacer(modifier = Modifier.height(4.dp))
                                Text("• Category: $category", fontSize = 12.sp)
                                Text("• Commission Rate: $commissionRate% per completed order", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = ForestGreen)
                                Text("• Settlement Cycle: T+1 Morning Bank Payouts", fontSize = 12.sp)
                                Text("• Zero Onboarding or Registration Fee", fontSize = 12.sp)
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        // Summary Check
                        Text("Application Summary Review:", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        Text("• Store: $storeName", fontSize = 12.sp, color = TextMuted)
                        Text("• Owner: $ownerName ($ownerPhone)", fontSize = 12.sp, color = TextMuted)
                        Text("• Location: $addressLine, $selectedLocality, Indore - $pincode", fontSize = 12.sp, color = TextMuted)
                        Text("• Bank: $bankName (•••• •••• ${accountNumber.takeLast(4)})", fontSize = 12.sp, color = TextMuted)

                        Spacer(modifier = Modifier.height(14.dp))

                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { agreementAccepted = !agreementAccepted }
                        ) {
                            Checkbox(
                                checked = agreementAccepted,
                                onCheckedChange = { agreementAccepted = it },
                                colors = CheckboxDefaults.colors(checkedColor = ForestGreen)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                "I accept the Everything Local Merchant Partner Agreement, code of conduct, and statutory warranties.",
                                fontSize = 11.sp,
                                lineHeight = 16.sp
                            )
                        }

                        Spacer(modifier = Modifier.height(16.dp))
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedButton(
                                onClick = { currentStep = 6 },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text("Back")
                            }
                            Button(
                                onClick = {
                                    if (!agreementAccepted) {
                                        errorMessage = "Please read and accept the agreement terms."
                                        return@Button
                                    }
                                    isLoading = true
                                    errorMessage = null
                                    coroutineScope.launch {
                                        try {
                                            repository.updateOnboardingStep(
                                                referenceNumber,
                                                7,
                                                mapOf(
                                                    "termsAccepted" to "true",
                                                    "commissionRatePct" to commissionRate.toString()
                                                )
                                            )
                                            val submitted = repository.submitOnboardingApplication(referenceNumber)
                                            applicationStatus = submitted.status
                                            successMessage = "Application successfully submitted for verification!"
                                            onNavigateToTracking(referenceNumber)
                                        } catch (e: Exception) {
                                            errorMessage = e.message ?: "Failed to submit application"
                                        } finally {
                                            isLoading = false
                                        }
                                    }
                                },
                                enabled = !isLoading && agreementAccepted,
                                modifier = Modifier.weight(2f),
                                colors = ButtonDefaults.buttonColors(containerColor = AmberPrimary),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text(if (isLoading) "Submitting Application..." else "Submit Partner Application ➔", fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun DocumentRow(
    label: String,
    fileName: String,
    onUpload: () -> Unit
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = SurfaceOffWhite),
        shape = RoundedCornerShape(8.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(10.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(label, fontWeight = FontWeight.SemiBold, fontSize = 12.sp)
                Text(fileName, fontSize = 11.sp, color = TextMuted)
            }
            Button(
                onClick = onUpload,
                colors = ButtonDefaults.buttonColors(containerColor = ForestGreen),
                shape = RoundedCornerShape(8.dp),
                contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp)
            ) {
                Icon(Icons.Default.UploadFile, contentDescription = null, modifier = Modifier.size(14.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text("Select File", fontSize = 11.sp)
            }
        }
    }
}
