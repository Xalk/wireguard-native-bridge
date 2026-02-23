import { requireNativeView } from 'expo';
import * as React from 'react';

import { WireguardNativeBridgeViewProps } from './WireguardNativeBridge.types';

const NativeView: React.ComponentType<WireguardNativeBridgeViewProps> =
  requireNativeView('WireguardNativeBridge');

export default function WireguardNativeBridgeView(props: WireguardNativeBridgeViewProps) {
  return <NativeView {...props} />;
}
