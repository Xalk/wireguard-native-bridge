package expo.modules.wireguardnativebridge

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.util.Log
import com.wireguard.android.backend.Backend
import com.wireguard.android.backend.BackendException
import com.wireguard.android.backend.GoBackend
import com.wireguard.android.backend.Tunnel
import com.wireguard.config.Config
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.StringReader

class WireguardNativeBridgeModule : Module() {
  private var backend: Backend? = null
  private var tunnel: Tunnel? = null
  private var config: Config? = null
  private val tunnelName = "wg0"
  
  private val VPN_REQUEST_CODE = 24601
  private var pendingPreparePromise: Promise? = null

  // Helper to get Context safely
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("WireguardNativeBridge")
    
    // We can emit events to JS (like "Tunnel UP")
    Events("onStatusChange")

    // 1. Initialization (Replaces your old 'init' block)
    OnCreate {
      try {
        backend = GoBackend(context)
        
        // Define the tunnel object once
        tunnel = object : Tunnel {
          override fun getName() = tunnelName
          override fun onStateChange(newState: Tunnel.State) {
            Log.d("WireGuard", "Tunnel state changed to: $newState")
            // Send event to JS
            sendEvent("onStatusChange", mapOf("status" to newState.toString()))
          }
        }
        
        Log.d("WireGuard", "Backend initialized successfully")
      } catch (e: Exception) {
        Log.e("WireGuard", "Failed to initialize WireGuard backend", e)
      }
    }

    // 2. Prepare VPN (Ask for permissions)
    AsyncFunction("prepareVPN") { promise: Promise ->
      val vpnIntent = android.net.VpnService.prepare(context)
      if (vpnIntent != null) {
        // Permission needed! Start the system activity
        pendingPreparePromise = promise
        appContext.currentActivity?.startActivityForResult(vpnIntent, VPN_REQUEST_CODE)
      } else {
        // Permission already granted
        promise.resolve("VPN permission already granted")
      }
    }

    // 3. Start Tunnel (Using your exact Config.parse logic)
    AsyncFunction("startTunnel") { configString: String, promise: Promise ->
      try {
        if (backend == null) throw Exception("Backend not initialized")

        Log.d("WireGuard", "Parsing WireGuard config...")
        
        // YOUR OLD LOGIC: Use StringReader to parse the config string directly
        val reader = java.io.BufferedReader(StringReader(configString))
        config = Config.parse(reader)
        
        Log.d("WireGuard", "Config parsed successfully")

        // Set state to UP
        backend?.setState(tunnel!!, Tunnel.State.UP, config)
        
        Log.d("WireGuard", "Tunnel started successfully")
        promise.resolve("Tunnel started successfully")
      } catch (e: BackendException) {
        Log.e("WireGuard", "Backend exception", e)
        promise.reject("ERROR_STARTING_TUNNEL", "Backend error: ${e.message}", e)
      } catch (e: Exception) {
        Log.e("WireGuard", "General exception", e)
        promise.reject("ERROR_STARTING_TUNNEL", e.message, e)
      }
    }

    // 4. Stop Tunnel
    AsyncFunction("stopTunnel") { promise: Promise ->
      try {
        if (tunnel != null && config != null) {
          backend?.setState(tunnel!!, Tunnel.State.DOWN, config)
          promise.resolve("Tunnel stopped")
        } else {
          promise.reject("DISCONNECT_ERROR", "Tunnel not initialized", null)
        }
      } catch (e: Exception) {
        promise.reject("DISCONNECT_ERROR", "Failed to disconnect: ${e.message}", e)
      }
    }

    // 5. Get Status
    AsyncFunction("getTunnelStatus") { promise: Promise ->
      try {
        if (tunnel == null) {
          promise.resolve("DOWN")
          return@AsyncFunction
        }
        val state = backend?.getState(tunnel!!)
        promise.resolve(state?.name ?: "DOWN")
      } catch (e: Exception) {
        promise.reject("ERROR_GETTING_TUNNEL_STATUS", e.message, e)
      }
    }

    // 6. Handle the Permission Result (New Expo Requirement)
    // This catches the result when the user clicks "Allow" or "Deny" on the VPN popup
    OnActivityResult { activity, (requestCode, resultCode, data) ->
      if (requestCode == VPN_REQUEST_CODE) {
        if (resultCode == Activity.RESULT_OK) {
          pendingPreparePromise?.resolve("VPN permission granted")
        } else {
          pendingPreparePromise?.reject("ERR_PERMISSION", "VPN permission denied by user", null)
        }
        pendingPreparePromise = null
      }
    }
  }
}