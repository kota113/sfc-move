import React from 'react'
import {NavigationContainer} from '@react-navigation/native'
import {createNativeStackNavigator} from '@react-navigation/native-stack'
import {PortalProvider, TamaguiProvider} from 'tamagui'
import config from './tamagui.config'
import {useFonts} from "expo-font";
import Home from "./screens/Home";
import {StatusBar} from "expo-status-bar";
import {useColorScheme} from "react-native";
import * as amplitude from '@amplitude/analytics-react-native';

const Stack = createNativeStackNavigator()
amplitude.init('b78cba8f767d392320833a6e0108bdc5');

// noinspection JSUnusedGlobalSymbols
export default function App() {
  const [loaded] = useFonts({
    Inter: require('@tamagui/font-inter/otf/Inter-Medium.otf'),
    InterBold: require('@tamagui/font-inter/otf/Inter-Bold.otf'),
  })
  if (!loaded) {
    return null
  }
  const colorScheme = useColorScheme();
  amplitude.track('App Opened');
  return (
    <PortalProvider shouldAddRootHost>
      <TamaguiProvider config={config}>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen name="Home" component={Home} options={{headerShown: false}}/>
          </Stack.Navigator>
        </NavigationContainer>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'}/>
      </TamaguiProvider>
    </PortalProvider>
  );
}
