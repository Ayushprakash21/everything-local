package com.ayushp0021.everythinglocal.delivery.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
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
import com.ayushp0021.everythinglocal.delivery.theme.CourierAmberAccent
import com.ayushp0021.everythinglocal.delivery.theme.CourierBlueDark
import com.ayushp0021.everythinglocal.delivery.theme.CourierBluePrimary
import com.ayushp0021.everythinglocal.delivery.viewmodel.DeliveryViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DeliveryProfileScreen(
    viewModel: DeliveryViewModel,
    onLogout: () -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    val profile = state.profile
    val scrollState = rememberScrollState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Partner Profile", fontWeight = FontWeight.Bold, fontSize = 18.sp) },
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
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Profile Header Card
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(72.dp)
                            .background(CourierBluePrimary, RoundedCornerShape(20.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.Person, contentDescription = null, tint = Color.White, modifier = Modifier.size(40.dp))
                    }

                    Text(
                        text = profile?.riderCode ?: "EL-RIDER-IND",
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp,
                        color = CourierBlueDark
                    )

                    Surface(
                        shape = RoundedCornerShape(50),
                        color = if (profile?.approvalStatus == "APPROVED") Color(0xFFECFDF5) else CourierAmberAccent.copy(alpha = 0.2f)
                    ) {
                        Text(
                            text = profile?.approvalStatus ?: "UNDER_REVIEW",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (profile?.approvalStatus == "APPROVED") Color(0xFF047857) else Color(0xFFB45309),
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                        )
                    }
                }
            }

            // Specs Card
            Card(
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
            ) {
                Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("Fleet & Vehicle Details", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = Color(0xFF0F172A))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Vehicle Type", color = Color(0xFF64748B), fontSize = 13.sp)
                        Text(profile?.vehicleType ?: "SCOOTER", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                    }
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Plate Number", color = Color(0xFF64748B), fontSize = 13.sp)
                        Text(profile?.vehicleNumber ?: "N/A", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                    }
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Service Zone", color = Color(0xFF64748B), fontSize = 13.sp)
                        Text(profile?.serviceArea ?: "Indore - All Zones", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                    }
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Emergency Helpline", color = Color(0xFF64748B), fontSize = 13.sp)
                        Text("1800-LOCAL-HELP", fontWeight = FontWeight.Bold, color = CourierBluePrimary, fontSize = 13.sp)
                    }
                }
            }

            // Logout Action
            OutlinedButton(
                onClick = {
                    viewModel.logout()
                    onLogout()
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = Color(0xFFEF4444))
            ) {
                Icon(Icons.Default.Logout, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text("Sign Out of Delivery Partner App", fontWeight = FontWeight.Bold)
            }
        }
    }
}
