import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { ClerkProvider, ClerkLoaded } from "@clerk/clerk-expo";
import { Stack } from "expo-router";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { tokenCache } from "@/utils/cache";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error(
    "Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env"
  );
}

// Prevent the splash screen from auto-hiding while fonts load
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Force dark theme for the layout
  const theme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: "#F5F1EA", // Cream background
      text: "#1B4B43", // Teal text
      primary: "#D4973B", // Golden Yellow
      secondary: "#C84C31", // Dark Orange/Rust
      accent: "#2A9D8F", // Bright Teal
    },
  };

  // Load Inter fonts
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
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
                    <Stack.Screen name="nearby" />
                    <Stack.Screen
                      name="login"
                      options={{
                        presentation: "modal",
                      }}
                    />
                  </Stack>
                  <Footer />
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
    width: "100%",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingBottom: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
  },
  iconButtonActive: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
});
