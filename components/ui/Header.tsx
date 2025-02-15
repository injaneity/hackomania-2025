import React from 'react';
import { SafeAreaView, View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { Colors } from '@/constants/Colors';

export default function Header() {
    const router = useRouter();
    const { signOut } = useAuth();
    const segments = useSegments();
  
    // If the route includes "login", don't show the header.
    if (segments.includes('login')) return null;
  
    // Force dark styling for the header.
    const headerColors = Colors.dark; // Ensure Colors.dark is defined, e.g., { headerBackground: '#000', text: '#fff', ... }
  
    return (
        <SafeAreaView style={[styles.headerSafeArea, { backgroundColor: 'black' }]}>
        <View style={styles.headerContainer}>
          {/* Left placeholder to balance layout */}
          <View style={styles.leftPlaceholder} />
          
          {/* Center title */}
          <Text style={styles.headerTitle}>Sidequest</Text>
          
          {/* Right sign-out button */}
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={async () => {
              await signOut();
              router.replace('/login');
            }}>
            <Ionicons name="log-out-outline" size={24} color={headerColors.text} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

const styles = StyleSheet.create({
  headerSafeArea: {
    width: '100%',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    paddingRight: 64
  },
  leftPlaceholder: {
    width: 128,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 16,
  },
  signOutButton: {
    paddingLeft: 48,
  },
});
