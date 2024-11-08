import {Card, H4, ListItem, Paragraph, Spinner, Text, YStack} from "tamagui";
import {FlatList} from "react-native";
import {ChevronRight, ChevronsRight} from "@tamagui/lucide-icons";
import * as React from "react";
import {useEffect} from "react";
import {PointId} from "../../../types/points";
import {BusScheduleType, BusTimeApiRes} from "../../../types/busTime";
import {getData, storeJsonData} from "../../../utils/storage";

type BusType = "express" | "local";

interface BusItem {
  destination: string;
  type: BusType;
  time: Date;
}

const jsonPathsFrom = {
  sfc: "/fromSfc/toShonandai.json",
  shonandai: "/fromShonandai/toSfc.json"
}

function extractCloseBusTimes(apiRes: BusTimeApiRes[]): BusItem[] {
  const currentScheduleType: BusScheduleType =
    new Date().getDay() === 0 ? "holiday" : new Date().getDay() === 6 ? "saturday" : "weekday";
  const now = new Date();
  const nowTime = now.getHours() * 100 + now.getMinutes();

  const closestBusTimes: BusItem[] = apiRes
    .filter(res => res.scheduleType === currentScheduleType && parseInt(res.time) >= nowTime)
    .map(res => {
      const time = parseInt(res.time);
      const date = new Date();
      date.setHours(Math.floor(time / 100));
      date.setMinutes(time % 100);
      const isExpress = res.dest.includes("急・");
      const destination = res.dest.replace("急・", "");
      return {destination: destination, type: (isExpress ? "express" : "local" as BusType), time: date};
    })
    .sort((a, b) => a.time.getTime() - b.time.getTime())
    .slice(0, 7);

  return closestBusTimes.filter((item, index, self) =>
    self.findIndex(i => i.time.getTime() === item.time.getTime()) === index
  );
}

export default function BusCard({dep, arr}: { dep: PointId, arr: PointId }) {
  const [busTimes, setBusTimes] = React.useState<BusItem[] | undefined>([]);
  useEffect(() => {
    setBusTimes(undefined);
    // fetch bus data
    getData(`bus-${jsonPathsFrom[dep]}`).then((res: BusTimeApiRes[]) => {
      res ? setBusTimes(extractCloseBusTimes(res)) : null
      // キャッシュからロード後にAPIから取得
      fetch(`https://github.com/kota113/SfcBusSchedules/blob/main${jsonPathsFrom[dep]}?raw=true`)
        .then(res => res.json())
        .then((apiRes: BusTimeApiRes[]) => {
          storeJsonData(`bus-${jsonPathsFrom[dep]}`, apiRes).then();
          setBusTimes(extractCloseBusTimes(apiRes));
        })
        .catch(err => console.error(err));
    });
  }, [dep]);
  return (
    <Card elevate size="$4" marginTop={"$3"}>
      <Card.Header>
        <H4>バス</H4>
        <Paragraph theme={"alt2"}>神奈川中央交通</Paragraph>
      </Card.Header>
      <YStack paddingHorizontal={"$4"} paddingBottom={"$4"} maxHeight={220}>
        {busTimes ? <FlatList
          data={busTimes}
          renderItem={({item}: { item: BusItem }) => (
            <ListItem
              title={`${item.destination} 行き`}
              subTitle={item.type === "express" ? "急行" : "普通"}
              icon={item.type === "express" ?
                <ChevronsRight backgroundColor={"orange"} borderRadius={"$radius.1"} size={"$2"}/> :
                <ChevronRight backgroundColor={"lightseagreen"} borderRadius={"$radius.1"} size={"$2"}/>}
              iconAfter={<Text fontSize={"$6"}>{item.time.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}</Text>}
            />
          )}
          keyExtractor={(item, index) => index.toString()}
        /> : <Spinner size={"large"} height={200} color={"black"}/>}
      </YStack>
    </Card>
  )
}
