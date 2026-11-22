package com.ayushp0021.everythinglocal.navigation

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
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
import androidx.navigation.compose.*
import com.ayushp0021.everythinglocal.core.common.Formatters
import com.ayushp0021.everythinglocal.core.designsystem.*
import com.ayushp0021.everythinglocal.ui.*

@Composable
fun CustomerApp(viewModel: CustomerViewModel) {
    val navController = rememberNavController()
    val state by viewModel.uiState.collectAsState()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    Scaffold(
        bottomBar = {
            Column {
                // Floating Cart Bar when cart has items and not on cart screen
                if (state.cart.items.isNotEmpty() && currentRoute != "cart") {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 6.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(ForestGreen)
                            .clickable { navController.navigate("cart") }
                            .padding(horizontal = 16.dp, vertical = 10.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.ShoppingCart, contentDescription = null, tint = Color.White)
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    "${state.cart.items.size} items • ${Formatters.formatPaise(state.cart.subtotalPaise)}",
                                    color = Color.White,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 14.sp
                                )
                            }
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text("View Cart", color = AmberLight, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                Icon(Icons.Default.ArrowForward, contentDescription = null, tint = AmberLight, modifier = Modifier.size(16.dp))
                            }
                        }
                    }
                }

                // Bottom Navigation Bar
                NavigationBar(containerColor = Color.White, tonalElevation = 8.dp) {
                    NavigationBarItem(
                        icon = { Icon(Icons.Default.Home, contentDescription = "Home") },
                        label = { Text("Home") },
                        selected = currentRoute == "home",
                        onClick = { navController.navigate("home") },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = ForestGreen,
                            selectedTextColor = ForestGreen,
                            indicatorColor = ForestGreenLight
                        )
                    )
                    NavigationBarItem(
                        icon = { Icon(Icons.Default.Search, contentDescription = "Search") },
                        label = { Text("Search") },
                        selected = currentRoute == "search",
                        onClick = { navController.navigate("search") },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = ForestGreen,
                            selectedTextColor = ForestGreen,
                            indicatorColor = ForestGreenLight
                        )
                    )
                    NavigationBarItem(
                        icon = { Icon(Icons.Default.ReceiptLong, contentDescription = "Orders") },
                        label = { Text("Orders") },
                        selected = currentRoute == "orders",
                        onClick = { navController.navigate("orders") },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = ForestGreen,
                            selectedTextColor = ForestGreen,
                            indicatorColor = ForestGreenLight
                        )
                    )
                    NavigationBarItem(
                        icon = { Icon(Icons.Default.Person, contentDescription = "Account") },
                        label = { Text("Account") },
                        selected = currentRoute == "profile",
                        onClick = { navController.navigate("profile") },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = ForestGreen,
                            selectedTextColor = ForestGreen,
                            indicatorColor = ForestGreenLight
                        )
                    )
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = "home",
            modifier = Modifier.padding(innerPadding)
        ) {
            composable("home") {
                HomeScreen(
                    viewModel = viewModel,
                    onNavigateToSearch = { navController.navigate("search") },
                    onNavigateToCart = { navController.navigate("cart") }
                )
            }
            composable("search") {
                SearchScreen(
                    viewModel = viewModel,
                    onBack = { navController.popBackStack() }
                )
            }
            composable("cart") {
                CartScreen(
                    viewModel = viewModel,
                    onCheckoutSuccess = {
                        navController.navigate("orders") {
                            popUpTo("home")
                        }
                    },
                    onBack = { navController.popBackStack() }
                )
            }
            composable("orders") {
                OrdersScreen(viewModel = viewModel)
            }
            composable("profile") {
                ProfileScreen(viewModel = viewModel)
            }
        }
    }
}
