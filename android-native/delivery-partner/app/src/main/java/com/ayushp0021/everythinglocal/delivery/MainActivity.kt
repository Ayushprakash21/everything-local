package com.ayushp0021.everythinglocal.delivery

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.ayushp0021.everythinglocal.core.authentication.SessionManager
import com.ayushp0021.everythinglocal.delivery.data.DeliveryRepository
import com.ayushp0021.everythinglocal.delivery.theme.DeliveryPartnerTheme
import com.ayushp0021.everythinglocal.delivery.ui.DeliveryApp
import com.ayushp0021.everythinglocal.delivery.viewmodel.DeliveryViewModel

class MainActivity : ComponentActivity() {

    private val viewModel: DeliveryViewModel by viewModels {
        object : ViewModelProvider.Factory {
            override fun <T : ViewModel> create(modelClass: Class<T>): T {
                val sessionManager = SessionManager(applicationContext)
                val repository = DeliveryRepository(applicationContext, sessionManager)
                @Suppress("UNCHECKED_CAST")
                return DeliveryViewModel(repository) as T
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            DeliveryPartnerTheme {
                DeliveryApp(viewModel = viewModel)
            }
        }
    }
}
