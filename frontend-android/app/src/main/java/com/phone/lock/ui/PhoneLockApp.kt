package com.phone.lock.ui

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.phone.lock.ui.screens.DashboardScreen
import com.phone.lock.ui.screens.LockOverlayScreen
import com.phone.lock.ui.screens.PaymentSuccessScreen
import com.phone.lock.ui.screens.routes

@Composable
fun PhoneLockApp(modifier: Modifier = Modifier) {
  val navController = rememberNavController()
  val viewModel = remember { PhoneLockViewModel() }
  val state by viewModel.uiState.collectAsStateWithLifecycle()
  val snackbarHostState = remember { SnackbarHostState() }

  Scaffold(
    modifier = modifier,
    snackbarHost = { SnackbarHost(hostState = snackbarHostState) },
    containerColor = MaterialTheme.colorScheme.background
  ) { padding ->
    NavHost(
      navController = navController,
      startDestination = routes.DASHBOARD,
    ) {
      composable(routes.DASHBOARD) {
        DashboardScreen(
          state = state,
          contentPadding = padding,
          onSimulateOverdue = {
            viewModel.markOverdue()
            navController.navigate(routes.LOCK_OVERLAY)
          },
          onPayNow = { navController.navigate(routes.LOCK_OVERLAY) }
        )
      }
      composable(routes.LOCK_OVERLAY) {
        LockOverlayScreen(
          state = state,
          contentPadding = padding,
          onPaid = {
            viewModel.markPaid()
            navController.navigate(routes.PAYMENT_SUCCESS)
          }
        )
      }
      composable(routes.PAYMENT_SUCCESS) {
        PaymentSuccessScreen(
          contentPadding = padding,
          onBackToDashboard = {
            navController.navigate(routes.DASHBOARD) {
              popUpTo(routes.DASHBOARD) { inclusive = true }
            }
          }
        )
      }
    }
  }
}
