package com.ayushp0021.everythinglocal

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.ayushp0021.everythinglocal.core.authentication.SessionManager
import com.ayushp0021.everythinglocal.core.designsystem.EverythingLocalTheme
import com.ayushp0021.everythinglocal.data.CustomerRepository
import com.ayushp0021.everythinglocal.navigation.CustomerApp
import com.ayushp0021.everythinglocal.ui.CustomerViewModel

class MainActivity : ComponentActivity() {

    private val viewModel: CustomerViewModel by viewModels {
        object : ViewModelProvider.Factory {
            override fun <T : ViewModel> create(modelClass: Class<T>): T {
                val sessionManager = SessionManager(applicationContext)
                val repository = CustomerRepository(sessionManager)
                @Suppress("UNCHECKED_CAST")
                return CustomerViewModel(repository) as T
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            EverythingLocalTheme {
                CustomerApp(viewModel = viewModel)
            }
        }
    }
}
