import { Stack } from 'expo-router';
import { TH2 } from '../../constants/Colors';

export default function GoalLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: TH2.bg0 },
      }}
    >
      <Stack.Screen name="[id]/index" />
      <Stack.Screen name="[id]/chat" />
    </Stack>
  );
}
