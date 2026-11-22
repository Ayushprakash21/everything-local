package com.ayushp0021.everythinglocal.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
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

@Composable
fun ProfileScreen(
    viewModel: CustomerViewModel
) {
    val state by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("My Account", fontWeight = FontWeight.Bold) },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .background(SurfaceOffWhite)
                .padding(16.dp)
        ) {
            // Profile Card
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
                    Column {
                        Text("Ayush Prakash", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = TextDark)
                        Text("+91 98765 43210 • ayush@example.com", fontSize = 12.sp, color = TextMuted)
                        Spacer(modifier = Modifier.height(2.dp))
                        Text("Customer Account", fontSize = 11.sp, color = ForestGreen, fontWeight = FontWeight.SemiBold)
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Settings Options
            Card(
                colors = CardDefaults.cardColors(containerColor = Color.White),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(8.dp)) {
                    AccountOptionRow(Icons.Default.LocationOn, "Saved Addresses", "Palasia, Indore")
                    HorizontalDivider(color = DividerColor)
                    AccountOptionRow(Icons.Default.Payment, "Payment Methods", "UPI, Cash on Delivery")
                    HorizontalDivider(color = DividerColor)
                    AccountOptionRow(Icons.Default.Notifications, "Notifications", "Order updates enabled")
                    HorizontalDivider(color = DividerColor)
                    AccountOptionRow(Icons.Default.SupportAgent, "Help & Support", "Chat with customer support")
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // App Version Info
            Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("Everything Local Native Android v1.0.0", fontSize = 12.sp, color = TextMuted)
                    Text("Shop more. Save more. Live better.", fontSize = 11.sp, color = ForestGreen, fontWeight = FontWeight.Medium)
                }
            }
        }
    }
}

@Composable
fun AccountOptionRow(icon: androidx.compose.ui.graphics.vector.ImageVector, title: String, subtitle: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
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
