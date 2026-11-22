package com.ayushp0021.everythinglocal.merchant

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.ayushp0021.everythinglocal.core.authentication.SessionManager
import com.ayushp0021.everythinglocal.core.designsystem.EverythingLocalTheme
import com.ayushp0021.everythinglocal.merchant.data.MerchantRepository
import com.ayushp0021.everythinglocal.merchant.navigation.MerchantApp
import com.ayushp0021.everythinglocal.merchant.ui.MerchantViewModel

class MainActivity : ComponentActivity() {

    private val viewModel: MerchantViewModel by viewModels {
        object : ViewModelProvider.Factory {
            override fun <T : ViewModel> create(modelClass: Class<T>): T {
                val sessionManager = SessionManager(applicationContext)
                val repository = MerchantRepository(applicationContext, sessionManager)
                @Suppress("UNCHECKED_CAST")
                return MerchantViewModel(repository) as T
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            EverythingLocalTheme {
                MerchantApp(viewModel = viewModel)
            }
        }
    }
}
