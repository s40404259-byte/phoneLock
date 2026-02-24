package com.phone.lock.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun PaymentSuccessScreen(
  contentPadding: PaddingValues,
  onBackToDashboard: () -> Unit,
) {
  Column(
    modifier = Modifier
      .fillMaxSize()
      .padding(contentPadding)
      .padding(24.dp),
    verticalArrangement = Arrangement.Center,
    horizontalAlignment = Alignment.CenterHorizontally,
  ) {
    Text("Payment Received", style = MaterialTheme.typography.headlineSmall)
    Text("Device unlocked successfully.", modifier = Modifier.padding(vertical = 8.dp))
    Button(onClick = onBackToDashboard) {
      Text("Back to Dashboard")
    }
  }
}
