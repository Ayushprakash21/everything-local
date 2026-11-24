package com.ayushp0021.everythinglocal.merchant.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.navigation.NavType
import androidx.navigation.compose.*
import androidx.navigation.navArgument
import com.ayushp0021.everythinglocal.core.designsystem.*
import com.ayushp0021.everythinglocal.merchant.ui.*

@Composable
fun MerchantApp(viewModel: MerchantViewModel) {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    val showBottomBar = currentRoute in listOf("dashboard", "inventory", "add_product")

    Scaffold(
        bottomBar = {
            if (showBottomBar) {
                NavigationBar(containerColor = Color.White, tonalElevation = 8.dp) {
                    NavigationBarItem(
                        icon = { Icon(Icons.Default.Dashboard, contentDescription = "Dashboard") },
                        label = { Text("Dashboard") },
                        selected = currentRoute == "dashboard",
                        onClick = {
                            navController.navigate("dashboard") {
                                popUpTo("dashboard") { saveState = true }
                                launchSingleTop = true
                                restoreState = true
                            }
                        },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = ForestGreen,
                            selectedTextColor = ForestGreen,
                            indicatorColor = ForestGreenLight
                        )
                    )
                    NavigationBarItem(
                        icon = { Icon(Icons.Default.Inventory2, contentDescription = "Inventory") },
                        label = { Text("Inventory") },
                        selected = currentRoute == "inventory",
                        onClick = {
                            navController.navigate("inventory") {
                                popUpTo("dashboard") { saveState = true }
                                launchSingleTop = true
                                restoreState = true
                            }
                        },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = ForestGreen,
                            selectedTextColor = ForestGreen,
                            indicatorColor = ForestGreenLight
                        )
                    )
                    NavigationBarItem(
                        icon = { Icon(Icons.Default.AddBox, contentDescription = "Add Product") },
                        label = { Text("Add Product") },
                        selected = currentRoute == "add_product",
                        onClick = {
                            navController.navigate("add_product") {
                                launchSingleTop = true
                            }
                        },
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
            startDestination = "dashboard",
            modifier = Modifier.padding(innerPadding)
        ) {
            composable("dashboard") {
                MerchantDashboardScreen(
                    viewModel = viewModel,
                    onNavigateToAddProduct = { navController.navigate("add_product") },
                    onNavigateToInventory = { navController.navigate("inventory") },
                    onNavigateToLogin = { navController.navigate("login") },
                    onNavigateToOnboarding = { navController.navigate("onboarding") },
                    onNavigateToTracking = { navController.navigate("tracking") }
                )
            }
            composable("inventory") {
                MerchantCatalogueScreen(
                    viewModel = viewModel,
                    onNavigateToAddProduct = { navController.navigate("add_product") }
                )
            }
            composable("add_product") {
                AddProductScreen(
                    viewModel = viewModel,
                    onOpenScanner = { navController.navigate("barcode_scanner") },
                    onSuccess = {
                        navController.navigate("inventory") {
                            popUpTo("dashboard")
                        }
                    },
                    onBack = { navController.popBackStack() }
                )
            }
            composable("barcode_scanner") {
                BarcodeScannerScreen(
                    onBarcodeDetected = { code ->
                        viewModel.onBarcodeScanned(code)
                        navController.popBackStack()
                    },
                    onBack = { navController.popBackStack() }
                )
            }
            composable("login") {
                MerchantLoginScreen(
                    viewModel = viewModel,
                    onLoginSuccess = {
                        navController.navigate("dashboard") {
                            popUpTo("dashboard") { inclusive = true }
                        }
                    },
                    onNavigateToOnboarding = { navController.navigate("onboarding") },
                    onNavigateToTracking = { navController.navigate("tracking") }
                )
            }
            composable("onboarding") {
                MerchantOnboardingScreen(
                    repository = viewModel.repository,
                    onBack = { navController.popBackStack() },
                    onOnboardingComplete = {
                        navController.navigate("dashboard") {
                            popUpTo("dashboard") { inclusive = true }
                        }
                    },
                    onNavigateToTracking = { ref ->
                        navController.navigate("tracking/$ref")
                    }
                )
            }
            composable("tracking") {
                MerchantApplicationTrackingScreen(
                    repository = viewModel.repository,
                    onBack = { navController.popBackStack() },
                    onApproved = {
                        navController.navigate("login") {
                            popUpTo("dashboard") { inclusive = true }
                        }
                    }
                )
            }
            composable(
                route = "tracking/{ref}",
                arguments = listOf(navArgument("ref") { type = NavType.StringType })
            ) { backStackEntry ->
                val ref = backStackEntry.arguments?.getString("ref") ?: ""
                MerchantApplicationTrackingScreen(
                    repository = viewModel.repository,
                    initialReference = ref,
                    onBack = { navController.popBackStack() },
                    onApproved = {
                        navController.navigate("login") {
                            popUpTo("dashboard") { inclusive = true }
                        }
                    }
                )
            }
        }
    }
}
