package com.ayushp0021.everythinglocal.core.authentication

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.map

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "everything_local_session")

class SessionManager(private val context: Context) {

    companion object {
        private val KEY_TOKEN = stringPreferencesKey("auth_token")
        private val KEY_USER_ID = stringPreferencesKey("user_id")
        private val KEY_USER_EMAIL = stringPreferencesKey("user_email")
        private val KEY_USER_NAME = stringPreferencesKey("user_name")
        private val KEY_USER_ROLE = stringPreferencesKey("user_role")
        private val KEY_STORE_ID = stringPreferencesKey("store_id")
    }

    val tokenFlow: Flow<String?> = context.dataStore.data.map { prefs -> prefs[KEY_TOKEN] }
    val userRoleFlow: Flow<String?> = context.dataStore.data.map { prefs -> prefs[KEY_USER_ROLE] }
    val storeIdFlow: Flow<String?> = context.dataStore.data.map { prefs -> prefs[KEY_STORE_ID] }
    val userNameFlow: Flow<String?> = context.dataStore.data.map { prefs -> prefs[KEY_USER_NAME] }

    suspend fun saveSession(
        token: String,
        userId: String,
        email: String,
        name: String,
        role: String,
        storeId: String? = null
    ) {
        context.dataStore.edit { prefs ->
            prefs[KEY_TOKEN] = token
            prefs[KEY_USER_ID] = userId
            prefs[KEY_USER_EMAIL] = email
            prefs[KEY_USER_NAME] = name
            prefs[KEY_USER_ROLE] = role
            if (storeId != null) {
                prefs[KEY_STORE_ID] = storeId
            } else {
                prefs.remove(KEY_STORE_ID)
            }
        }
    }

    suspend fun getToken(): String? {
        return context.dataStore.data.map { it[KEY_TOKEN] }.firstOrNull()
    }

    suspend fun getStoreId(): String? {
        return context.dataStore.data.map { it[KEY_STORE_ID] }.firstOrNull()
    }

    suspend fun clearSession() {
        context.dataStore.edit { it.clear() }
    }
}
