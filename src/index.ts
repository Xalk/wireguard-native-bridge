import { EventSubscription, Platform } from "react-native";
import WireguardNativeBridgeModule from "./WireguardNativeBridgeModule";

export * from "./WireguardNativeBridgeModule";

/**
 * Android only: Triggers the VPN permission intent.
 * On iOS this is not needed — permission is requested automatically when the tunnel starts.
 */
export async function prepareVPN(): Promise<string> {
  if (Platform.OS !== "android") {
    throw new Error("prepareVPN is only supported on Android");
  }
  return await WireguardNativeBridgeModule.prepareVPN();
}

/**
 * Starts the tunnel.
 * @param configString - wg-quick formatted WireGuard config
 * @param bundleId - Network Extension bundle ID, required on iOS (e.g. "com.yourapp.network-extension")
 */
export async function startTunnel(configString: string, bundleId?: string): Promise<string> {
  if (Platform.OS === "ios") {
    if (!bundleId) throw new Error("bundleId is required on iOS");
    return await WireguardNativeBridgeModule.startTunnel(configString, bundleId);
  }
  return await WireguardNativeBridgeModule.startTunnel(configString);
}

/**
 * Stops the tunnel.
 */
export async function stopTunnel(): Promise<void> {
  return await WireguardNativeBridgeModule.stopTunnel();
}

/**
 * Gets the current status.
 */
export async function getTunnelStatus() {
  return await WireguardNativeBridgeModule.getTunnelStatus();
}

/**
 * Listen for changes in the VPN status.
 */
export function addListener(
  eventType: string,
  listener: (event: any) => void,
): EventSubscription {
  return WireguardNativeBridgeModule.addListener(eventType, listener);
}
