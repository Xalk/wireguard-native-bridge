# WireGuard React Native Example 🚀

This project provides a simple example of how to integrate WireGuard VPN into a React Native application using the `wireguard-native-bridge` module. 🎯✨🔧

## Features 🎉
- Connect to a WireGuard VPN easily
- Disconnect from the VPN easily
- Display connection status

## Installation 🔧

Make sure you have React Native set up on your system. Then, install the required dependency:

```sh
npm install wireguard-native-bridge
```

or

```sh
yarn add wireguard-native-bridge
```

## Configuration ⚙️

The VPN configuration is defined using a string with WireGuard settings:

```js
const config = `
[Interface]
PrivateKey = EXAMPLE_PRIVATE_KEY
Address = 10.0.0.2/24
DNS = 8.8.8.8

[Peer]
PublicKey = EXAMPLE_PUBLIC_KEY
Endpoint = vpn.example.com:51820
AllowedIPs = 0.0.0.0/0, ::/0
PersistentKeepalive = 25
`;
```
Replace `EXAMPLE_PRIVATE_KEY`, `EXAMPLE_PUBLIC_KEY`, and other details with actual values from your VPN provider. 🔑🌐📡

## Usage 📲⚡🛠️

### Connecting to VPN 🔗

To connect to the VPN, the app:
1. Calls `WireguardModule.prepareVPN()` inside a `useEffect` hook to ensure VPN is ready.
2. Calls `WireguardModule.startTunnel(config)` when the user taps the "Connect VPN" button.
3. Updates the UI and shows an alert if the connection is successful.

### Disconnecting from VPN ❌

To disconnect, the app:
1. Calls `WireguardModule.stopTunnel()` when the "Disconnect VPN" button is tapped.
2. Updates the UI and shows an alert confirming the disconnection.

## Example Code 💻

The main logic for handling VPN connections is in the `connectVPN` and `disconnectVPN` functions:

```js
const connectVPN = async () => {
  try {
    await WireguardModule.startTunnel(config);
    setIsConnected(true);
    Alert.alert('Success', 'VPN connected successfully');
  } catch (error) {
    console.error('VPN connection failed:', error);
    Alert.alert('Error', 'Failed to connect to VPN');
  }
};

const disconnectVPN = async () => {
  try {
    await WireguardModule.stopTunnel();
    setIsConnected(false);
    Alert.alert('Success', 'VPN disconnected successfully');
  } catch (error) {
    console.error('VPN disconnection failed:', error);
    Alert.alert('Error', 'Failed to disconnect VPN');
  }
};
```

## UI Preview 🎨

The app provides a basic UI with a title and a button to toggle the VPN connection.

```jsx
<TouchableOpacity
  style={[styles.button, isConnected ? styles.disconnectButton : styles.connectButton]}
  onPress={isConnected ? disconnectVPN : connectVPN}
>
  <Text style={styles.buttonText}>
    {isConnected ? 'Disconnect VPN' : 'Connect VPN'}
  </Text>
</TouchableOpacity>
```

## Notes 📌
- Ensure that your app has the necessary permissions to use VPN services on Android and iOS.
- The WireGuard module may require additional setup depending on the platform.
- Always replace example values with real VPN credentials.

## License 📜
This project is licensed under the MIT License.

