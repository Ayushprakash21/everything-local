package com.ayushp0021.everythinglocal.merchant.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Dns
import androidx.compose.material.icons.filled.RestartAlt
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ayushp0021.everythinglocal.core.designsystem.ForestGreen
import com.ayushp0021.everythinglocal.core.designsystem.TextMuted
import com.ayushp0021.everythinglocal.merchant.BuildConfig
import kotlinx.coroutines.launch

@Composable
fun ServerConfigDialog(
    viewModel: MerchantViewModel,
    onDismiss: () -> Unit
) {
    val coroutineScope = rememberCoroutineScope()
    var customUrl by remember { mutableStateOf("") }
    var currentConfigured by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        currentConfigured = viewModel.getCustomBaseUrl()
        customUrl = currentConfigured ?: BuildConfig.API_BASE_URL
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Dns, contentDescription = null, tint = ForestGreen)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Backend Connectivity", fontWeight = FontWeight.Bold, fontSize = 16.sp)
            }
        },
        text = {
            Column(modifier = Modifier.fillMaxWidth()) {
                Text(
                    "Environment: ${BuildConfig.ENVIRONMENT}",
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 13.sp,
                    color = ForestGreen
                )
                Text(
                    "Default: ${BuildConfig.API_BASE_URL}",
                    fontSize = 11.sp,
                    color = TextMuted
                )

                Spacer(modifier = Modifier.height(12.dp))

                if (BuildConfig.IS_DEBUG_NETWORK) {
                    Text(
                        "Configurable LAN Server URL (for physical device testing over Wi-Fi):",
                        fontSize = 12.sp
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    OutlinedTextField(
                        value = customUrl,
                        onValueChange = { customUrl = it },
                        label = { Text("Server API Base URL") },
                        placeholder = { Text("http://192.168.1.X:4000/api/") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    TextButton(
                        onClick = {
                            customUrl = "http://10.0.2.2:4000/api/"
                        }
                    ) {
                        Icon(Icons.Default.RestartAlt, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Reset to Emulator (10.0.2.2)", fontSize = 12.sp)
                    }
                } else {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color(0xFFF1F5F9)),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            "Production build connects securely via TLS/HTTPS to ${BuildConfig.API_BASE_URL}. Cleartext traffic and arbitrary dev endpoints are permanently disabled.",
                            fontSize = 12.sp,
                            modifier = Modifier.padding(10.dp),
                            color = TextMuted
                        )
                    }
                }
            }
        },
        confirmButton = {
            if (BuildConfig.IS_DEBUG_NETWORK) {
                Button(
                    onClick = {
                        val toSave = if (customUrl.trim() == BuildConfig.API_BASE_URL) null else customUrl.trim()
                        viewModel.setCustomBaseUrl(toSave)
                        onDismiss()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = ForestGreen)
                ) {
                    Text("Apply & Reconnect")
                }
            } else {
                Button(
                    onClick = onDismiss,
                    colors = ButtonDefaults.buttonColors(containerColor = ForestGreen)
                ) {
                    Text("Close")
                }
            }
        },
        dismissButton = {
            if (BuildConfig.IS_DEBUG_NETWORK) {
                TextButton(onClick = onDismiss) {
                    Text("Cancel")
                }
            }
        }
    )
}
