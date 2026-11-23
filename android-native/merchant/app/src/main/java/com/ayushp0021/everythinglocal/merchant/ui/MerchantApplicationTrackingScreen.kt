package com.ayushp0021.everythinglocal.merchant.ui

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
import com.ayushp0021.everythinglocal.core.designsystem.*
import com.ayushp0021.everythinglocal.core.models.MerchantApplicationDto
import com.ayushp0021.everythinglocal.merchant.data.MerchantRepository
import kotlinx.coroutines.launch

@Composable
fun MerchantApplicationTrackingScreen(
    repository: MerchantRepository,
    initialReference: String = "",
    onBack: () -> Unit,
    onApproved: () -> Unit
) {
    val coroutineScope = rememberCoroutineScope()
    val scrollState = rememberScrollState()

    var referenceInput by remember { mutableStateOf(initialReference) }
    var application by remember { mutableStateOf<MerchantApplicationDto?>(null) }
    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var successMessage by remember { mutableStateOf<String?>(null) }

    // Resubmission correction notes
    var correctionNotes by remember { mutableStateOf("") }
    var isResubmitting by remember { mutableStateOf(false) }

    fun lookup(ref: String) {
        if (ref.isBlank()) {
            errorMessage = "Please enter an application reference number."
            return
        }
        isLoading = true
        errorMessage = null
        successMessage = null
        coroutineScope.launch {
            try {
                val app = repository.getApplication(ref.trim())
                application = app
            } catch (e: Exception) {
                errorMessage = e.message ?: "Application reference not found."
                application = null
            } finally {
                isLoading = false
            }
        }
    }

    LaunchedEffect(initialReference) {
        if (initialReference.isNotBlank()) {
            lookup(initialReference)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Application Tracking", fontWeight = FontWeight.Bold, fontSize = 16.sp) },
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
            // Reference Lookup Card
            Card(
                colors = CardDefaults.cardColors(containerColor = Color.White),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Check Partner Application Status", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    Spacer(modifier = Modifier.height(10.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        OutlinedTextField(
                            value = referenceInput,
                            onValueChange = { referenceInput = it.uppercase() },
                            placeholder = { Text("e.g. EL-MAPP-1234") },
                            label = { Text("Reference Number") },
                            modifier = Modifier.weight(1f),
                            singleLine = true
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Button(
                            onClick = { lookup(referenceInput) },
                            enabled = !isLoading,
                            colors = ButtonDefaults.buttonColors(containerColor = ForestGreen),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Text(if (isLoading) "..." else "Track")
                        }
                    }
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

            // Results Card
            application?.let { app ->
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
                            Column {
                                Text(
                                    app.storeName ?: app.businessName ?: "Retail Partner",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 16.sp
                                )
                                Text(
                                    "Ref: ${app.referenceNumber}",
                                    fontSize = 12.sp,
                                    color = TextMuted
                                )
                            }

                            // Status Badge
                            val (badgeBg, badgeFg, label) = when (app.status) {
                                "APPROVED", "ACTIVE" -> Triple(Color(0xFFDCFCE7), Color(0xFF166534), "APPROVED")
                                "UNDER_REVIEW" -> Triple(Color(0xFFFEF3C7), Color(0xFF92400E), "UNDER REVIEW")
                                "SUBMITTED" -> Triple(Color(0xFFE0F2FE), Color(0xFF0369A1), "SUBMITTED")
                                "DOCUMENTS_REQUIRED" -> Triple(Color(0xFFFFEDD5), Color(0xFF9A3412), "ACTION REQUIRED")
                                "REJECTED" -> Triple(Color(0xFFFEE2E2), Color(0xFF991B1B), "REJECTED")
                                else -> Triple(Color(0xFFF1F5F9), Color(0xFF475569), app.status)
                            }

                            Surface(
                                color = badgeBg,
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Text(
                                    label,
                                    color = badgeFg,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 11.sp,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                )
                            }
                        }

                        Divider(modifier = Modifier.padding(vertical = 12.dp))

                        // Details Grid
                        Text("Category: ${app.category ?: "Grocery & Staples"}", fontSize = 12.sp)
                        Text("Owner: ${app.ownerName} (${app.ownerPhone})", fontSize = 12.sp, color = TextMuted)
                        Text("Location: ${app.addressLine ?: "Indore"}, ${app.city} - ${app.pincode}", fontSize = 12.sp, color = TextMuted)
                        Text("Commission Rate: ${app.commissionRatePct}%", fontSize = 12.sp, color = ForestGreen, fontWeight = FontWeight.SemiBold)

                        // Reviewer Feedback
                        if (!app.adminFeedback.isNullOrBlank()) {
                            Spacer(modifier = Modifier.height(12.dp))
                            Card(
                                colors = CardDefaults.cardColors(containerColor = Color(0xFFFFF7ED)),
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(10.dp)) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(Icons.Default.Info, contentDescription = null, tint = AmberDark, modifier = Modifier.size(16.dp))
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text("Admin Reviewer Feedback:", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = AmberDark)
                                    }
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(app.adminFeedback!!, fontSize = 12.sp, color = Color(0xFF7C2D12))
                                }
                            }
                        }

                        // Rejection Reason
                        if (!app.rejectionReason.isNullOrBlank()) {
                            Spacer(modifier = Modifier.height(12.dp))
                            Card(
                                colors = CardDefaults.cardColors(containerColor = Color(0xFFFEF2F2)),
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(10.dp)) {
                                    Text("Rejection Reason:", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = Color(0xFF991B1B))
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(app.rejectionReason!!, fontSize = 12.sp, color = Color(0xFF7F1D1D))
                                }
                            }
                        }

                        // Action when DOCUMENTS_REQUIRED: Document correction and resubmission
                        if (app.status == "DOCUMENTS_REQUIRED") {
                            Spacer(modifier = Modifier.height(16.dp))
                            Text("Document Correction & Resubmission", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            Spacer(modifier = Modifier.height(8.dp))

                            OutlinedTextField(
                                value = correctionNotes,
                                onValueChange = { correctionNotes = it },
                                label = { Text("Correction Notes for Reviewer") },
                                placeholder = { Text("e.g. Updated drug license document re-verified.") },
                                modifier = Modifier.fillMaxWidth()
                            )

                            Spacer(modifier = Modifier.height(10.dp))

                            Button(
                                onClick = {
                                    isResubmitting = true
                                    errorMessage = null
                                    coroutineScope.launch {
                                        try {
                                            val resubmitted = repository.submitOnboardingApplication(app.referenceNumber)
                                            application = resubmitted
                                            successMessage = "Application updated and resubmitted for verification!"
                                        } catch (e: Exception) {
                                            errorMessage = e.message ?: "Failed to resubmit application."
                                        } finally {
                                            isResubmitting = false
                                        }
                                    }
                                },
                                enabled = !isResubmitting,
                                colors = ButtonDefaults.buttonColors(containerColor = AmberPrimary),
                                shape = RoundedCornerShape(10.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text(if (isResubmitting) "Resubmitting..." else "Re-Submit Application for Review ➔", fontWeight = FontWeight.Bold)
                            }
                        }

                        // Action when APPROVED
                        if (app.status == "APPROVED" || app.status == "ACTIVE") {
                            Spacer(modifier = Modifier.height(16.dp))
                            Button(
                                onClick = onApproved,
                                colors = ButtonDefaults.buttonColors(containerColor = ForestGreen),
                                shape = RoundedCornerShape(10.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Color.White)
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Launch Merchant Console", fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }
    }
}
