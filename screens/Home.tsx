import * as React from 'react'
import {View} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {Button, Text, XStack, YStack} from "tamagui";
import {ArrowRightLeft} from "@tamagui/lucide-icons";
import BicycleCard from "./Home/_components/BicycleCard";
import BusCard from "./Home/_components/BusCard";
import {Point, PointId} from "../types/points";

const points: Record<PointId, Point> = {
  sfc: {
    id: "sfc",
    name: "SFC"
  },
  shonandai: {
    id: "shonandai",
    name: "湘南台駅"
  }
}

export default function Home() {
  const styles = useSafeAreaInsets();
  const [dep, setDep] = React.useState<PointId>("shonandai");
  const [arr, setArr] = React.useState<PointId>("sfc");
  return (
    <View style={{...styles, backgroundColor: "white", height: "100%", width: "100%"}}>
      <XStack paddingHorizontal={"$5"} paddingTop={"$3"} paddingBottom={"$1"} alignItems={"center"}
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
      <YStack paddingHorizontal={15}>
        <BusCard dep={dep} arr={arr}/>
        <BicycleCard dep={dep} arr={arr}/>
      </YStack>
    </View>
  );
}
