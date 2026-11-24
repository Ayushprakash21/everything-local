package com.ayushp0021.everythinglocal.delivery.ui

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.ayushp0021.everythinglocal.delivery.theme.CourierAmberAccent
import com.ayushp0021.everythinglocal.delivery.theme.CourierBluePrimary
import com.ayushp0021.everythinglocal.delivery.ui.screens.*
import com.ayushp0021.everythinglocal.delivery.viewmodel.DeliveryViewModel

enum class DeliveryScreen {
    LOGIN,
    ONBOARDING,
    DASHBOARD,
    ACTIVE_TRIP,
    EARNINGS,
    PROFILE
}

@Composable
fun DeliveryApp(viewModel: DeliveryViewModel) {
    val state by viewModel.uiState.collectAsState()
    var currentScreen by remember {
        mutableStateOf(if (state.isLoggedIn) DeliveryScreen.DASHBOARD else DeliveryScreen.LOGIN)
    }
    var activeTripId by remember { mutableStateOf("") }

    Scaffold(
        bottomBar = {
            if (state.isLoggedIn && currentScreen != DeliveryScreen.LOGIN && currentScreen != DeliveryScreen.ONBOARDING) {
                NavigationBar(containerColor = Color.White) {
                    NavigationBarItem(
                        selected = currentScreen == DeliveryScreen.DASHBOARD,
                        onClick = { currentScreen = DeliveryScreen.DASHBOARD },
                        icon = { Icon(Icons.Default.ElectricBike, contentDescription = "Duty") },
                        label = { Text("Duty", fontSize = 11.sp, fontWeight = FontWeight.SemiBold) },
                        colors = NavigationBarItemDefaults.colors(selectedIconColor = CourierBluePrimary, indicatorColor = CourierAmberAccent.copy(alpha = 0.2f))
                    )
                    NavigationBarItem(
                        selected = currentScreen == DeliveryScreen.EARNINGS,
                        onClick = { currentScreen = DeliveryScreen.EARNINGS },
                        icon = { Icon(Icons.Default.AccountBalanceWallet, contentDescription = "Earnings") },
                        label = { Text("Earnings", fontSize = 11.sp, fontWeight = FontWeight.SemiBold) },
                        colors = NavigationBarItemDefaults.colors(selectedIconColor = CourierBluePrimary, indicatorColor = CourierAmberAccent.copy(alpha = 0.2f))
                    )
                    NavigationBarItem(
                        selected = currentScreen == DeliveryScreen.PROFILE,
                        onClick = { currentScreen = DeliveryScreen.PROFILE },
                        icon = { Icon(Icons.Default.Person, contentDescription = "Profile") },
                        label = { Text("Profile", fontSize = 11.sp, fontWeight = FontWeight.SemiBold) },
                        colors = NavigationBarItemDefaults.colors(selectedIconColor = CourierBluePrimary, indicatorColor = CourierAmberAccent.copy(alpha = 0.2f))
                    )
                }
            }
        }
    ) { padding ->
        Surface(modifier = Modifier.padding(padding)) {
            when (currentScreen) {
                DeliveryScreen.LOGIN -> DeliveryLoginScreen(
                    viewModel = viewModel,
                    onLoginSuccess = { currentScreen = DeliveryScreen.DASHBOARD },
                    onNavigateToOnboarding = { currentScreen = DeliveryScreen.ONBOARDING }
                )
                DeliveryScreen.ONBOARDING -> DeliveryOnboardingScreen(
                    viewModel = viewModel,
                    onComplete = { currentScreen = DeliveryScreen.DASHBOARD }
                )
                DeliveryScreen.DASHBOARD -> DeliveryDashboardScreen(
                    viewModel = viewModel,
                    onNavigateToActiveTrip = { taskId ->
                        activeTripId = taskId
                        currentScreen = DeliveryScreen.ACTIVE_TRIP
                    }
                )
                DeliveryScreen.ACTIVE_TRIP -> ActiveTripScreen(
                    taskId = activeTripId,
                    viewModel = viewModel,
                    onTripCompleted = { currentScreen = DeliveryScreen.DASHBOARD },
                    onBack = { currentScreen = DeliveryScreen.DASHBOARD }
                )
                DeliveryScreen.EARNINGS -> DeliveryEarningsScreen(
                    viewModel = viewModel
                )
                DeliveryScreen.PROFILE -> DeliveryProfileScreen(
                    viewModel = viewModel,
                    onLogout = { currentScreen = DeliveryScreen.LOGIN }
                )
            }
        }
    }
}
