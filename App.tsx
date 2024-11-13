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
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://ec28960263fa24cb9e916e260d106148@o4508288388759552.ingest.us.sentry.io/4508288389939200',

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // enableSpotlight: __DEV__,
});

const Stack = createNativeStackNavigator()
amplitude.init('b78cba8f767d392320833a6e0108bdc5');


function App() {
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

// noinspection JSUnusedGlobalSymbols
export default Sentry.wrap(App);
