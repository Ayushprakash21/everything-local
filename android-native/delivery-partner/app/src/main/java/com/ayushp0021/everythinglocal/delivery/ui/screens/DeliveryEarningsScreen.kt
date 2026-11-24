package com.ayushp0021.everythinglocal.delivery.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ayushp0021.everythinglocal.delivery.theme.CourierBlueDark
import com.ayushp0021.everythinglocal.delivery.theme.CourierBluePrimary
import com.ayushp0021.everythinglocal.delivery.theme.CourierOnlineGreen
import com.ayushp0021.everythinglocal.delivery.viewmodel.DeliveryViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DeliveryEarningsScreen(
    viewModel: DeliveryViewModel
) {
    val state by viewModel.uiState.collectAsState()
    val earnings = state.earnings

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Earnings & Payouts", fontWeight = FontWeight.Bold, fontSize = 18.sp) },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = CourierBluePrimary,
                    titleContentColor = Color.White
                )
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
            // Earnings Summary Card
            item {
                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = CourierBlueDark),
                    elevation = CardDefaults.cardElevation(defaultElevation = 3.dp)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(20.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Text("TOTAL DELIVERED EARNINGS", fontSize = 11.sp, color = Color.White.copy(alpha = 0.7f), fontWeight = FontWeight.Bold)
                        Text(
                            text = "₹${(earnings?.totalEarningsPaise ?: 0) / 100}",
                            fontSize = 32.sp,
                            fontWeight = FontWeight.Black,
                            color = Color.White
                        )

                        Divider(color = Color.White.copy(alpha = 0.15f))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column {
                                Text("Unsettled Balance", fontSize = 11.sp, color = Color.White.copy(alpha = 0.7f))
                                Text(
                                    "₹${(earnings?.unsettledEarningsPaise ?: 0) / 100}",
                                    fontSize = 18.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = CourierOnlineGreen
                                )
                            }
                            Column(horizontalAlignment = Alignment.End) {
                                Text("Trips Completed", fontSize = 11.sp, color = Color.White.copy(alpha = 0.7f))
                                Text(
                                    "${earnings?.totalDeliveries ?: 0}",
                                    fontSize = 18.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White
                                )
                            }
                        }
                    }
                }
            }

            // Recent Ledger Entries
            item {
                Text("Recent Trip Credits", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = Color(0xFF0F172A))
            }

            val entries = earnings?.earnings ?: emptyList()
            if (entries.isEmpty()) {
                item {
                    Card(shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
                        Box(modifier = Modifier.padding(24.dp), contentAlignment = Alignment.Center) {
                            Text("No earnings entries yet. Complete deliveries to earn!", color = Color(0xFF94A3B8), fontSize = 13.sp)
                        }
                    }
                }
            } else {
                items(entries) { entry ->
                    Card(
                        shape = RoundedCornerShape(14.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(14.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(entry.description, fontWeight = FontWeight.SemiBold, fontSize = 13.sp, color = Color(0xFF0F172A))
                                Text(entry.type, fontSize = 11.sp, color = Color(0xFF64748B))
                            }
                            Text(
                                "+₹${entry.amountPaise / 100}",
                                fontWeight = FontWeight.Bold,
                                fontSize = 15.sp,
                                color = CourierOnlineGreen
                            )
                        }
                    }
                }
            }
        }
    }
}
