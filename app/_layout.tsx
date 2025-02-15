import React, { useEffect } from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { ClerkProvider, ClerkLoaded } from '@clerk/clerk-expo';
import { Stack } from 'expo-router';
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
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { tokenCache } from '@/utils/cache';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';


const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error(
    'Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env'
  );
}

// Prevent the splash screen from auto-hiding while fonts load
SplashScreen.preventAutoHideAsync();

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
                  <Header />
                  <Stack
                    screenOptions={({ route }) => ({
                      headerShown: false,
                    })}
                  >
                    <Stack.Screen name="index" />
                    <Stack.Screen name="dashboard" />
                    <Stack.Screen name="victordle" />
                    <Stack.Screen 
                      name="login" 
                      options={{ 
                        presentation: 'modal',
                      }} 
                    />
                    <Stack.Screen 
                      name="scan" 
                      options={{
                        presentation: 'fullScreenModal',
                      }}
                    />
                  </Stack>
                  <Footer/>
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
