import { registerWebModule, NativeModule } from 'expo';

import { WireguardNativeBridgeModuleEvents } from './WireguardNativeBridge.types';

class WireguardNativeBridgeModule extends NativeModule<WireguardNativeBridgeModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
}

export default registerWebModule(WireguardNativeBridgeModule, 'WireguardNativeBridgeModule');
