import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import React, { useState, useRef } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, Platform, ToastAndroid } from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

export default function Scan() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const scannedRef = useRef(false);

  const handleBarCodeScanned = ({ type, data, bounds }: { type: string; data: string; bounds?: any }) => {
    if (scannedRef.current) return;

    scannedRef.current = true;
    console.log(`Scanned barcode with type ${type} and data: ${data}`);

    if (Platform.OS === 'android') {
      ToastAndroid.show('QR Code Scanned!', ToastAndroid.SHORT);
    } else {
      alert('QR Code Scanned!');
    }

    setTimeout(() => {
      scannedRef.current = false;
      router.replace('/dashboard');
    }, 1500); // Adjust the delay as necessary
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
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
    justifyContent: 'center',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  button: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 30,
    padding: 15,
  },
});
