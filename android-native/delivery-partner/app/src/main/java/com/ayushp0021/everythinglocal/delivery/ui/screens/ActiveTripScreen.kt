package com.ayushp0021.everythinglocal.delivery.ui.screens

import androidx.compose.foundation.background
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
import com.ayushp0021.everythinglocal.delivery.theme.*
import com.ayushp0021.everythinglocal.delivery.viewmodel.DeliveryViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ActiveTripScreen(
    taskId: String,
    viewModel: DeliveryViewModel,
    onTripCompleted: () -> Unit,
    onBack: () -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    val task = state.activeTask

    var pickupOtp by remember { mutableStateOf("") }
    var deliveryOtp by remember { mutableStateOf("") }
    var recipientNotes by remember { mutableStateOf("") }
    var showIncidentDialog by remember { mutableStateOf(false) }
    var incidentType by remember { mutableStateOf("CUSTOMER_UNREACHABLE") }
    var incidentDesc by remember { mutableStateOf("") }

    val scrollState = rememberScrollState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(task?.taskNumber ?: "Active Trip", fontWeight = FontWeight.Bold, fontSize = 17.sp) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = Color.White)
                    }
                },
                actions = {
                    IconButton(onClick = { showIncidentDialog = true }) {
                        Icon(Icons.Default.Warning, contentDescription = "Report Issue", tint = Color.White)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = CourierBluePrimary,
                    titleContentColor = Color.White
                )
            )
        }
    ) { padding ->
        if (task == null) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("No active trip found.", color = Color(0xFF64748B))
                    Button(onClick = onBack) { Text("Back to Dashboard") }
                }
            }
        } else {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color(0xFFF8FAFC))
                    .padding(padding)
                    .verticalScroll(scrollState)
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Trip Status Banner
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = CourierBlueDark)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text("CURRENT STAGE", fontSize = 10.sp, color = CourierAmberAccent, fontWeight = FontWeight.Black)
                            Text(task.status, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        }
                        Text("Payout: ₹${task.totalPayoutPaise / 100}", color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = 16.sp)
                    }
                }

                // Error message banner
                if (state.errorMessage != null) {
                    Surface(shape = RoundedCornerShape(8.dp), color = Color(0xFFFEE2E2), modifier = Modifier.fillMaxWidth()) {
                        Text(state.errorMessage ?: "", color = Color(0xFF991B1B), fontSize = 12.sp, modifier = Modifier.padding(10.dp))
                    }
                }

                // Stage 1: Store Navigation & Pickup
                Card(
                    shape = RoundedCornerShape(18.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Icon(Icons.Default.Store, contentDescription = null, tint = CourierBluePrimary)
                            Text("1. Merchant Pickup", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = CourierTextPrimary)
                        }

                        Text("Store: ${task.pickupLocationName}", fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                        Text("Address: ${task.pickupAddress}", fontSize = 12.sp, color = Color(0xFF64748B))

                        if (task.status == "ACCEPTED") {
                            Button(
                                onClick = { viewModel.arriveAtStore(task.id) },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(12.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = CourierBluePrimary)
                            ) {
                                Text("I Have Arrived at Merchant Store")
                            }
                        } else if (task.status == "AT_STORE") {
                            OutlinedTextField(
                                value = pickupOtp,
                                onValueChange = { pickupOtp = it },
                                label = { Text("Merchant Handover OTP (Optional)") },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(10.dp)
                            )
                            Button(
                                onClick = { viewModel.confirmPickup(task.id, pickupOtp) },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(12.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = CourierOnlineGreen)
                            ) {
                                Text("Confirm Pickup & Start Transit")
                            }
                        } else {
                            Surface(color = Color(0xFFECFDF5), shape = RoundedCornerShape(8.dp)) {
                                Text("✓ Order Picked Up", color = Color(0xFF047857), fontWeight = FontWeight.Bold, fontSize = 12.sp, modifier = Modifier.padding(8.dp))
                            }
                        }
                    }
                }

                // Stage 2: Customer Navigation & Secure Delivery OTP
                Card(
                    shape = RoundedCornerShape(18.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Icon(Icons.Default.Home, contentDescription = null, tint = CourierAmberDark)
                            Text("2. Customer Dropoff", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = CourierTextPrimary)
                        }

                        Text("Destination: ${task.deliveryAddress}", fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                        Text(
                            text = "Security: Ask customer for their 4-digit delivery verification OTP. (Max ${task.deliveryOtpMaxAttempts} attempts allowed).",
                            fontSize = 12.sp,
                            color = Color(0xFF64748B)
                        )

                        if (task.status == "PICKED_UP" || task.status == "EN_ROUTE") {
                            OutlinedTextField(
                                value = deliveryOtp,
                                onValueChange = { if (it.length <= 4) deliveryOtp = it },
                                label = { Text("Enter 4-Digit Customer OTP") },
                                leadingIcon = { Icon(Icons.Default.Pin, contentDescription = null) },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(12.dp)
                            )

                            OutlinedTextField(
                                value = recipientNotes,
                                onValueChange = { recipientNotes = it },
                                label = { Text("Handover notes (e.g. handed to customer)") },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(12.dp)
                            )

                            Button(
                                onClick = {
                                    viewModel.completeDelivery(task.id, deliveryOtp, recipientNotes)
                                    onTripCompleted()
                                },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(50.dp),
                                shape = RoundedCornerShape(14.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = CourierOnlineGreen),
                                enabled = deliveryOtp.length == 4 && !state.isLoading
                            ) {
                                Text("Verify OTP & Complete Delivery", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                            }
                        }
                    }
                }
            }
        }
    }

    // Incident Reporting Dialog
    if (showIncidentDialog && task != null) {
        AlertDialog(
            onDismissRequest = { showIncidentDialog = false },
            title = { Text("Report Trip Incident", fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Select incident category:", fontSize = 12.sp, color = Color(0xFF64748B))
                    OutlinedTextField(
                        value = incidentType,
                        onValueChange = { incidentType = it },
                        label = { Text("Incident Type (CUSTOMER_UNREACHABLE / VEHICLE_BREAKDOWN)") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = incidentDesc,
                        onValueChange = { incidentDesc = it },
                        label = { Text("Describe the issue in detail") },
                        modifier = Modifier.fillMaxWidth(),
                        minLines = 2
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        viewModel.reportIncident(task.id, incidentType, incidentDesc)
                        showIncidentDialog = false
                        onTripCompleted()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFEF4444)),
                    enabled = incidentDesc.isNotBlank()
                ) {
                    Text("Submit Incident Ticket")
                }
            },
            dismissButton = {
                TextButton(onClick = { showIncidentDialog = false }) { Text("Cancel") }
            }
        )
    }
}
