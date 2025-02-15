import React from 'react';
import { SafeAreaView, View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { Colors } from '@/constants/Colors';

export default function Footer() {
    const router = useRouter();
    const segments = useSegments();
  
    if (segments.includes('login')) return null;
  
    const headerColors = Colors.dark;
  
    return (
      <SafeAreaView style={[styles.headerSafeArea, { backgroundColor: 'black' }]}>
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => router.replace('/dashboard')}>
            <Ionicons name="grid-outline" size={24} color={headerColors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.replace('/scan')}>
            <Ionicons name="scan-outline" size={24} color={headerColors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.replace('/victordle')}>
            <Ionicons name="game-controller-outline" size={24} color={headerColors.text} />
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
