import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { AppProviders } from '../providers/AppProviders';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../stores/useAuthStore';
import { palette } from '../constants/tokens';

// Keep native splash screen visible while verifying stored credentials
SplashScreen.preventAutoHideAsync().catch(() => {});

function RootNavigation() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const [isNavReady, setIsNavReady] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setIsNavReady(true);
    });
  }, []);

  useEffect(() => {
    if (!isNavReady || isLoading) return;

    // Hide native splash screen once initial auth check is settled
    SplashScreen.hideAsync().catch(() => {});

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isNavReady, isLoading, isAuthenticated, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: palette.pureWhite }}>
        <ActivityIndicator size="large" color={palette.brand500} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="listing/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="listing/create" options={{ headerShown: false }} />
      <Stack.Screen name="reel/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="reel/create" options={{ headerShown: false }} />
      <Stack.Screen name="reel/index" options={{ headerShown: false }} />
      <Stack.Screen name="chat/[conversationId]" options={{ headerShown: false }} />
      <Stack.Screen name="profile/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="search/index" options={{ headerShown: false }} />
      <Stack.Screen name="settings/index" options={{ headerShown: false }} />
      <Stack.Screen name="settings/privacy" options={{ headerShown: false }} />
      <Stack.Screen name="wallet" options={{ headerShown: false }} />
      <Stack.Screen name="boosted-content" options={{ headerShown: false }} />
      <Stack.Screen name="legal/privacy" options={{ headerShown: false }} />
      <Stack.Screen name="legal/terms" options={{ headerShown: false }} />
      <Stack.Screen name="legal/community-guidelines" options={{ headerShown: false }} />
      <Stack.Screen name="support" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    authService.initAuth();
  }, []);

  return (
    <AppProviders>
      <StatusBar style="auto" />
      <RootNavigation />
    </AppProviders>
  );
}
