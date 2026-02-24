package com.phone.lock.ui.screens

import androidx.compose.foundation.background
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.phone.lock.ui.PhoneLockUiState

@Composable
fun LockOverlayScreen(
  state: PhoneLockUiState,
  contentPadding: PaddingValues,
  onPaid: () -> Unit,
) {
  val message = if (state.isLocked) "EMI Overdue - Pay to Unlock" else "Pay current EMI"

  Column(
    modifier = Modifier
      .fillMaxSize()
      .background(Color(0xFFECEFF1))
      .padding(contentPadding)
      .padding(24.dp),
    horizontalAlignment = Alignment.CenterHorizontally,
    verticalArrangement = Arrangement.Center
  ) {
    Text(text = message, style = MaterialTheme.typography.headlineSmall)
    Text(text = "Emergency call access remains enabled", modifier = Modifier.padding(vertical = 12.dp))
    Button(onClick = onPaid) {
      Text("Mark Payment Success")
    }
  }
}
