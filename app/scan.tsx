import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import React, { useState, useRef, useEffect } from "react";
import {
  Button,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  ToastAndroid,
} from "react-native";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { pairManager } from '@/utils/pairManager';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { playerManager } from '@/utils/playerManager';

export default function Scan() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const scannedRef = useRef(false);
  const { currentUserId, username } = useCurrentUser();

  const handleBarCodeScanned = async ({
    type,
    data,
    bounds,
  }: {
    type: string;
    data: string;
    bounds?: any;
  }) => {
    if (scannedRef.current || !username) return;
    scannedRef.current = true;

    try {
      const isMatch = await pairManager.verifyAndCompletePair(username, data);
      
      if (isMatch) {
        // Use new updateScoreByUsername method
        await Promise.all([
          playerManager.updateScoreByUsername(username, 5),    // Scanner gets 50 points
          playerManager.updateScoreByUsername(data, 5),        // Scanned person gets 25 points
        ]);

        if (Platform.OS === "android") {
          ToastAndroid.show("🎉 Match found! +5 points awarded!", ToastAndroid.LONG);
        } else {
          alert("🎉 Match found! +5 points awarded!");
        }
      } else {
        if (Platform.OS === "android") {
          ToastAndroid.show("Not your target! Keep searching!", ToastAndroid.SHORT);
        } else {
          alert("Not your target! Keep searching!");
        }
      }
    } catch (error) {
      console.error('Error verifying scan:', error);
    }

    setTimeout(() => {
      scannedRef.current = false;
      router.replace("/nearby");
    }, 1500);
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          We need your permission to show the camera
        </Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing((current) => (current === "back" ? "front" : "back"));
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing={facing}
        onBarcodeScanned={handleBarCodeScanned}
        // Uncomment the line below to limit scanning to QR codes only:
        // barcodeScannerSettings={{ barCodeTypes: [CameraView.Constants.BarCodeType.qr] }}
      >
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
            <MaterialIcons name="flip-camera-ios" size={36} color="white" />
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  message: {
    textAlign: "center",
    paddingBottom: 10,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  button: {
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 30,
    padding: 15,
  },
});
