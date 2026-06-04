import { Tabs } from 'expo-router';
import { PillTabBar } from '../../components/PillTabBar';
import { TH2 } from '../../constants/Colors';
import { View } from 'react-native';

export default function TabLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: TH2.bg0 }}>
      <Tabs
        tabBar={(props) => (
          <PillTabBar
            active={props.state.routeNames[props.state.index] ?? 'board'}
            onChange={(id) => {
              const idx = props.state.routeNames.findIndex(r => {
                if (id === 'board') return r === 'board';
                if (id === 'chat') return r === 'chat';
                if (id === 'settle') return r === 'settle';
                return false;
              });
              if (idx >= 0) {
                props.navigation.navigate(props.state.routeNames[idx]);
              }
            }}
          />
        )}
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          sceneStyle: {
            backgroundColor: 'transparent',
          },
        }}
      >
        <Tabs.Screen name="board" />
        <Tabs.Screen name="chat" />
        <Tabs.Screen name="settle" />
      </Tabs>
    </View>
  );
}
