import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  Lora_500Medium,
  Lora_600SemiBold,
  Lora_500Medium_Italic,
} from '@expo-google-fonts/lora';
import {
  DMSans_400Regular,
  DMSans_500Medium,
} from '@expo-google-fonts/dm-sans';
import { DMMono_400Regular } from '@expo-google-fonts/dm-mono';
import { View, Text, ActivityIndicator } from 'react-native';
import { TH2 } from '../constants/Colors';
import { AppProvider } from '../contexts/AppContext';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Lora_500Medium,
    Lora_600SemiBold,
    Lora_500Medium_Italic,
    DMSans_400Regular,
    DMSans_500Medium,
    DMMono_400Regular,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: TH2.bg0 }}>
        <ActivityIndicator color={TH2.acc} />
        <Text style={{ marginTop: 12, color: TH2.t2, fontFamily: 'DMMono_400Regular', fontSize: 10, letterSpacing: 4 }}>RUSHI</Text>
      </View>
    );
  }

  return (
    <AppProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
        <Stack.Screen name="goal" options={{ animation: 'fade' }} />
        <Stack.Screen name="add-goal" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      </Stack>
    </AppProvider>
  );
}
