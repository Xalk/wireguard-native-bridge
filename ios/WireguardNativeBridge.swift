import Foundation
import NetworkExtension

@objc(WireguardNativeBridge)
class WireguardNativeBridge: NSObject {

    private var tunnel: NETunnelProviderManager?
    private let tunnelBundleId = "com.xalk.actualvpnmobile.network-extension"

    // Prepare VPN permissions on iOS
    @objc(prepareVPN:withRejecter:)
    func prepareVPN(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
        // On iOS, VPN permissions are requested when you try to start the VPN
        // So we just check if we can load saved VPN configurations
        NETunnelProviderManager.loadAllFromPreferences { [weak self] (managers, error) in
            if let error = error {
                reject("ERROR_LOADING_VPN", "Failed to load VPN configurations: \(error.localizedDescription)", error)
                return
            }

            if let managers = managers, !managers.isEmpty {
                // Use existing configuration if available
                self?.tunnel = managers.first
                resolve("VPN configuration loaded")
            } else {
                // Create a new configuration
                self?.tunnel = NETunnelProviderManager()
                resolve("New VPN configuration created")
            }
        }
    }

    // Start WireGuard tunnel with provided configuration
    @objc(startTunnel:withResolver:withRejecter:)
    func startTunnel(configString: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
        guard let tunnel = self.tunnel else {
            reject("ERROR_NO_TUNNEL", "Tunnel not initialized. Call prepareVPN first.", nil)
            return
        }

        // Log the config string to debug
        print("Config String: \(configString)")

        // Create the protocol configuration
        let tunnelProtocol = NETunnelProviderProtocol()
        tunnelProtocol.providerBundleIdentifier = tunnelBundleId
        tunnelProtocol.serverAddress = "WireGuard"

        // Store the WireGuard config in the protocol configuration
        tunnelProtocol.providerConfiguration = [
            "wgQuickConfig": configString
        ]

        tunnel.protocolConfiguration = tunnelProtocol
        tunnel.localizedDescription = "WireGuard VPN"
        tunnel.isEnabled = true

        // Save the configuration
        tunnel.saveToPreferences { [weak self] error in
            if let error = error {
                reject("ERROR_SAVING_CONFIG", "Failed to save VPN configuration: \(error.localizedDescription)", error)
                return
            }

            // Now load the configuration from preferences
            self?.tunnel?.loadFromPreferences { loadError in
                if let loadError = loadError {
                    reject("ERROR_LOADING_CONFIG", "Failed to load VPN configuration: \(loadError.localizedDescription)", loadError)
                    return
                }

                // Start the VPN tunnel
                do {
                    try self?.tunnel?.connection.startVPNTunnel()
                    resolve("Tunnel started successfully")
                } catch let startError {
                    reject("ERROR_STARTING_TUNNEL", "Failed to start tunnel: \(startError.localizedDescription)", startError)
                }
            }
        }
    }

    // Stop WireGuard tunnel
    @objc(stopTunnel:withRejecter:)
    func stopTunnel(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
        guard let tunnel = self.tunnel, tunnel.connection.status != .invalid else {
            reject("DISCONNECT_ERROR", "Tunnel not initialized or invalid", nil)
            return
        }

        tunnel.connection.stopVPNTunnel()
        resolve(nil)
    }

    // Get current tunnel status
    @objc(getTunnelStatus:withRejecter:)
    func getTunnelStatus(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
        guard let tunnel = self.tunnel else {
            reject("ERROR_NO_TUNNEL", "Tunnel not initialized", nil)
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

        resolve(status)
    }
}
