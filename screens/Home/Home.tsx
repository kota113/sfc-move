import * as React from 'react'
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {Button, Text, XStack, YStack} from "tamagui";
import {ArrowRightLeft} from "@tamagui/lucide-icons";
import BicycleCard from "./_components/BicycleCard";
import BusCard from "./_components/BusCard";
import {Point, PointId} from "../../types/points";
import {GestureHandlerRootView} from "react-native-gesture-handler";

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

export default function Home() {
  const styles = useSafeAreaInsets();
  const depArr = getDepArr();
  const [dep, setDep] = React.useState<PointId>(depArr[0]);
  const [arr, setArr] = React.useState<PointId>(depArr[1]);
  return (
    <GestureHandlerRootView style={{...styles, backgroundColor: "white", height: "100%", width: "100%"}}>
      <XStack paddingHorizontal={"$5"} paddingTop={"$3"} paddingBottom={"$3"} alignItems={"center"}
              justifyContent={"space-between"}>
        <XStack>
          <Text fontSize={"$8"} marginVertical={"auto"}>{points[dep].name}</Text>
          <Text fontSize={"$8"} color={"gray"} marginHorizontal={"$2"}>から</Text>
          <Text fontSize={"$8"} marginVertical={"auto"}>{points[arr].name}</Text>
        </XStack>
        <XStack>
          <Button icon={<ArrowRightLeft/>} onPress={() => {
            setDep(arr);
            setArr(dep);
          }}>
            逆方向
          </Button>
        </XStack>
      </XStack>
      <YStack paddingHorizontal={15} flex={1}>
        <BusCard dep={dep} arr={arr}/>
        <BicycleCard dep={dep} arr={arr}/>
      </YStack>
    </GestureHandlerRootView>
  );
}
