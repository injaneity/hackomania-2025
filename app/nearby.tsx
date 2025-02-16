import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import * as Location from 'expo-location';
import { db } from '../firebase/firebaseConfig';
import { doc, setDoc, onSnapshot, collection } from 'firebase/firestore';
import haversine from 'haversine-distance';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const NEARBY_RADIUS = 500; // in meters
const UPDATE_INTERVAL = 10000; // 10 seconds in milliseconds
const FIVE_MINUTES = 5 * 60 * 1000; // 5 minutes in milliseconds

export default function Nearby() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [nearbyUsers, setNearbyUsers] = useState<any[]>([]);
  const { username } = useCurrentUser(); // assuming username uniquely identifies the user

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
    if (!location) return;
    const intervalId = setInterval(async () => {
      try {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);
        // Simulate a score for testing purposes (replace with actual score if available)
        const simulatedScore = Math.floor(Math.random() * 100);
        await setDoc(
          doc(db, "locations", username),
          {
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
            timestamp: new Date().toISOString(),
            score: simulatedScore,
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

  if (!location) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#fff" />
        {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
      </View>
    );
  }

  const renderUser = ({ item }: { item: any }) => (
    <View style={styles.userRow}>
      <Text style={styles.usernameText}>{item.id}</Text>
      <Text style={styles.distanceText}>{Math.round(item.distance)} m</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Nearby Users</Text>
      <FlatList
        data={nearbyUsers}
        keyExtractor={(item) => item.id}
        renderItem={renderUser}
        ListEmptyComponent={<Text style={styles.userText}>No users nearby.</Text>}
      />
    </View>
  );
}

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
});
