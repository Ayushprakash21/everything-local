package com.ayushp0021.everythinglocal.core.common

sealed interface NetworkResult<out T> {
    data class Success<out T>(val data: T) : NetworkResult<T>
    data class Error(val message: String, val code: Int? = null, val throwable: Throwable? = null) : NetworkResult<Nothing>
    object Loading : NetworkResult<Nothing>
}
