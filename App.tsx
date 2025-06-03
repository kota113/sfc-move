import React, {useEffect} from 'react'
import {NavigationContainer} from '@react-navigation/native'
import {createNativeStackNavigator} from '@react-navigation/native-stack'
import {PortalProvider, TamaguiProvider} from 'tamagui'
import config from './tamagui.config'
import {useFonts} from "expo-font";
import Home from "./screens/Home";
import {StatusBar} from "expo-status-bar";
import * as amplitude from '@amplitude/analytics-react-native';
import {RootStackParamList} from "./types/navigation";
import TaxiGroups from './screens/TaxiGroups'
import {initializeApi} from './services/api/init'
import TaxiGroupsOnboarding from "./screens/TaxiGroupsOnboarding";
import TaxiGroupsRegistering from "./screens/TaxiGroupsRegistering";

const Stack = createNativeStackNavigator<RootStackParamList>()
amplitude.init('b78cba8f767d392320833a6e0108bdc5');

// noinspection JSUnusedGlobalSymbols
export default function App() {
  const [loaded] = useFonts({
    Inter: require('@tamagui/font-inter/otf/Inter-Medium.otf'),
    InterBold: require('@tamagui/font-inter/otf/Inter-Bold.otf'),
  })

  // Initialize API and sign in user anonymously
  useEffect(() => {
    const init = async () => {
      await initializeApi();
    };
    init().then();
  }, []);

  if (!loaded) {
    return null
  }
  amplitude.track('App Opened');
  return (
    <PortalProvider shouldAddRootHost>
      <TamaguiProvider config={config}>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Home">
            <Stack.Screen name="Home" component={Home} options={{headerShown: false}}/>
            <Stack.Screen name="TaxiGroups" component={TaxiGroups} options={{headerShown: false}}/>
            <Stack.Screen name="TaxiGroupsOnboarding" component={TaxiGroupsOnboarding} options={{headerShown: false}}/>
            <Stack.Screen name="TaxiGroupsRegistering" component={TaxiGroupsRegistering}  options={{headerShown: false}}/>
          </Stack.Navigator>
        </NavigationContainer>
        <StatusBar style={'dark'} backgroundColor={'white'}/>
      </TamaguiProvider>
    </PortalProvider>
  );
}
