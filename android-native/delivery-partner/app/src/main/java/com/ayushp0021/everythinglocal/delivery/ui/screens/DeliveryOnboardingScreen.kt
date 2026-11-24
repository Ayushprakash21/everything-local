package com.ayushp0021.everythinglocal.delivery.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ayushp0021.everythinglocal.delivery.theme.CourierAmberAccent
import com.ayushp0021.everythinglocal.delivery.theme.CourierBlueDark
import com.ayushp0021.everythinglocal.delivery.theme.CourierBluePrimary
import com.ayushp0021.everythinglocal.delivery.viewmodel.DeliveryViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DeliveryOnboardingScreen(
    viewModel: DeliveryViewModel,
    onComplete: () -> Unit
) {
    var name by remember { mutableStateOf("") }
    var dlNumber by remember { mutableStateOf("") }
    var panNumber by remember { mutableStateOf("") }
    var vehicleType by remember { mutableStateOf("SCOOTER") }
    var vehicleNumber by remember { mutableStateOf("") }
    var bankAccount by remember { mutableStateOf("") }
    var bankIfsc by remember { mutableStateOf("") }
    var emergencyName by remember { mutableStateOf("") }
    var emergencyPhone by remember { mutableStateOf("") }
    var serviceArea by remember { mutableStateOf("Vijay Nagar & Palasia, Indore") }

    val state by viewModel.uiState.collectAsState()
    val scrollState = rememberScrollState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Delivery Partner Onboarding", fontWeight = FontWeight.Bold, fontSize = 18.sp) },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = CourierBluePrimary,
                    titleContentColor = Color.White
                )
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(Color(0xFFF8FAFC))
                .padding(padding)
                .verticalScroll(scrollState)
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Notice Card
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = CourierAmberAccent.copy(alpha = 0.15f))
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Statutory Driver Verification",
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFFB45309),
                        fontSize = 14.sp
                    )
                    Text(
                        text = "Everything Local operates strictly with verified drivers. Please provide your legal licence and vehicle registration. (Aadhaar is legally excluded for privacy).",
                        color = Color(0xFF92400E),
                        fontSize = 12.sp,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }
            }

            // Section 1: Personal & Emergency Contact
            Text("1. Personal Details", fontWeight = FontWeight.Bold, color = CourierBlueDark, fontSize = 15.sp)
            OutlinedTextField(
                value = name,
                onValueChange = { name = it },
                label = { Text("Full Legal Name") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp)
            )
            OutlinedTextField(
                value = emergencyName,
                onValueChange = { emergencyName = it },
                label = { Text("Emergency Contact Name") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp)
            )
            OutlinedTextField(
                value = emergencyPhone,
                onValueChange = { emergencyPhone = it },
                label = { Text("Emergency Contact Phone") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp)
            )

            // Section 2: Vehicle & Licencing
            Text("2. Vehicle & Licence", fontWeight = FontWeight.Bold, color = CourierBlueDark, fontSize = 15.sp)
            OutlinedTextField(
                value = vehicleNumber,
                onValueChange = { vehicleNumber = it },
                label = { Text("Vehicle Plate Number (e.g. MP09AB1234)") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp)
            )
            OutlinedTextField(
                value = dlNumber,
                onValueChange = { dlNumber = it },
                label = { Text("Driving Licence Number") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp)
            )
            OutlinedTextField(
                value = panNumber,
                onValueChange = { panNumber = it },
                label = { Text("PAN Number (Optional for Tax)") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp)
            )

            // Section 3: Payout Banking
            Text("3. Bank Payout Account", fontWeight = FontWeight.Bold, color = CourierBlueDark, fontSize = 15.sp)
            OutlinedTextField(
                value = bankAccount,
                onValueChange = { bankAccount = it },
                label = { Text("Bank Account Number") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp)
            )
            OutlinedTextField(
                value = bankIfsc,
                onValueChange = { bankIfsc = it },
                label = { Text("Bank IFSC Code (e.g. SBIN0001234)") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp)
            )

            // Submit Button
            Button(
                onClick = {
                    viewModel.submitOnboarding(
                        name = name,
                        dlNumber = dlNumber,
                        panNumber = panNumber,
                        vehicleType = vehicleType,
                        vehicleNumber = vehicleNumber,
                        bankAccount = bankAccount,
                        bankIfsc = bankIfsc,
                        emergencyName = emergencyName,
                        emergencyPhone = emergencyPhone,
                        serviceArea = serviceArea,
                        onSuccess = onComplete
                    )
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 10.dp)
                    .height(52.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = CourierBluePrimary),
                enabled = !state.isLoading && name.isNotBlank() && dlNumber.isNotBlank() && vehicleNumber.isNotBlank() && bankAccount.isNotBlank()
            ) {
                if (state.isLoading) {
                    CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp), strokeWidth = 2.dp)
                } else {
                    Text("Submit Application for Review", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                }
            }
        }
    }
}
