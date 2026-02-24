import { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Button,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import * as Wireguard from "wireguard-native-bridge";

const TEST_CONFIG = `[Interface]
PrivateKey = [ENCRYPTION_KEY]
Address = [IP_ADDRESS]
DNS = [IP_ADDRESS]

[Peer]
PublicKey = [ENCRYPTION_KEY]
Endpoint = [IP_ADDRESS]
AllowedIPs = [IP_ADDRESS]`;

// Replace with your Network Extension target's bundle ID
const BUNDLE_ID = "com.yourapp.network-extension";

export default function App() {
  const [status, setStatus] = useState<string>("UNKNOWN");
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) =>
    setLog((prev) => [`${new Date().toLocaleTimeString()}: ${msg}`, ...prev]);

  useEffect(() => {
    // 1. Listen for status changes from the Native side
    const subscription = Wireguard.addListener(
      "onStatusChange",
      (event: any) => {
        console.log("Event received:", event);
        addLog(`Event: ${JSON.stringify(event)}`);
        if (event.status) setStatus(event.status);
      },
    );

    return () => subscription.remove();
  }, []);

  async function handlePrepare() {
    try {
      addLog("Preparing VPN...");
      const result = await Wireguard.prepareVPN();
      addLog(`Prepare Result: ${result}`);
      Alert.alert("Permission Status", result);
    } catch (e: any) {
      addLog(`Prepare Error: ${e.message}`);
    }
  }

  async function handleConnect() {
    try {
      addLog("Starting tunnel...");
      // Starts the WireGuard tunnel using the TEST_CONFIG defined at the top of this file.
      // Replace TEST_CONFIG with real keys/endpoint to actually connect to a VPN server.
      const result = await Wireguard.startTunnel(TEST_CONFIG, BUNDLE_ID);
      addLog(`Connect Result: ${result}`);
    } catch (e: any) {
      addLog(`Connect Error: ${e.message}`);
      Alert.alert(
        "Connection Failed",
        `Error: ${e.message}\n\nMake sure TEST_CONFIG has valid keys and a reachable endpoint.`,
      );
    }
  }

  async function handleDisconnect() {
    try {
      addLog("Disconnecting...");
      const result = await Wireguard.stopTunnel();
      addLog(`Disconnect Result: ${result}`);
    } catch (e: any) {
      addLog(`Disconnect Error: ${e.message}`);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>WireGuard Native Bridge</Text>
      <Text style={styles.status}>Status: {status}</Text>

      {Platform.OS === "android" && (
        <View style={styles.buttonContainer}>
          <Button title="1. Prepare (Ask Permission)" onPress={handlePrepare} />
        </View>
      )}
      <View style={styles.buttonContainer}>
        <Button title="2. Connect (Start Tunnel)" onPress={handleConnect} />
      </View>
      <View style={styles.buttonContainer}>
        <Button title="3. Disconnect" onPress={handleDisconnect} color="red" />
      </View>

      <Text style={styles.logHeader}>Logs:</Text>
      <ScrollView style={styles.logs}>
        {log.map((l, i) => (
          <Text key={i} style={styles.logText}>
            {l}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  status: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
    fontWeight: "600",
  },
  buttonContainer: { marginBottom: 10 },
  logHeader: { marginTop: 20, fontWeight: "bold" },
  logs: {
    flex: 1,
    marginTop: 10,
    backgroundColor: "#ddd",
    padding: 10,
    borderRadius: 5,
  },
  logText: { fontSize: 12, marginBottom: 5, fontFamily: "monospace" },
});
