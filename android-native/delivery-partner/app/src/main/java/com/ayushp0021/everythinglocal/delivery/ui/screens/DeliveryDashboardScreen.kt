package com.ayushp0021.everythinglocal.delivery.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ayushp0021.everythinglocal.delivery.theme.*
import com.ayushp0021.everythinglocal.delivery.viewmodel.DeliveryViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DeliveryDashboardScreen(
    viewModel: DeliveryViewModel,
    onNavigateToActiveTrip: (String) -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    var showEmergencyDialog by remember { mutableStateOf(false) }
    var emergencyReason by remember { mutableStateOf("") }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "Everything Local Courier",
                            fontWeight = FontWeight.Bold,
                            fontSize = 17.sp,
                            color = Color.White
                        )
                        Text(
                            text = state.profile?.riderCode ?: "Indore Central Fleet",
                            fontSize = 11.sp,
                            color = Color.White.copy(alpha = 0.8f)
                        )
                    }
                },
                actions = {
                    IconButton(onClick = { viewModel.refreshDashboard() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh", tint = Color.White)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = CourierBluePrimary)
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .background(Color(0xFFF8FAFC))
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // 1. Online / Offline Duty Switch Card
            item {
                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = if (state.isOnline) Color(0xFFECFDF5) else Color(0xFFF1F5F9)
                    ),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(20.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            Box(
                                modifier = Modifier
                                    .size(16.dp)
                                    .background(
                                        if (state.isOnline) CourierOnlineGreen else CourierOfflineGray,
                                        CircleShape
                                    )
                            )
                            Column {
                                Text(
                                    text = if (state.isOnline) "ON DUTY (ONLINE)" else "OFF DUTY (OFFLINE)",
                                    fontWeight = FontWeight.ExtraBold,
                                    fontSize = 15.sp,
                                    color = if (state.isOnline) Color(0xFF065F46) else Color(0xFF475569)
                                )
                                Text(
                                    text = if (state.isOnline) "Receiving orders in Indore grid" else "Turn switch ON to receive trip requests",
                                    fontSize = 12.sp,
                                    color = if (state.isOnline) Color(0xFF047857) else Color(0xFF64748B)
                                )
                            }
                        }

                        Switch(
                            checked = state.isOnline,
                            onCheckedChange = { targetOnline ->
                                if (!targetOnline && state.activeTask != null) {
                                    // Order lock active! Prompt emergency breakdown dialog
                                    showEmergencyDialog = true
                                } else {
                                    viewModel.toggleOnline(targetOnline)
                                }
                            },
                            colors = SwitchDefaults.colors(
                                checkedThumbColor = Color.White,
                                checkedTrackColor = CourierOnlineGreen
                            )
                        )
                    }
                }
            }

            // 2. Metrics Strip (Rating, Deliveries, Total Pay)
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Card(
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White)
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Text("Trips", fontSize = 11.sp, color = Color(0xFF64748B), fontWeight = FontWeight.SemiBold)
                            Text(
                                text = "${state.profile?.totalDeliveries ?: 0}",
                                fontSize = 20.sp,
                                fontWeight = FontWeight.Bold,
                                color = CourierBlueDark
                            )
                        }
                    }

                    Card(
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White)
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Text("Rating", fontSize = 11.sp, color = Color(0xFF64748B), fontWeight = FontWeight.SemiBold)
                            Text(
                                text = "★ ${state.profile?.rating ?: 5.0}",
                                fontSize = 20.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFFD97706)
                            )
                        }
                    }

                    Card(
                        modifier = Modifier.weight(1.3f),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White)
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Text("Unsettled Pay", fontSize = 11.sp, color = Color(0xFF64748B), fontWeight = FontWeight.SemiBold)
                            Text(
                                text = "₹${(state.earnings?.unsettledEarningsPaise ?: 0) / 100}",
                                fontSize = 20.sp,
                                fontWeight = FontWeight.Bold,
                                color = CourierOnlineGreen
                            )
                        }
                    }
                }
            }

            // 3. Active In-Progress Trip Banner
            state.activeTask?.let { active ->
                item {
                    Card(
                        shape = RoundedCornerShape(20.dp),
                        colors = CardDefaults.cardColors(containerColor = CourierBlueDark),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Surface(shape = RoundedCornerShape(6.dp), color = CourierAmberAccent) {
                                    Text(
                                        text = active.status,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Black,
                                        color = CourierBlueDark,
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                                    )
                                }
                                Text("Payout: ₹${active.totalPayoutPaise / 100}", color = Color.White, fontWeight = FontWeight.Bold)
                            }

                            Text(
                                text = "Trip: ${active.taskNumber}",
                                color = Color.White,
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp
                            )
                            Text(
                                text = "From: ${active.pickupLocationName}\nTo: ${active.deliveryAddress}",
                                color = Color.White.copy(alpha = 0.85f),
                                fontSize = 12.sp
                            )

                            Button(
                                onClick = { onNavigateToActiveTrip(active.id) },
                                colors = ButtonDefaults.buttonColors(containerColor = CourierAmberAccent),
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text("Open Active Trip & Navigation &rarr;", color = CourierBlueDark, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }

            // 4. Pending Offers (45-second Broadcast Reservation)
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Trip Offers (${state.pendingOffers.size})",
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp,
                        color = CourierTextPrimary
                    )
                }
            }

            if (state.pendingOffers.isEmpty()) {
                item {
                    Card(
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Box(modifier = Modifier.padding(32.dp), contentAlignment = Alignment.Center) {
                            Text(
                                text = if (state.isOnline) "Scanning for nearby merchant orders in Indore..." else "Go ONLINE to receive delivery orders.",
                                color = Color(0xFF94A3B8),
                                fontSize = 13.sp
                            )
                        }
                    }
                }
            } else {
                items(state.pendingOffers) { offer ->
                    Card(
                        shape = RoundedCornerShape(18.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        elevation = CardDefaults.cardElevation(defaultElevation = 3.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Surface(shape = RoundedCornerShape(50), color = CourierAmberAccent.copy(alpha = 0.2f)) {
                                    Text(
                                        text = "45s OFFER WINDOW",
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Black,
                                        color = Color(0xFFB45309),
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                                    )
                                }
                                Text(
                                    text = "₹${offer.task.totalPayoutPaise / 100}",
                                    fontSize = 18.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = CourierOnlineGreen
                                )
                            }

                            Text(
                                text = offer.task.pickupLocationName,
                                fontWeight = FontWeight.Bold,
                                fontSize = 15.sp,
                                color = CourierTextPrimary
                            )
                            Text(
                                text = "Pickup: ${offer.task.pickupAddress}\nDropoff: ${offer.task.deliveryAddress}",
                                fontSize = 12.sp,
                                color = Color(0xFF64748B)
                            )
                            Text(
                                text = "Est: ${offer.task.estimatedMinutes} mins • ${offer.task.estimatedDistanceKm} km",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = CourierBlueDark
                            )

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                OutlinedButton(
                                    onClick = { viewModel.rejectOffer(offer.taskId, "Partner rejected") },
                                    modifier = Modifier.weight(1f),
                                    shape = RoundedCornerShape(12.dp)
                                ) {
                                    Text("Decline", color = Color(0xFFEF4444), fontWeight = FontWeight.Bold)
                                }
                                Button(
                                    onClick = {
                                        viewModel.acceptOffer(offer.taskId)
                                        onNavigateToActiveTrip(offer.taskId)
                                    },
                                    modifier = Modifier.weight(1.5f),
                                    shape = RoundedCornerShape(12.dp),
                                    colors = ButtonDefaults.buttonColors(containerColor = CourierOnlineGreen)
                                ) {
                                    Text("Accept Trip", color = Color.White, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Emergency Offline Incident Dialog
    if (showEmergencyDialog) {
        AlertDialog(
            onDismissRequest = { showEmergencyDialog = false },
            title = { Text("Active Trip in Progress", fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        text = "You cannot go offline while holding an active customer trip unless you report an emergency breakdown. Reporting emergency will reassign the trip to support.",
                        fontSize = 13.sp,
                        color = Color(0xFF475569)
                    )
                    OutlinedTextField(
                        value = emergencyReason,
                        onValueChange = { emergencyReason = it },
                        label = { Text("Emergency Reason (e.g. puncture)") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        viewModel.toggleOnline(false, emergencyReason = emergencyReason)
                        showEmergencyDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFEF4444)),
                    enabled = emergencyReason.isNotBlank()
                ) {
                    Text("Report Emergency & Go Offline")
                }
            },
            dismissButton = {
                TextButton(onClick = { showEmergencyDialog = false }) {
                    Text("Continue Trip")
                }
            }
        )
    }
}
