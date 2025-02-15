import React from 'react';
import { SafeAreaView, View, TouchableOpacity, StyleSheet } from 'react-native';
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
          <TouchableOpacity onPress={() => router.replace('/scanpage')}>
            <Ionicons name="scan-outline" size={24} color={headerColors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.replace('/dashboard')}>
            <Ionicons name="grid-outline" size={24} color={headerColors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.replace('/victordle')}>
            <Ionicons name="game-controller-outline" size={24} color={headerColors.text} />
          </TouchableOpacity>
  
          <TouchableOpacity
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
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 16,
  },
});
