package com.phone.lock.ui

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow

data class PhoneLockUiState(
  val imei: String = "353567890123456",
  val emiAmount: String = "₹2,500",
  val nextDueDate: String = "05 Mar 2026",
  val totalPaid: String = "₹5,000",
  val lockStage: Int = 0,
  val isLocked: Boolean = false,
)

class PhoneLockViewModel {
  private val _uiState = MutableStateFlow(PhoneLockUiState())
  val uiState = _uiState.asStateFlow()

  fun markOverdue() {
    _uiState.value = _uiState.value.copy(lockStage = 2, isLocked = true)
  }

  fun markPaid() {
    _uiState.value = _uiState.value.copy(lockStage = 0, isLocked = false)
  }
}
