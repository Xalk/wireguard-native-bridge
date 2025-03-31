import WireguardModule from 'wireguard-native-bridge';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useState, useEffect } from 'react';

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

export default function App() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    WireguardModule.prepareVPN();
  }, []);

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Wireguarn Bridge Example Test</Text>

        <TouchableOpacity
          style={[
            styles.button,
            isConnected ? styles.disconnectButton : styles.connectButton,
          ]}
          onPress={isConnected ? disconnectVPN : connectVPN}
        >
          <Text style={styles.buttonText}>
            {isConnected ? 'Disconnect VPN' : 'Connect VPN'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 10,
    width: '80%',
  },
  connectButton: {
    backgroundColor: '#34C759',
  },
  disconnectButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  statusContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    width: '90%',
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  statusText: {
    fontSize: 14,
    color: '#666',
  },
});
