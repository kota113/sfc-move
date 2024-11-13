import * as React from 'react'
import {useEffect} from 'react'
import {Alert} from 'react-native'
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {Button, Text, XStack, YStack} from "tamagui";
import {ArrowRightLeft, Settings} from "@tamagui/lucide-icons";
import BicycleCard from "./_components/BicycleCard";
import BusCard from "./_components/BusCard";
import {Point, PointId} from "../../types/points";
import {GestureHandlerRootView} from "react-native-gesture-handler";
import * as Location from 'expo-location';
import {LocationObject} from 'expo-location';
import SettingsDialog from "./_components/SettingsDialog";
import {AppSettings} from "../../types/settings";
import {getData, storeJsonData} from "../../utils/storage";
import {FirstLaunchDialog} from "./_components/FirstLaunchDialog";
import {track} from "@amplitude/analytics-react-native";


const points: Record<PointId, Point> = {
  sfc: {
    id: "sfc",
    name: "SFC"
  },
  sfcHonkan: {
    id: "sfcHonkan",
    name: "本館前"
  },
  shonandai: {
    id: "shonandai",
    name: "湘南台駅"
  }
}

function getDepArr(): PointId[] {
  // if now is past 3pm, set sfc as dep
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  if (hours > 14 || (hours === 14 && minutes > 0)) {
    return ["sfc", "shonandai"];
  } else {
    return ["shonandai", "sfc"];
  }
}

function handleLocation(location: LocationObject, setDep: (dep: PointId) => void, setArr: (arr: PointId) => void) {
  // if location is near sfc, set sfc as dep
  const sfc = {latitude: 35.38801283493936, longitude: 139.4272737529399};
  const distance = Math.sqrt((location.coords.latitude - sfc.latitude) ** 2 + (location.coords.longitude - sfc.longitude) ** 2);
  let dep: PointId | undefined = undefined
  let arr: PointId | undefined = undefined
  if (distance < 0.01) {
    dep = "sfc";
    arr = "shonandai"
  } else {
    dep = "shonandai";
    arr = "sfc";
  }
  setDep(dep);
  setArr(arr);
  // amplitude
  track("Fetched current position", {
    dep: dep,
    arr: arr
  })
}

async function checkLocationPerm() {
  let {status} = await Location.requestForegroundPermissionsAsync();
  const granted = status === 'granted';
  if (!granted) Alert.alert("位置情報の取得が許可されていません", "設定から位置情報の使用を許可してください。");
  return granted;
}

async function getLocation() {
  if (!await checkLocationPerm()) return;
  return await Location.getLastKnownPositionAsync();
}

export default function Home() {
  const styles = useSafeAreaInsets();
  const depArr = getDepArr();
  const [dep, setDep] = React.useState<PointId>(depArr[0]);
  const [arr, setArr] = React.useState<PointId>(depArr[1]);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [appSettings, setAppSettings] = React.useState<AppSettings>();
  const [firstLaunch, setFirstLaunch] = React.useState(false);
  useEffect(() => {
    (async () => {
      const data = await getData("appSettings") as AppSettings;
      const latestSettings: AppSettings = {locationBasedSuggestEnabled: false};
      if (data) {
        latestSettings.locationBasedSuggestEnabled = data.locationBasedSuggestEnabled;
      } else {
        setFirstLaunch(true);
      }
      setAppSettings(latestSettings);
      await storeJsonData("appSettings", latestSettings);
      if (latestSettings.locationBasedSuggestEnabled) {
        const location = await getLocation();
        if (location) handleLocation(location, setDep, setArr);
      }
    })();
  }, []);

  return (
    <GestureHandlerRootView style={{
      paddingTop: styles.top,
      paddingBottom: styles.bottom,
      backgroundColor: "white", height: "100%", width: "100%"
    }}>
      <XStack paddingHorizontal={"$5"} paddingTop={"$3"} paddingBottom={"$3"} alignItems={"center"}
              justifyContent={"space-between"}>
        <Button icon={<Settings/>} onPress={() => {
          setSettingsOpen(true);
        }}/>
        <XStack alignItems={"center"}>
          <Text fontSize={"$8"} marginVertical={"auto"}>{points[dep].name}</Text>
          <Text fontSize={"$8"} color={"gray"} marginHorizontal={"$2"}>から</Text>
          <Text fontSize={"$8"} marginVertical={"auto"}>{points[arr].name}</Text>
        </XStack>
        <Button icon={<ArrowRightLeft/>} onPress={() => {
          setDep(arr);
          setArr(dep);
        }}/>
      </XStack>
      <YStack paddingHorizontal={15} flex={1}>
        <BusCard dep={dep} arr={arr}/>
        <BicycleCard dep={dep} arr={arr}/>
      </YStack>
      {appSettings !== undefined &&
          <SettingsDialog
              open={settingsOpen}
              setOpen={setSettingsOpen}
              settings={appSettings}
              setSettings={(settings) => {
                setAppSettings(settings);
                if (settings.locationBasedSuggestEnabled) {
                  checkLocationPerm().then((res) => {
                    if (!res) {
                      setAppSettings({...settings, locationBasedSuggestEnabled: false});
                      return;
                    }
                    (async () => {
                      const location = await getLocation();
                      if (location) handleLocation(location, setDep, setArr);
                    })();
                  })
                }
                storeJsonData("appSettings", settings).then();
              }}
          />
      }
      <FirstLaunchDialog open={firstLaunch} setOpen={setFirstLaunch} enableLocationBasedSuggestion={() => {
        (async () => {
          const location = await getLocation();
          if (location) handleLocation(location, setDep, setArr);
        })();
        setAppSettings({...appSettings, locationBasedSuggestEnabled: true});
        storeJsonData("appSettings", {...appSettings, locationBasedSuggestEnabled: true}).then();
      }}/>
    </GestureHandlerRootView>
  );
}
