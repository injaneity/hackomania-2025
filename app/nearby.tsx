import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity, Platform, ToastAndroid } from 'react-native';
import * as Location from 'expo-location';
import { db } from '../firebase/firebaseConfig';
import { doc, setDoc, onSnapshot, collection } from 'firebase/firestore';
import haversine from 'haversine-distance';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { pairManager } from '@/utils/pairManager';
import { playerManager } from "@/utils/playerManager";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { MaterialIcons } from "@expo/vector-icons";
import FloatingActionButton from '@/components/ui/FloatingActionButton';

const NEARBY_RADIUS = 500; // in meters
const UPDATE_INTERVAL = 5000; // 10 seconds in milliseconds
const FIVE_MINUTES = 5 * 60 * 1000; // 5 minutes in milliseconds

export default function Nearby() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [nearbyUsers, setNearbyUsers] = useState<any[]>([]);
  const { currentUserId, username } = useCurrentUser(); // Add currentUserId
  const [currentPair, setCurrentPair] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isScannerVisible, setScannerVisible] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const scannedRef = useRef(false);

  // New states for the target selection animation
  const [animationActive, setAnimationActive] = useState(false);
  const [highlightedUserId, setHighlightedUserId] = useState<string | null>(null);

  // Request location permissions and get the initial location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
    })();
  }, []);

  // Update location every 10 seconds and send it to Firestore
  useEffect(() => {
    if (!location || !username) return;
    const intervalId = setInterval(async () => {
      try {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);
        
        // Get current player's actual score
        const player = await playerManager.getPlayer(username);
        
        await setDoc(
          doc(db, "locations", username),
          {
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
            timestamp: new Date().toISOString(),
            score: player?.score || 0, // Use actual player score
            username: player?.username || username,
            userid: player?.id || ''
          },
          { merge: true }
        );
      } catch (error) {
        console.error("Error updating location", error);
      }
    }, UPDATE_INTERVAL);
    return () => clearInterval(intervalId);
  }, [location, username]);

  // Listen to Firestore "locations" collection and filter for nearby users
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "locations"), (snapshot) => {
      const users: any[] = [];
      const now = Date.now();
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        // Exclude current user
        if (docSnap.id === username) return;
        if (data && location) {
          const timestamp = new Date(data.timestamp).getTime();
          // Only include documents updated in the last 5 minutes
          if (now - timestamp > FIVE_MINUTES) return;
          const distance = haversine(
            { latitude: location.coords.latitude, longitude: location.coords.longitude },
            { latitude: data.lat, longitude: data.lng }
          );
          if (distance <= NEARBY_RADIUS) {
            users.push({ id: docSnap.id, ...data, distance });
          }
        }
      });
      setNearbyUsers(users);
    });
    return () => unsubscribe();
  }, [location, username]);

  // Add effect to fetch current pair
  useEffect(() => {
    if (!username) return;
    
    const checkCurrentPair = async () => {
      const pair = await pairManager.getCurrentPair(username);
      setCurrentPair(pair);
    };
    
    checkCurrentPair();
  }, [username]);

  const handleFindPair = async () => {
    if (!username || isLoading || animationActive) return;
    setIsLoading(true);

    // Remove existing pair if any
    if (currentPair) {
      await pairManager.removePair(username);
    }
    
    // Select available users (excluding self)
    const availableUsers = nearbyUsers.filter(user => user.id !== username);
    console.log("Available users:", availableUsers);
    if (availableUsers.length === 0) {
      setIsLoading(false);
      alert("No nearby users to select from.");
      return;
    }
    
    // Start the animation
    setAnimationActive(true);
    let animationInterval: NodeJS.Timeout | null = null;
    
    // Update the highlighted user every 200ms
    animationInterval = setInterval(() => {
      const randomUser = availableUsers[Math.floor(Math.random() * availableUsers.length)];
      setHighlightedUserId(randomUser.id);
    }, 200);
    
    // After 5 seconds, finalize the selection
    setTimeout(async () => {
      if (animationInterval) {
        clearInterval(animationInterval);
      }
      // Final random selection
      const finalTarget = availableUsers[Math.floor(Math.random() * availableUsers.length)];
      setHighlightedUserId(finalTarget.id);
      try {
        await pairManager.createPair(username, finalTarget.id);
        const newPair = await pairManager.getCurrentPair(username);
        setCurrentPair(newPair);
      } catch (error) {
        console.error('Error finding pair:', error);
      } finally {
        setAnimationActive(false);
        setIsLoading(false);
      }
    }, 5000);
  };

  const handleBarCodeScanned = async ({
    type,
    data,
  }: {
    type: string;
    data: string;
  }) => {
    if (scannedRef.current || !username) return;
    scannedRef.current = true;

    try {
      const isMatch = await pairManager.verifyAndCompletePair(username, data);
      
      if (isMatch) {
        await Promise.all([
          playerManager.updateScoreByUsername(username, 5),
          playerManager.updateScoreByUsername(data, 5),
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
      setScannerVisible(false);
    }, 1500);
  };

  const handleScanPress = async () => {
    if (!cameraPermission?.granted) {
      const permission = await requestCameraPermission();
      if (!permission.granted) {
        alert("We need camera permission to scan QR codes");
        return;
      }
    }
    setScannerVisible(true);
  };

  if (!location) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#fff" />
        {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
      </View>
    );
  }

  const renderUser = ({ item }: { item: any }) => {
    const isHighlighted = item.id === highlightedUserId;
    return (
      <View style={[styles.userRow, isHighlighted && styles.highlightedRow]}>
        <Text style={styles.usernameText}>{item.id}</Text>
        <Text style={styles.centerText}>{item.score || 0}</Text>
        <Text style={styles.distanceText}>{Math.round(item.distance)} m</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {isScannerVisible ? (
        <CameraView
          style={StyleSheet.absoluteFillObject}
          onBarcodeScanned={handleBarCodeScanned}
        >
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setScannerVisible(false)}
          >
            <MaterialIcons name="close" size={24} color="white" />
          </TouchableOpacity>
        </CameraView>
      ) : (
        <>
          <Text style={styles.header}>Nearby Users</Text>
          
          {/* Pairing Status and Controls */}
          <View style={styles.pairingSection}>
            {currentPair ? (
              <>
                <Text style={styles.pairingText}>
                  {currentPair.completed 
                    ? '✅ Completed! Find another pair?' 
                    : `🎯 Find and scan: ${currentPair.targetId}`}
                </Text>
                <TouchableOpacity 
                  style={[
                    styles.rerollButton, 
                    (animationActive || isLoading) && styles.disabledButton
                  ]}
                  onPress={handleFindPair}
                  disabled={animationActive || isLoading}
                >
                  <Text style={styles.buttonText}>
                    {currentPair.completed ? 'Find New Pair' : 'Re-roll Target'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity 
                style={[
                  styles.findButton, 
                  (animationActive || isLoading) && styles.disabledButton
                ]}
                onPress={handleFindPair}
                disabled={animationActive || isLoading}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? 'Finding...' : 'Find Someone to Scan'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={nearbyUsers}
            keyExtractor={(item) => item.id}
            renderItem={renderUser}
            ListEmptyComponent={<Text style={styles.userText}>No users nearby.</Text>}
          />
          <FloatingActionButton onPress={handleScanPress} />
        </>
      )}
    </View>
  );
}

const additionalStyles = StyleSheet.create({
  pairingSection: {
    padding: 16,
    backgroundColor: '#333',
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  pairingText: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 12,
    textAlign: 'center',
  },
  findButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    width: '100%',
  },
  rerollButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    width: '100%',
  },
  disabledButton: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#222", // Dark background
    padding: 16,
    justifyContent: "center",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
    color: "#fff",
  },
  errorText: {
    color: "red",
    marginTop: 16,
    textAlign: "center",
  },
  userRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#444",
  },
  highlightedRow: {
    backgroundColor: 'rgba(0,255,0,0.3)',
  },
  usernameText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    flex: 2,
  },
  centerText: {
    fontSize: 18,
    color: "#fff",
    flex: 1,
    textAlign: "center",
  },
  distanceText: {
    fontSize: 18,
    color: "#fff",
    flex: 2,
    textAlign: "right",
  },
  userText: {
    fontSize: 18,
    color: "#fff",
    textAlign: "center",
  },
  ...additionalStyles,
});
