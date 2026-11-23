package com.ayushp0021.everythinglocal.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.ayushp0021.everythinglocal.core.common.Formatters
import com.ayushp0021.everythinglocal.core.designsystem.*
import com.ayushp0021.everythinglocal.core.models.Product
import com.ayushp0021.everythinglocal.core.models.Store

@Composable
fun HomeScreen(
    viewModel: CustomerViewModel,
    onNavigateToSearch: () -> Unit,
    onNavigateToCart: () -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    var showLocationDialog by remember { mutableStateOf(false) }
    var selectedProduct by remember { mutableStateOf<Product?>(null) }
    var selectedStore by remember { mutableStateOf<Store?>(null) }

    val categories = listOf(
        CategoryItem("all", "All Stores", Icons.Default.Storefront, Color(0xFFFEF3C7), AmberDark),
        CategoryItem("grocery", "Kirana", Icons.Default.ShoppingBag, Color(0xFFDCFCE7), ForestGreenMedium),
        CategoryItem("produce", "Fruits & Veg", Icons.Default.Eco, Color(0xFFFEF9C3), Color(0xFFCA8A04)),
        CategoryItem("bakery", "Bakery & Milk", Icons.Default.BakeryDining, Color(0xFFFFEDD5), Color(0xFFEA580C)),
        CategoryItem("snacks", "Snacks & Drinks", Icons.Default.Fastfood, Color(0xFFFCE7F3), Color(0xFFDB2777)),
        CategoryItem("pharmacy", "Medicines", Icons.Default.LocalPharmacy, Color(0xFFE0E7FF), Color(0xFF4F46E5)),
        CategoryItem("personal_care", "Personal Care", Icons.Default.Spa, Color(0xFFF3E8FF), Color(0xFF9333EA)),
        CategoryItem("electronics", "Electronics", Icons.Default.Devices, Color(0xFFE0F2FE), Color(0xFF0284C7))
    )

    Scaffold(
        topBar = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color.White)
                    .padding(horizontal = 16.dp, vertical = 10.dp)
            ) {
                // Official Customer Brand Logo & Cart Icon
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    CustomerBrandLogo(variant = LogoVariant.COMPACT)

                    IconButton(
                        onClick = onNavigateToCart,
                        modifier = Modifier
                            .background(AmberLight, RoundedCornerShape(10.dp))
                            .size(38.dp)
                    ) {
                        BadgedBox(
                            badge = {
                                if (state.cart.items.isNotEmpty()) {
                                    Badge(containerColor = ForestGreen) {
                                        Text("${state.cart.items.size}")
                                    }
                                }
                            }
                        ) {
                            Icon(Icons.Default.ShoppingCart, contentDescription = "Cart", tint = AmberDark)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                // Location & ETA row
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { showLocationDialog = true },
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(32.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(ForestGreenLight),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.LocationOn, contentDescription = null, tint = ForestGreen, modifier = Modifier.size(18.dp))
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "Delivery in 15–20 Mins",
                                fontWeight = FontWeight.ExtraBold,
                                fontSize = 13.sp,
                                color = TextDark
                            )
                            Icon(Icons.Default.KeyboardArrowDown, contentDescription = null, tint = TextMuted, modifier = Modifier.size(16.dp))
                        }
                        Text(
                            text = state.selectedNeighborhood,
                            fontSize = 11.sp,
                            color = TextMuted,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                // Search Bar Trigger
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(44.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(SurfaceOffWhite)
                        .clickable { onNavigateToSearch() }
                        .padding(horizontal = 12.dp),
                    contentAlignment = Alignment.CenterStart
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Search, contentDescription = null, tint = TextMuted)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Search groceries, medicines, electronics...",
                            color = TextMuted,
                            fontSize = 13.sp
                        )
                    }
                }
            }
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .background(SurfaceOffWhite)
        ) {
            // Backend Connectivity Warning Banner
            if (state.errorMessage != null) {
                item {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color(0xFFFEF2F2)),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 8.dp)
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.CloudOff, contentDescription = null, tint = Color(0xFFDC2626), modifier = Modifier.size(18.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Backend Connectivity Alert", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = Color(0xFF991B1B))
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(state.errorMessage ?: "Server is unavailable.", fontSize = 11.sp, color = Color(0xFF7F1D1D))
                            Spacer(modifier = Modifier.height(8.dp))
                            Button(
                                onClick = { viewModel.loadHomeData() },
                                colors = ButtonDefaults.buttonColors(containerColor = ForestGreen),
                                shape = RoundedCornerShape(8.dp),
                                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                            ) {
                                Icon(Icons.Default.Refresh, contentDescription = null, modifier = Modifier.size(14.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Retry Connection", fontSize = 11.sp)
                            }
                        }
                    }
                }
            }

            // Promotional Banner
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(
                            Brush.horizontalGradient(
                                colors = listOf(ForestGreen, Color(0xFF047857))
                            )
                        )
                        .padding(16.dp)
                ) {
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .background(AmberPrimary, RoundedCornerShape(4.dp))
                                    .padding(horizontal = 6.dp, vertical = 2.dp)
                            ) {
                                Text("EVERYDAY ESSENTIALS", fontWeight = FontWeight.Bold, fontSize = 10.sp, color = TextDark)
                            }
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("⚡ Express Local Delivery", color = AmberLight, fontSize = 12.sp)
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            "Fresh Vegetables & Kirana\nDirect from Local Stores",
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 17.sp,
                            lineHeight = 22.sp
                        )
                    }
                }
            }

            // Category Bar
            item {
                Text(
                    text = "Explore Categories",
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp,
                    color = TextDark,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)
                )

                LazyRow(
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(categories) { cat ->
                        CategoryTile(
                            title = cat.label,
                            icon = cat.icon,
                            backgroundColor = cat.bg,
                            iconTint = cat.tint,
                            isSelected = state.selectedCategory == cat.id,
                            onClick = { viewModel.selectCategory(cat.id) }
                        )
                    }
                }
            }

            // Popular Products
            if (state.popularProducts.isNotEmpty()) {
                item {
                    Spacer(modifier = Modifier.height(10.dp))
                    Text(
                        text = "Popular Near You",
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp,
                        color = TextDark,
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)
                    )

                    LazyRow(
                        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(state.popularProducts) { product ->
                            val cartItem = state.cart.items.find { it.productId == product.id }
                            ProductCard(
                                product = product,
                                cartQuantity = cartItem?.quantity ?: 0,
                                onAdd = {
                                    val sId = product.storeId.ifBlank { product.store?.id ?: "" }
                                    if (sId.isNotBlank()) viewModel.addToCart(sId, product.id)
                                },
                                onIncrement = {
                                    val sId = product.storeId.ifBlank { product.store?.id ?: "" }
                                    if (sId.isNotBlank()) viewModel.addToCart(sId, product.id)
                                },
                                onDecrement = {
                                    cartItem?.let { viewModel.removeFromCart(it.id) }
                                },
                                onClick = {
                                    selectedProduct = product
                                },
                                modifier = Modifier.width(160.dp)
                            )
                        }
                    }
                }
            }

            // Neighborhood Stores List
            item {
                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    text = "Neighborhood Stores (${state.stores.size})",
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp,
                    color = TextDark,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)
                )
            }

            items(state.stores) { store ->
                StoreItemCard(
                    store = store,
                    onAddToCart = { prodId ->
                        viewModel.addToCart(store.id, prodId)
                    },
                    onClick = {
                        selectedStore = store
                    }
                )
            }

            item {
                Spacer(modifier = Modifier.height(80.dp))
            }
        }
    }

    // Location Picker Dialog
    if (showLocationDialog) {
        LocationSelectorDialog(
            current = state.selectedNeighborhood,
            onDismiss = { showLocationDialog = false },
            onSelect = { name, lat, lng ->
                viewModel.setNeighborhood(name, lat, lng)
                showLocationDialog = false
            }
        )
    }

    // Product Detail Bottom Sheet / Modal
    selectedProduct?.let { prod ->
        val cartItem = state.cart.items.find { it.productId == prod.id }
        AlertDialog(
            onDismissRequest = { selectedProduct = null },
            title = {
                Text(prod.name, fontWeight = FontWeight.Bold, fontSize = 16.sp)
            },
            text = {
                Column {
                    if (!prod.imageUrl.isNullOrBlank()) {
                        AsyncImage(
                            model = prod.imageUrl,
                            contentDescription = prod.name,
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(160.dp)
                                .clip(RoundedCornerShape(12.dp)),
                            contentScale = ContentScale.Crop
                        )
                        Spacer(modifier = Modifier.height(10.dp))
                    }
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            Formatters.formatPaise(prod.pricePaise),
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 18.sp,
                            color = ForestGreen
                        )
                        if (prod.mrpPaise > prod.pricePaise) {
                            Text(
                                "MRP: ${Formatters.formatPaise(prod.mrpPaise)}",
                                fontSize = 12.sp,
                                color = TextMuted
                            )
                        }
                    }
                    if (!prod.packageSize.isNullOrBlank()) {
                        Text("Pack Size: ${prod.packageSize}", fontSize = 12.sp, color = TextMuted)
                    }
                    if (!prod.brand.isNullOrBlank()) {
                        Text("Brand: ${prod.brand}", fontSize = 12.sp, color = TextMuted)
                    }
                    prod.store?.let { s ->
                        Spacer(modifier = Modifier.height(4.dp))
                        Text("Sold by: ${s.name} (${s.addressLine})", fontSize = 11.sp, color = ForestGreen, fontWeight = FontWeight.SemiBold)
                    }
                }
            },
            confirmButton = {
                val sId = prod.storeId.ifBlank { prod.store?.id ?: "" }
                Button(
                    onClick = {
                        if (sId.isNotBlank()) {
                            viewModel.addToCart(sId, prod.id)
                        }
                        selectedProduct = null
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = ForestGreen),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text(if (cartItem != null) "Add Another (${cartItem.quantity} in Cart)" else "Add to Cart ➔")
                }
            },
            dismissButton = {
                TextButton(onClick = { selectedProduct = null }) { Text("Close") }
            }
        )
    }

    // Store Catalogue Modal
    selectedStore?.let { store ->
        AlertDialog(
            onDismissRequest = { selectedStore = null },
            title = {
                Column {
                    Text(store.name, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    Text("${store.category.replaceFirstChar { it.uppercase() }} • ${store.addressLine}", fontSize = 11.sp, color = TextMuted)
                }
            },
            text = {
                Column(modifier = Modifier.fillMaxWidth()) {
                    Text("Store Inventory (${store.sampleProducts.size} Items):", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                    Spacer(modifier = Modifier.height(8.dp))
                    if (store.sampleProducts.isEmpty()) {
                        Text("No items currently available from this store.", fontSize = 12.sp, color = TextMuted)
                    } else {
                        store.sampleProducts.forEach { item ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 4.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(item.name, fontSize = 13.sp, fontWeight = FontWeight.Medium)
                                    Text(Formatters.formatPaise(item.pricePaise), fontSize = 12.sp, color = ForestGreen, fontWeight = FontWeight.Bold)
                                }
                                Button(
                                    onClick = {
                                        viewModel.addToCart(store.id, item.id)
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = ForestGreen),
                                    shape = RoundedCornerShape(8.dp),
                                    contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp)
                                ) {
                                    Text("Add", fontSize = 11.sp)
                                }
                            }
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { selectedStore = null }) { Text("Close") }
            }
        )
    }
}

data class CategoryItem(
    val id: String,
    val label: String,
    val icon: androidx.compose.ui.graphics.vector.ImageVector,
    val bg: Color,
    val tint: Color
)

@Composable
fun StoreItemCard(
    store: Store,
    onAddToCart: (String) -> Unit,
    onClick: () -> Unit = {}
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 6.dp)
            .clickable { onClick() },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = store.name,
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp,
                            color = TextDark
                        )
                        if (store.isVerified) {
                            Spacer(modifier = Modifier.width(4.dp))
                            Icon(Icons.Default.Verified, contentDescription = null, tint = ForestGreenMedium, modifier = Modifier.size(16.dp))
                        }
                    }
                    Text(
                        text = "${store.category.replaceFirstChar { it.uppercase() }} • ${store.addressLine}",
                        fontSize = 12.sp,
                        color = TextMuted
                    )
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier
                        .background(AmberLight, RoundedCornerShape(6.dp))
                        .padding(horizontal = 6.dp, vertical = 2.dp)
                ) {
                    Icon(Icons.Default.Star, contentDescription = null, tint = AmberDark, modifier = Modifier.size(14.dp))
                    Spacer(modifier = Modifier.width(2.dp))
                    Text("${store.rating}", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = TextDark)
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.NearMe, contentDescription = null, tint = ForestGreen, modifier = Modifier.size(14.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = Formatters.formatDistance(store.distanceKm),
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium,
                    color = ForestGreen
                )
                Spacer(modifier = Modifier.width(12.dp))
                Icon(Icons.Default.Schedule, contentDescription = null, tint = TextMuted, modifier = Modifier.size(14.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text("15–20 min", fontSize = 12.sp, color = TextMuted)
                Spacer(modifier = Modifier.weight(1f))
                Text("View Store ➔", fontSize = 11.sp, color = ForestGreen, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
fun LocationSelectorDialog(
    current: String,
    onDismiss: () -> Unit,
    onSelect: (String, Double, Double) -> Unit
) {
    val neighborhoods = listOf(
        Triple("Palasia, Indore", 22.7244, 75.8839),
        Triple("Vijay Nagar, Indore", 22.7533, 75.8937),
        Triple("Saket, Indore", 22.7196, 75.8988),
        Triple("Bhawarkua, Indore", 22.6926, 75.8676),
        Triple("Rajwada, Indore", 22.7187, 75.8554),
        Triple("Annapurna, Indore", 22.6983, 75.8398)
    )

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Select Delivery Location", fontWeight = FontWeight.Bold) },
        text = {
            Column {
                neighborhoods.forEach { (name, lat, lng) ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onSelect(name, lat, lng) }
                            .padding(vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        RadioButton(
                            selected = current == name,
                            onClick = { onSelect(name, lat, lng) },
                            colors = RadioButtonDefaults.colors(selectedColor = ForestGreen)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(name, fontSize = 14.sp)
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) { Text("Close") }
        }
    )
}
