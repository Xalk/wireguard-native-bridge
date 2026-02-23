import { EventSubscription, Platform } from "react-native";
import WireguardNativeBridgeModule from "./WireguardNativeBridgeModule";

export * from "./WireguardNativeBridgeModule";

export interface WireGuardConfig {
  interfaceName: string;
  privateKey: string;
  address: string;
  dns?: string;
  publicKey: string;
  endpoint: string;
  allowedIps?: string;
}

/**
 * Android only: Prepares the VPN intent.
 */
export async function prepareVPN(): Promise<string> {
  if (Platform.OS !== "android") {
    throw new Error("prepareVPN is only supported on Android");
  }
  return await WireguardNativeBridgeModule.prepareVPN();
}

/**
 * Starts the tunnel.
 */
export async function startTunnel(configString: string): Promise<string> {
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
