import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ChartProvider } from "@/contexts/ChartContext";
import { StatusBar } from "expo-status-bar";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AiProvider } from "@/contexts/AiContext";
import { ProProvider } from "@/contexts/ProContext";
import { trpc, trpcClient } from "@/lib/trpc";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <>
      <Stack screenOptions={{ headerBackTitle: "Back" }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <AiProvider>
          <ProProvider>
            <ChartProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <ErrorBoundary>
                  <RootLayoutNav />
                </ErrorBoundary>
              </GestureHandlerRootView>
            </ChartProvider>
          </ProProvider>
        </AiProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
