import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Button,
  ScrollView,
  TouchableOpacity,
  PermissionsAndroid,
  Platform,
} from "react-native";
import { BleManager } from "react-native-ble-plx";
import * as Device from "expo-device"; // For checking Android API level

const ProximityMeter = () => {
  const [manager] = useState(new BleManager());
  const [scanning, setScanning] = useState(false);
  const [discoveredDevices, setDiscoveredDevices] = useState([]);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [rssi, setRssi] = useState(null);
  const [polling, setPolling] = useState(false);
  const [intervalId, setIntervalId] = useState(null);

  const deviceIdsRef = useRef(new Set());

  const requestAndroid31Permissions = async () => {
    const bluetoothScanPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      {
        title: "Location Permission",
        message: "Bluetooth Low Energy requires Location",
        buttonPositive: "OK",
      }
    );
    const bluetoothConnectPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      {
        title: "Location Permission",
        message: "Bluetooth Low Energy requires Location",
        buttonPositive: "OK",
      }
    );
    const fineLocationPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: "Location Permission",
        message: "Bluetooth Low Energy requires Location",
        buttonPositive: "OK",
      }
    );

    return (
      bluetoothScanPermission === PermissionsAndroid.RESULTS.GRANTED &&
      bluetoothConnectPermission === PermissionsAndroid.RESULTS.GRANTED &&
      fineLocationPermission === PermissionsAndroid.RESULTS.GRANTED
    );
  };

  const requestPermissions = async () => {
    if (Platform.OS === "android") {
      if ((Device.platformApiLevel ?? -1) < 31) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "Location Permission",
            message: "Bluetooth Low Energy requires Location",
            buttonPositive: "OK",
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        return await requestAndroid31Permissions();
      }
    } else {
      return true;
    }
  };

  useEffect(() => {
    (async () => {
      await requestPermissions();
    })();

    startScan();

    return () => {
      manager.stopDeviceScan();
      if (intervalId) clearInterval(intervalId);
      if (connectedDevice) {
        connectedDevice.cancelConnection();
      }
      manager.destroy();
    };
  }, []);

  const startScan = async () => {
    const permissionsGranted = await requestPermissions();
    if (!permissionsGranted) {
      console.log("Permissions not granted");
      return;
    }

    // Reset state before scanning
    setDiscoveredDevices([]);
    deviceIdsRef.current = new Set();
    setConnectedDevice(null);
    setRssi(null);
    setPolling(false);

    setScanning(true);
    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.log("Error scanning:", error);
        setScanning(false);
        return;
      }
      if (device && device.id && !deviceIdsRef.current.has(device.id)) {
        deviceIdsRef.current.add(device.id);
        setDiscoveredDevices((prevDevices) => [...prevDevices, device]);
        console.log("Discovered:", device.name || "Unnamed", device.id);
      }
    });

    // Stop scanning after 5 seconds
    setTimeout(() => {
      manager.stopDeviceScan();
      setScanning(false);
    }, 5000);
  };

  // Connect when a device is pressed from the list
  const connectToDevice = async (device) => {
    try {
      const connected = await manager.connectToDevice(device.id);
      await connected.discoverAllServicesAndCharacteristics();
      console.log("Connected to:", connected.name || connected.id);
      setConnectedDevice(connected);

      // Poll RSSI every 1 second (you can adjust the frequency)
      const id = setInterval(() => {
        readRSSI(connected);
      }, 1000);
      setIntervalId(id);
      setPolling(true);
    } catch (error) {
      console.log("Connection error:", error);
    }
  };

  const readRSSI = async (device) => {
    try {
      const updatedDevice = await device.readRSSI();
      setRssi(updatedDevice.rssi);
    } catch (error) {
      console.log("Error reading RSSI:", error);
    }
  };

  // Convert RSSI (roughly between -100 and -30 dBm) to a percentage for our meter
  const getRssiPercentage = () => {
    if (rssi === null) return 0;
    const minRSSI = -100;
    const maxRSSI = -30;
    let percentage = ((rssi - minRSSI) / (maxRSSI - minRSSI)) * 100;
    return Math.max(0, Math.min(100, percentage));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Proximity Meter</Text>

      <View style={styles.section}>
        <Text style={styles.label}>
          {scanning ? "Scanning for devices..." : "Scan complete"}
        </Text>
        <Text style={styles.label}>
          Devices Found: {discoveredDevices.length}
        </Text>
      </View>

      {/* Scrollable list of discovered devices */}
      <ScrollView style={styles.deviceList} nestedScrollEnabled={true}>
        {discoveredDevices.map((device) => (
          <TouchableOpacity
            key={device.id}
            style={styles.deviceItem}
            onPress={() => connectToDevice(device)}
          >
            <Text style={styles.deviceText}>
              {device.name ? device.name : "Unnamed"} ({device.id})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {connectedDevice && (
        <View style={styles.connectedContainer}>
          <Text style={styles.connectedLabel}>
            Connected to:{" "}
            {connectedDevice.name ? connectedDevice.name : connectedDevice.id}
          </Text>
          <Text style={styles.deviceText}>
            RSSI: {rssi !== null ? `${rssi} dBm` : "Reading..."}
          </Text>
          <View style={styles.meterBackground}>
            <View
              style={[styles.meterFill, { width: `${getRssiPercentage()}%` }]}
            />
          </View>
          <Text style={styles.statusText}>
            {getRssiPercentage() > 50 ? "Hot" : "Cold"}
          </Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <Button title="Rescan" onPress={startScan} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
    flex: 1,
  },
  title: {
    fontSize: 22,
    marginBottom: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  section: {
    marginBottom: 16,
    alignItems: "center",
  },
  label: {
    fontSize: 16,
    marginVertical: 4,
  },
  deviceList: {
    maxHeight: 200,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 8,
  },
  deviceItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  deviceText: {
    fontSize: 14,
  },
  connectedContainer: {
    alignItems: "center",
    marginVertical: 16,
  },
  connectedLabel: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: "bold",
  },
  meterBackground: {
    width: "100%",
    height: 20,
    backgroundColor: "#eee",
    borderRadius: 10,
    marginVertical: 10,
    overflow: "hidden",
  },
  meterFill: {
    height: "100%",
    backgroundColor: "#f00",
  },
  statusText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  buttonContainer: {
    marginTop: 20,
    alignItems: "center",
  },
});

export default ProximityMeter;
