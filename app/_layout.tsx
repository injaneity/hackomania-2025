import React, { useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { ClerkProvider, ClerkLoaded, useAuth } from '@clerk/clerk-expo';
import { Stack, useRouter, useSegments } from 'expo-router';
import {
  useFonts,
  FrankRuhlLibre_800ExtraBold,
  FrankRuhlLibre_500Medium,
  FrankRuhlLibre_900Black,
} from '@expo-google-fonts/frank-ruhl-libre';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Ionicons from '@expo/vector-icons/Ionicons';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { tokenCache } from '@/utils/cache';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error(
    'Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env'
  );
}

// Prevent the splash screen from auto-hiding while fonts load
SplashScreen.preventAutoHideAsync();

// Custom header that only appears on routes other than login.
// It forces dark styling by using Colors.dark.
function Header() {
  const router = useRouter();
  const { signOut } = useAuth();
  const segments = useSegments();

  // If the route includes "login", don't show the header.
  if (segments.includes('login')) return null;

  // Force dark styling for the header.
  const headerColors = Colors.dark; // Ensure Colors.dark is defined, e.g., { headerBackground: '#000', text: '#fff', ... }

  return (
    <SafeAreaView style={[styles.headerSafeArea, { backgroundColor: headerColors.headerBackground }]}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.replace('/scanpage')}>
          <Ionicons name="scan-outline" size={24} color={headerColors.text} />
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

export default function RootLayout() {
  // Force dark theme for the layout (this can be adjusted as needed)
  const theme = DarkTheme;

  // Load custom fonts
  const [fontsLoaded] = useFonts({
    FrankRuhlLibre_800ExtraBold,
    FrankRuhlLibre_500Medium,
    FrankRuhlLibre_900Black,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ClerkLoaded>
        <ThemeProvider value={theme}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <BottomSheetModalProvider>
              <View style={{ flex: 1 }}>
                {/* Custom header appears here */}
                <Header />
                {/* Child screens rendered via Stack */}
                <Stack>
                  <Stack.Screen name="index" options={{ headerShown: false }} />
                  <Stack.Screen name="victordle" options={{ headerShown: false }} />
                  <Stack.Screen name="login" options={{ presentation: 'modal', headerShown: false }} />
                  <Stack.Screen name="scanpage" options={{ presentation: 'fullScreenModal', headerShown: false }} />
                </Stack>
              </View>
            </BottomSheetModalProvider>
          </GestureHandlerRootView>
        </ThemeProvider>
      </ClerkLoaded>
    </ClerkProvider>
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingBottom: 24, // extra padding to ensure it's not blocked by system UI
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
