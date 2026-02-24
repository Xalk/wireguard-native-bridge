import { requireNativeModule, NativeModule } from "expo-modules-core";
import { EventSubscription } from "react-native";

export type TunnelState = "UP" | "DOWN" | "CONNECTING" | "DISCONNECTING" | "UNKNOWN";
interface WireguardNativeBridgeInterface extends NativeModule {
  prepareVPN(): Promise<string>;
  startTunnel(config: string, bundleId?: string): Promise<string>;
  stopTunnel(): Promise<void>;
  getTunnelStatus(): Promise<TunnelState>;
  addListener(
    eventName: string,
    listener: (event: any) => void,
  ): EventSubscription;
}

export default requireNativeModule<WireguardNativeBridgeInterface>(
  "WireguardNativeBridge",
);
