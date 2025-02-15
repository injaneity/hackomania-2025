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
import { CaveatBrush_400Regular } from '@expo-google-fonts/caveat-brush'
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Ionicons from '@expo/vector-icons/Ionicons';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { tokenCache } from '@/utils/cache';
import { SafeAreaProvider } from 'react-native-safe-area-context';


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

  // Get current route
  const currentRoute = segments[segments.length - 1] || 'dashboard';

  // Force dark styling for the header.
  const headerColors = Colors.dark;

  const IconButton = ({ route, iconName }: { route: string; iconName: keyof typeof Ionicons.glyphMap }) => (
    <TouchableOpacity 
      onPress={() => route !== currentRoute && router.replace(`/${route}`)}
      disabled={route === currentRoute}
      style={[
        styles.iconButton,
        route === currentRoute && styles.iconButtonActive
      ]}
    >
      <Ionicons 
        name={iconName} 
        size={24} 
        color={route === currentRoute ? headerColors.tint : headerColors.text} 
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.headerSafeArea, { backgroundColor: 'black' }]}>
      <View style={styles.headerContainer}>
        <IconButton route="scanpage" iconName="scan-outline" />
        <IconButton route="dashboard" iconName="grid-outline" />
        <IconButton route="victordle" iconName="game-controller-outline" />
        <TouchableOpacity onPress={async () => {
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
    CaveatBrush_400Regular,
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
    <SafeAreaProvider>
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
                  <Stack.Screen name="dashboard" options={{ headerShown: false }} />
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
    </SafeAreaProvider>
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
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingBottom: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
  },
  iconButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  }
});
