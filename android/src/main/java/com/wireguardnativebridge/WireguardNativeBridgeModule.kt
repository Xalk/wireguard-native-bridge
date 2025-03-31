package com.wireguardnativebridge

import android.content.Context
import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.wireguard.android.backend.Backend
import com.wireguard.android.backend.BackendException
import com.wireguard.android.backend.GoBackend
import com.wireguard.android.backend.Tunnel
import com.wireguard.config.Config
import java.io.StringReader

class WireguardNativeBridgeModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

    private lateinit var backend: Backend
    private val tunnelName = "wg0"
    private var tunnel: Tunnel? = null
    private var config: Config? = null


 init {
        try {
            backend = GoBackend(reactApplicationContext)
            if (!android.net.VpnService.prepare(reactContext).equals(null)) {
                Log.w(NAME, "VPN permission not yet granted")
            }
        } catch (e: Exception) {
            Log.e(NAME, "Failed to initialize WireGuard backend", e)
        }
    }

    override fun getName(): String = NAME

      @ReactMethod
      fun prepareVPN(promise: Promise) {
          val vpnIntent = android.net.VpnService.prepare(reactContext)
          if (vpnIntent != null) {
              val currentActivity = currentActivity
              if (currentActivity != null) {
                  currentActivity.startActivityForResult(vpnIntent, VPN_REQUEST_CODE)
                  promise.resolve("VPN permission requested")
              } else {
                  promise.reject("ERROR_NO_ACTIVITY", "No activity available to request VPN permission")
              }
          } else {
              promise.resolve("VPN permission already granted")
          }
      }

      @ReactMethod
      fun startTunnel(configString: String, promise: Promise) {
          try {
              Log.d(NAME, "Parsing WireGuard config...")
              val reader = java.io.BufferedReader(StringReader(configString))
              this.config = Config.parse(reader)
              Log.d(NAME, "Config parsed successfully")

              this.tunnel = object : Tunnel {
                  override fun getName(): String = tunnelName
                  override fun onStateChange(newState: Tunnel.State) {
                      Log.d(NAME, "Tunnel state changed to: $newState")
                  }
              }

              backend.setState(tunnel, Tunnel.State.UP, config)
              Log.d(NAME, "Tunnel started successfully")
              promise.resolve("Tunnel started successfully")
          } catch (e: BackendException) {
              Log.e(NAME, "Backend exception", e)
              promise.reject("ERROR_STARTING_TUNNEL", "Backend error: ${e.message}", e)
          } catch (e: Exception) {
              Log.e(NAME, "General exception", e)
              promise.reject("ERROR_STARTING_TUNNEL", e.message, e)
          }
      }

    @ReactMethod
    fun stopTunnel(promise: Promise) {
        try {
            if (tunnel != null && config != null) {
                backend.setState(tunnel!!, Tunnel.State.DOWN, config!!)
                promise.resolve(null)
            } else {
                promise.reject("DISCONNECT_ERROR", "Tunnel not initialized")
            }
        } catch (e: Exception) {
            promise.reject("DISCONNECT_ERROR", "Failed to disconnect: ${e.message}")
        }
    }

    @ReactMethod
    fun getTunnelStatus(promise: Promise) {
        try {
            this.tunnel = object : Tunnel {
                override fun getName(): String = tunnelName
                override fun onStateChange(newState: Tunnel.State) {}
            }

            val state = backend.getState(tunnel)
            promise.resolve(state.name)
        } catch (e: BackendException) {
            promise.reject("ERROR_GETTING_TUNNEL_STATUS", "Backend error: ${e.message}", e)
        } catch (e: Exception) {
            promise.reject("ERROR_GETTING_TUNNEL_STATUS", e.message, e)
        }
    }

  companion object {
    const val NAME = "WireguardNativeBridge"
    const val VPN_REQUEST_CODE = 24601
  }
}
