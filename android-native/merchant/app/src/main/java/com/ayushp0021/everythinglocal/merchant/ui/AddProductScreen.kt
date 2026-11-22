package com.ayushp0021.everythinglocal.merchant.ui

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.ayushp0021.everythinglocal.core.designsystem.*

@Composable
fun AddProductScreen(
    viewModel: MerchantViewModel,
    onOpenScanner: () -> Unit,
    onSuccess: () -> Unit,
    onBack: () -> Unit
) {
    val state by viewModel.uiState.collectAsState()

    var name by remember { mutableStateOf("") }
    var brand by remember { mutableStateOf("") }
    var packageSize by remember { mutableStateOf("") }
    var category by remember { mutableStateOf("grocery") }
    var mrpText by remember { mutableStateOf("") }
    var priceText by remember { mutableStateOf("") }
    var stockText by remember { mutableStateOf("10") }
    var manualBarcode by remember { mutableStateOf("") }

    // Pre-populate if lookupMatch changes
    LaunchedEffect(state.lookupMatch) {
        state.lookupMatch?.let { match ->
            name = match.name
            brand = match.brand ?: ""
            packageSize = match.packageSize ?: ""
            category = match.category
            if (match.mrpPaise > 0) mrpText = (match.mrpPaise / 100.0).toString()
            if (match.pricePaise > 0) priceText = (match.pricePaise / 100.0).toString()
        }
    }

    LaunchedEffect(state.scannedBarcode) {
        state.scannedBarcode?.let {
            manualBarcode = it
        }
    }

    // Photo Picker launcher
    val photoPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let { viewModel.uploadProductImage(it) }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Add Store Product", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .background(SurfaceOffWhite)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Barcode Section
            item {
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Text("1. Barcode / GTIN Identification", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        Spacer(modifier = Modifier.height(8.dp))
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedTextField(
                                value = manualBarcode,
                                onValueChange = { manualBarcode = it },
                                placeholder = { Text("EAN-13, EAN-8 or UPC") },
                                modifier = Modifier.weight(1f),
                                singleLine = true,
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                            )
                            Button(
                                onClick = {
                                    if (manualBarcode.isNotBlank()) {
                                        viewModel.onBarcodeScanned(manualBarcode.trim())
                                    }
                                },
                                shape = RoundedCornerShape(10.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = AmberPrimary)
                            ) {
                                Text("Lookup", color = TextDark, fontWeight = FontWeight.Bold)
                            }
                        }
                        Spacer(modifier = Modifier.height(10.dp))
                        OutlinedButton(
                            onClick = onOpenScanner,
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Icon(Icons.Default.QrCodeScanner, contentDescription = null, tint = ForestGreen)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Open Live Camera Barcode Scanner", color = ForestGreen, fontWeight = FontWeight.SemiBold)
                        }

                        state.statusMessage?.let {
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(it, fontSize = 12.sp, color = ForestGreenMedium, fontWeight = FontWeight.Medium)
                        }
                    }
                }
            }

            // Image Upload Section
            item {
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Text("2. Product Image", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        Spacer(modifier = Modifier.height(8.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(80.dp)
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(Color(0xFFF1F5F9))
                                    .clickable { photoPickerLauncher.launch("image/*") },
                                contentAlignment = Alignment.Center
                            ) {
                                if (!state.uploadedImageUrl.isNullOrBlank()) {
                                    AsyncImage(
                                        model = state.uploadedImageUrl,
                                        contentDescription = "Uploaded",
                                        modifier = Modifier.fillMaxSize(),
                                        contentScale = ContentScale.Crop
                                    )
                                } else {
                                    Icon(Icons.Default.AddPhotoAlternate, contentDescription = null, tint = TextMuted)
                                }
                            }
                            Spacer(modifier = Modifier.width(14.dp))
                            Column {
                                Button(
                                    onClick = { photoPickerLauncher.launch("image/*") },
                                    shape = RoundedCornerShape(8.dp),
                                    colors = ButtonDefaults.buttonColors(containerColor = ForestGreenLight, contentColor = ForestGreen),
                                    modifier = Modifier.border(1.dp, ForestGreenMedium, RoundedCornerShape(8.dp))
                                ) {
                                    Text("Pick from Gallery / Camera", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                }
                                Text("Uploaded directly to server media storage", fontSize = 11.sp, color = TextMuted)
                            }
                        }
                    }
                }
            }

            // Product Details Form
            item {
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text("3. Product Details", fontWeight = FontWeight.Bold, fontSize = 14.sp)

                        OutlinedTextField(
                            value = name,
                            onValueChange = { name = it },
                            label = { Text("Product Name *") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedTextField(
                                value = brand,
                                onValueChange = { brand = it },
                                label = { Text("Brand") },
                                modifier = Modifier.weight(1f),
                                singleLine = true
                            )
                            OutlinedTextField(
                                value = packageSize,
                                onValueChange = { packageSize = it },
                                label = { Text("Pack Size (e.g. 1 kg)") },
                                modifier = Modifier.weight(1f),
                                singleLine = true
                            )
                        }

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedTextField(
                                value = mrpText,
                                onValueChange = { mrpText = it },
                                label = { Text("MRP (₹)") },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                                modifier = Modifier.weight(1f),
                                singleLine = true
                            )
                            OutlinedTextField(
                                value = priceText,
                                onValueChange = { priceText = it },
                                label = { Text("Selling Price (₹) *") },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                                modifier = Modifier.weight(1f),
                                singleLine = true
                            )
                        }

                        OutlinedTextField(
                            value = stockText,
                            onValueChange = { stockText = it },
                            label = { Text("Available Stock Units *") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )
                    }
                }
            }

            // Save CTA
            item {
                Button(
                    onClick = {
                        val mrpPaise = ((mrpText.toDoubleOrNull() ?: 0.0) * 100).toInt()
                        val pricePaise = ((priceText.toDoubleOrNull() ?: 0.0) * 100).toInt()
                        val stock = stockText.toIntOrNull() ?: 0

                        if (name.isNotBlank() && pricePaise > 0) {
                            viewModel.saveProduct(
                                name = name,
                                category = category,
                                mrpPaise = if (mrpPaise > 0) mrpPaise else pricePaise,
                                pricePaise = pricePaise,
                                stock = stock,
                                brand = brand.ifBlank { null },
                                packageSize = packageSize.ifBlank { null },
                                barcode = manualBarcode.ifBlank { null },
                                onSuccess = onSuccess
                            )
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = ForestGreen)
                ) {
                    Text("Save to Store Catalogue ➔", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                }
                Spacer(modifier = Modifier.height(20.dp))
            }
        }
    }
}
