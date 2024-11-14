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

function getTimeBasedDepArr(): PointId[] {
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

function handleLocation(location: LocationObject, setDep: (dep: PointId) => void, setArr: (arr: PointId) => void, setIsAtHonkan: (_: boolean) => void) {
  const sfcAreaCenter = {latitude: 35.387615518299015, longitude: 139.42843437194827};
  const sfcCenter = {latitude: 35.387947892809244, longitude: 139.42690014839175};

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    return Math.sqrt((lat1 - lat2) ** 2 + (lon1 - lon2) ** 2) * 111139;
  };

  const distanceToSfcArea = calculateDistance(location.coords.latitude, location.coords.longitude, sfcAreaCenter.latitude, sfcAreaCenter.longitude);
  const distanceToSfcCenter = calculateDistance(location.coords.latitude, location.coords.longitude, sfcCenter.latitude, sfcCenter.longitude);

  const dep = distanceToSfcArea < 508.97323364163003 ? "sfc" : "shonandai";
  const arr = dep === "sfc" ? "shonandai" : "sfc";

  setDep(dep);
  setArr(arr);
  setIsAtHonkan(distanceToSfcCenter < 172);

  track("Fetched current position", {dep, arr});
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
  const _ = getTimeBasedDepArr();
  const [dep, setDep] = React.useState<PointId>(_[0]);
  const [arr, setArr] = React.useState<PointId>(_[1]);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [appSettings, setAppSettings] = React.useState<AppSettings>();
  const [firstLaunch, setFirstLaunch] = React.useState(false);
  const [isAtHonkan, setIsAtHonkan] = React.useState<boolean>(false);
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
        if (location) handleLocation(location, setDep, setArr, setIsAtHonkan);
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
        <BusCard dep={dep} arr={arr} isAtHonkan={isAtHonkan}/>
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
                      if (location) handleLocation(location, setDep, setArr, setIsAtHonkan);
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
          if (location) handleLocation(location, setDep, setArr, setIsAtHonkan);
        })();
        setAppSettings({...appSettings, locationBasedSuggestEnabled: true});
        storeJsonData("appSettings", {...appSettings, locationBasedSuggestEnabled: true}).then();
      }}/>
    </GestureHandlerRootView>
  );
}
