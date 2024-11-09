import {Card, H4, H5, ListItem, Paragraph, Spinner, Text, XStack, YStack} from "tamagui";
import {FlatList} from "react-native";
import {Bus, ChevronRight, ChevronsRight} from "@tamagui/lucide-icons";
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
};

function extractCloseBusTimes(apiRes: BusTimeApiRes[]): BusItem[] {
  const currentScheduleType: BusScheduleType =
    new Date().getDay() === 0
      ? "holiday"
      : new Date().getDay() === 6
        ? "saturday"
        : "weekday";
  const now = new Date();
  const nowTime = now.getHours() * 100 + now.getMinutes();

  const uniqueBusTimes = new Set<string>();
  return apiRes
    .filter(
      res =>
        res.scheduleType === currentScheduleType &&
        parseInt(res.time) >= nowTime
    )
    .map(res => {
      const time = parseInt(res.time);
      const date = new Date();
      date.setHours(Math.floor(time / 100));
      date.setMinutes(time % 100);
      const isExpress = res.dest.includes("急・");
      const destination = res.dest.replace("急・", "");
      const busItem = {
        destination: destination,
        type: (isExpress ? "express" : "local") as BusType,
        time: date
      };
      const uniqueKey = `${busItem.time.getTime()}-${busItem.destination}-${busItem.type}`;
      if (!uniqueBusTimes.has(uniqueKey)) {
        uniqueBusTimes.add(uniqueKey);
        return busItem;
      }
      return null;
    })
    .filter(item => item !== null)
    .sort((a, b) => {
      const timeDiff = a!.time.getTime() - b!.time.getTime();
      if (timeDiff !== 0) return timeDiff;
      return a!.type === "express" && b!.type !== "express" ? -1 : 1;
    })
    .slice(0, 7) as BusItem[];
}

export default function BusCard({dep, arr}: { dep: PointId; arr: PointId }) {
  const [busTimes, setBusTimes] = React.useState<BusItem[] | undefined>([]);
  const [busData, setBusData] = React.useState<BusTimeApiRes[] | undefined>(undefined);

  useEffect(() => {
    setBusTimes(undefined);
    setBusData(undefined);
    // fetch bus data
    getData(`bus-${jsonPathsFrom[dep]}`).then((res: BusTimeApiRes[]) => {
      if (res) {
        setBusData(res);
        setBusTimes(extractCloseBusTimes(res));
      }
      // Fetch from API...
      fetch(
        `https://github.com/kota113/SfcBusSchedules/blob/main${jsonPathsFrom[dep]}?raw=true`
      )
        .then(res => res.json())
        .then((apiRes: BusTimeApiRes[]) => {
          storeJsonData(`bus-${jsonPathsFrom[dep]}`, apiRes).then();
          setBusData(apiRes);
          setBusTimes(extractCloseBusTimes(apiRes));
        })
        .catch(err => console.error(err));
    });
  }, [dep]);

  useEffect(() => {
    if (busData) {
      const intervalId = setInterval(() => {
        setBusTimes(extractCloseBusTimes(busData));
      }, 60000); // Recalculate every minute
      return () => clearInterval(intervalId);
    }
  }, [busData]);

  return (
    <Card elevate size="$4" marginTop={"$3"} maxHeight={"45%"}>
      <Card.Header>
        <XStack>
          <Bus size={"$2.5"} marginRight={"$1"}/>
          <H4>バス</H4>
        </XStack>
        <Paragraph theme={"alt2"}>神奈川中央交通</Paragraph>
      </Card.Header>
      <YStack paddingHorizontal={"$4"} paddingBottom={"$4"} maxHeight={220}>
        {busTimes !== undefined ?
          busTimes.length > 0 ? (
          <FlatList
            data={busTimes}
            renderItem={({item}: { item: BusItem }) => {
              const remainingTime = item.time.getTime() - new Date().getTime();
              return (
                <ListItem
                  title={`${item.destination} 行き`}
                  subTitle={item.type === "express" ? "急行" : "普通"}
                  icon={
                    item.type === "express" ? (
                      <ChevronsRight
                        backgroundColor={"orange"}
                        borderRadius={"$radius.1"}
                        size={"$2"}
                      />
                    ) : (
                      <ChevronRight
                        backgroundColor={"lightseagreen"}
                        borderRadius={"$radius.1"}
                        size={"$2"}
                      />
                    )
                  }
                  iconAfter={
                    remainingTime <= 300000 ? (
                      <YStack>
                        <Text fontSize={"$6"} color={"orangered"}>
                          あと{Math.max(0, Math.floor(remainingTime / 60000))}分
                        </Text>
                        <Paragraph
                          theme={"alt2"}
                          textAlign={"right"}
                        >
                          {item.time.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </Paragraph>
                      </YStack>
                    ) : (
                      <Text fontSize={"$6"}>
                        {item.time.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </Text>
                    )
                  }
                />
              );
            }}
            keyExtractor={(item, index) => index.toString()}
          />
          ) : <YStack height={"$3"} justifyContent={"center"}><H5 textAlign={"center"} color={"orangered"}
                                                                  fontWeight={"bold"}>本日のバスは終了しました</H5></YStack> :
          <Spinner size={"large"} height={200} color={"black"}/>}
      </YStack>
    </Card>
  );
}
