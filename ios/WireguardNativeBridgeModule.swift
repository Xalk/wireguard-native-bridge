import ExpoModulesCore
import NetworkExtension

public class WireguardNativeBridgeModule: Module {
  private var tunnel: NETunnelProviderManager?

  public func definition() -> ModuleDefinition {
    Name("WireguardNativeBridge")

    // Android only — on iOS the tunnel auto-initializes inside startTunnel
    AsyncFunction("prepareVPN") { (promise: Promise) in
      NETunnelProviderManager.loadAllFromPreferences { [weak self] (managers, error) in
        if let error = error {
          promise.reject("ERROR_LOADING_VPN", "Failed to load VPN configurations: \(error.localizedDescription)")
          return
        }

        if let managers = managers, !managers.isEmpty {
          self?.tunnel = managers.first
          promise.resolve("VPN configuration loaded")
        } else {
          self?.tunnel = NETunnelProviderManager()
          promise.resolve("New VPN configuration created")
        }
      }
    }

    // Start WireGuard tunnel. Initializes the tunnel manager automatically if not already set.
    AsyncFunction("startTunnel") { (configString: String, bundleId: String, promise: Promise) in
      if self.tunnel != nil {
        self.doStartTunnel(configString: configString, bundleId: bundleId, promise: promise)
        return
      }

      // Auto-init: load existing preferences or create a fresh manager
      NETunnelProviderManager.loadAllFromPreferences { [weak self] (managers, error) in
        if let error = error {
          promise.reject("ERROR_LOADING_VPN", "Failed to initialize VPN: \(error.localizedDescription)")
          return
        }

        self?.tunnel = (managers?.isEmpty == false) ? managers!.first : NETunnelProviderManager()
        self?.doStartTunnel(configString: configString, bundleId: bundleId, promise: promise)
      }
    }

    // Stop WireGuard tunnel
    AsyncFunction("stopTunnel") { (promise: Promise) in
      guard let tunnel = self.tunnel, tunnel.connection.status != .invalid else {
        promise.reject("DISCONNECT_ERROR", "Tunnel not initialized or invalid")
        return
      }

      tunnel.connection.stopVPNTunnel()
      promise.resolve(nil)
    }

    // Get current tunnel status
    AsyncFunction("getTunnelStatus") { (promise: Promise) in
      guard let tunnel = self.tunnel else {
        promise.reject("ERROR_NO_TUNNEL", "Tunnel not initialized")
        return
      }

      let status: String
      switch tunnel.connection.status {
      case .connected:
        status = "UP"
      case .connecting, .reasserting:
        status = "CONNECTING"
      case .disconnecting:
        status = "DISCONNECTING"
      case .disconnected, .invalid:
        status = "DOWN"
      @unknown default:
        status = "UNKNOWN"
      }

      promise.resolve(status)
    }
  }

  private func doStartTunnel(configString: String, bundleId: String, promise: Promise) {
    guard let tunnel = self.tunnel else {
      promise.reject("ERROR_NO_TUNNEL", "Failed to initialize tunnel manager")
      return
    }

    let tunnelProtocol = NETunnelProviderProtocol()
    tunnelProtocol.providerBundleIdentifier = bundleId
    tunnelProtocol.serverAddress = "WireGuard"
    tunnelProtocol.providerConfiguration = ["wgQuickConfig": configString]

    tunnel.protocolConfiguration = tunnelProtocol
    tunnel.localizedDescription = "WireGuard VPN"
    tunnel.isEnabled = true

    tunnel.saveToPreferences { [weak self] error in
      if let error = error {
        promise.reject("ERROR_SAVING_CONFIG", "Failed to save VPN configuration: \(error.localizedDescription)")
        return
      }

      self?.tunnel?.loadFromPreferences { loadError in
        if let loadError = loadError {
          promise.reject("ERROR_LOADING_CONFIG", "Failed to load VPN configuration: \(loadError.localizedDescription)")
          return
        }

        do {
          try self?.tunnel?.connection.startVPNTunnel()
          promise.resolve("Tunnel started successfully")
        } catch let startError {
          promise.reject("ERROR_STARTING_TUNNEL", "Failed to start tunnel: \(startError.localizedDescription)")
        }
      }
    }
  }
}
