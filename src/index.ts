import { NativeModules, Platform } from 'react-native';

const LINKING_ERROR =
  `The package 'wireguard-native-bridge' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

const WireguardNativeBridge = NativeModules.WireguardNativeBridge
  ? NativeModules.WireguardNativeBridge
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

type TunnelState = 'UP' | 'DOWN';

interface WireguardModule {
  prepareVPN(): Promise<string>;
  startTunnel(configString: string): Promise<string>;
  stopTunnel(): Promise<void>;
  getTunnelStatus(): Promise<TunnelState>;
}

export default WireguardNativeBridge as WireguardModule;
