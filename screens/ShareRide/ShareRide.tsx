import {GestureHandlerRootView} from "react-native-gesture-handler";
import * as React from "react";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import Switcher from "./components/Switcher";
import CardCarousel from "./components/CardCarousel";
import MapView, {PROVIDER_GOOGLE} from "react-native-maps";
import {Button} from "tamagui";
import {ChevronLeft} from "@tamagui/lucide-icons";

export default function Screen() {
  const insets = useSafeAreaInsets();
  const topItemsPadding = insets.top + 30
  return (
    <GestureHandlerRootView style={{
      flex: 1,
      flexDirection: "row",
      paddingBottom: insets.bottom,
      paddingTop: insets.top,
      backgroundColor: "white", height: "100%", width: "100%",
      justifyContent: "center",
    }}>
      <MapView
        style={{height: "100%", width: "100%"}}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: 35.396353705426186,
          longitude: 139.46656083982978,
          latitudeDelta: 0.009,
          longitudeDelta: 0.009,
        }}
      />
      <Button borderRadius={100} width={50} position={"absolute"} left={20} height={50} top={topItemsPadding}
              backgroundColor={"black"} onPress={() => {
      }}>
        <ChevronLeft size={25} color={"white"}/>
      </Button>
      <Switcher
        paddingTop={topItemsPadding}
        firstLabel="乗車"
        secondLabel="募集"
        onToggle={(activeIndex) => {
          console.log('Current active index:', activeIndex);
        }}
      />
      <CardCarousel data={[
        {
          time: new Date(),
          type: "taxi",
          hostUserId: "user123",
          destination: "Tokyo Station",
          capacity: 4,
          passengerCount: 1,
        },
        {
          time: new Date(),
          type: "car",
          hostUserId: "user456",
          destination: "Narita Airport",
          capacity: 2,
          passengerCount: 0,
        },
      ]}/>
    </GestureHandlerRootView>
  )
}
