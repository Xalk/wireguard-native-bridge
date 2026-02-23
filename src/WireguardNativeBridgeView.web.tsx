import * as React from 'react';

import { WireguardNativeBridgeViewProps } from './WireguardNativeBridge.types';

export default function WireguardNativeBridgeView(props: WireguardNativeBridgeViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
