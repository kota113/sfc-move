import React from 'react'
import {NavigationContainer} from '@react-navigation/native'
import {createNativeStackNavigator} from '@react-navigation/native-stack'
import {PortalProvider, TamaguiProvider} from 'tamagui'
import config from './tamagui.config'
import {useFonts} from "expo-font";
import Home from "./screens/Home";
import {StatusBar} from "expo-status-bar";

const Stack = createNativeStackNavigator()

// noinspection JSUnusedGlobalSymbols
export default function App() {
  const [loaded] = useFonts({
    Inter: require('@tamagui/font-inter/otf/Inter-Medium.otf'),
    InterBold: require('@tamagui/font-inter/otf/Inter-Bold.otf'),
  })
  if (!loaded) {
    return null
  }

  return (
    <PortalProvider shouldAddRootHost>
      <TamaguiProvider config={config}>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen name="Home" component={Home} options={{headerShown: false}}/>
          </Stack.Navigator>
        </NavigationContainer>
        <StatusBar style="auto"/>
      </TamaguiProvider>
    </PortalProvider>
  );
}
