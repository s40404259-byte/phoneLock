package com.phone.lock.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.phone.lock.ui.PhoneLockUiState
import com.phone.lock.ui.components.InfoCard

@Composable
fun DashboardScreen(
  state: PhoneLockUiState,
  contentPadding: PaddingValues,
  onSimulateOverdue: () -> Unit,
  onPayNow: () -> Unit,
) {
  Column(
    modifier = Modifier
      .fillMaxSize()
      .padding(contentPadding)
      .padding(16.dp),
    verticalArrangement = Arrangement.spacedBy(12.dp)
  ) {
    Text("EMI Device Dashboard", style = MaterialTheme.typography.headlineSmall)
    InfoCard("Device IMEI", state.imei)
    InfoCard("Monthly EMI", state.emiAmount)
    InfoCard("Next Due Date", state.nextDueDate)
    InfoCard("Total Paid", state.totalPaid)

    Text(
      text = if (state.isLocked) "Status: Locked (Stage ${state.lockStage})" else "Status: Active",
      style = MaterialTheme.typography.bodyLarge
    )

    Button(onClick = onPayNow) {
      Text("Open Lock Overlay")
    }

    OutlinedButton(onClick = onSimulateOverdue) {
      Text("Simulate Overdue Lock")
    }
  }
}
