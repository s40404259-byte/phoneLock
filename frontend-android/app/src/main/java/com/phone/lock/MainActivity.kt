package com.phone.lock

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import com.phone.lock.ui.PhoneLockApp
import com.phone.lock.ui.theme.PhoneLockTheme

class MainActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContent {
      PhoneLockTheme {
        PhoneLockApp()
      }
    }
  }
}
