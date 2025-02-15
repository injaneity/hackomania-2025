import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, Pressable } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';

import { useAuth } from '@clerk/clerk-expo';

export const LogoutButton = () => {
  const { signOut } = useAuth();

  const doLogout = () => {
    signOut();
  };

  return (
    <Pressable onPress={doLogout} style={{ marginRight: 10 }}>
      <Ionicons name="log-out-outline" size={24} color={'#fff'} />
    </Pressable>
  );
};

export default function TabLayout() {
  const colorScheme = useColorScheme();
  // Define your header background and tint colors.
  const headerBackgroundColor = Colors[colorScheme ?? 'light'].headerBackground || '#333';
  const headerTintColor = Colors[colorScheme ?? 'light'].headerTintColor || '#fff';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: true,
        headerStyle: { backgroundColor: headerBackgroundColor },
        headerTintColor: headerTintColor,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
          headerRight: () => <LogoutButton />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
          headerRight: () => <LogoutButton />,
        }}
      />
      <Tabs.Screen
        name="victordle"
        options={{
          title: 'Victordle',
          tabBarIcon: ({ color }) => <Ionicons name="game-controller" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="scanpage"
        options={{
          title: 'scanpage',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
