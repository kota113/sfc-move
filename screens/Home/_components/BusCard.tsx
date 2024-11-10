import {Button, Card, Group, H4, H5, ListItem, Paragraph, Spinner, Text, XStack, YStack} from "tamagui";
import {FlatList} from "react-native";
import {Bus, ChevronRight, ChevronsRight} from "@tamagui/lucide-icons";
import * as React from "react";
import {useEffect, useState} from "react";
import {PointId} from "../../../types/points";
import {BusScheduleType, BusTimeApiRes} from "../../../types/busTime";
import {getData, storeJsonData} from "../../../utils/storage";

type BusType = "express" | "local";

interface BusItem {
  destination: string;
  type: BusType;
  time: Date;
}

type SfcBusStop = "sfc" | "sfcHonkan"

const jsonPaths: Record<PointId, Record<PointId, string | undefined>> = {
  sfc: {
    shonandai: "/fromSfc/toShonandai.json",
    sfc: undefined,
    sfcHonkan: undefined
  },
  sfcHonkan: {
    shonandai: "/fromSfcHonkan/toShonandai.json",
    sfc: undefined,
    sfcHonkan: undefined
  },
  shonandai: {
    sfc: "/fromShonandai/toSfc.json",
    sfcHonkan: "/fromShonandai/toSfcHonkan.json",
    shonandai: undefined
  }
};

function extractCloseBusTimes(apiRes: BusTimeApiRes[]): BusItem[] {
  const currentDay = new Date().getDay();
  const currentScheduleType: BusScheduleType =
    currentDay === 0
      ? "holiday"
      : currentDay === 6
        ? "saturday"
        : "weekday";
  const now = new Date();
  const nowTime = now.getHours() * 100 + now.getMinutes();

  const uniqueBusTimes = new Set<string>();
  const busItems: BusItem[] = [];

  for (const res of apiRes) {
    if (res.scheduleType !== currentScheduleType) continue;

    const timeInt = parseInt(res.time);
    if (timeInt < nowTime) continue;

    const hours = Math.floor(timeInt / 100);
    const minutes = timeInt % 100;
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);

    const isExpress = res.dest.includes("急・");
    const destination = res.dest.replace("急・", "");

    const uniqueKey = `${date.getTime()}-${destination}-${
      isExpress ? "express" : "local"
    }`;

    if (!uniqueBusTimes.has(uniqueKey)) {
      uniqueBusTimes.add(uniqueKey);
      busItems.push({
        destination,
        type: isExpress ? "express" : "local",
        time: date,
      });
    }
  }

  busItems.sort((a, b) => {
    const timeDiff = a.time.getTime() - b.time.getTime();
    if (timeDiff !== 0) return timeDiff;
    return a.type === "express" && b.type !== "express" ? -1 : 1;
  });

  return busItems.slice(0, 7);
}

const getCurrentScheduleType = (): BusScheduleType => {
  const day = new Date().getDay();
  return day === 0 ? "holiday" : day === 6 ? "saturday" : "weekday";
};

export default function BusCard({dep, arr}: { dep: PointId; arr: PointId }) {
  const [busTimes, setBusTimes] = React.useState<BusItem[] | undefined>([]);
  const [busData, setBusData] = React.useState<BusTimeApiRes[] | undefined>(undefined);
  const [station, setStation] = useState<SfcBusStop>("sfc");

  useEffect(() => {
    setBusTimes(undefined);
    setBusData(undefined);
    const currentScheduleType: BusScheduleType = getCurrentScheduleType();
    // 休日は本館前行きのバスはない
    if (currentScheduleType === "holiday" && station === "sfcHonkan") {
      setBusTimes([]);
      setBusData([]);
      return;
    }
    const depStation = dep.replace("sfc", station) as PointId
    const arrStation = arr.replace("sfc", station) as PointId
    // fetch bus data
    getData(`bus-${jsonPaths[depStation][arrStation]}`).then((res: BusTimeApiRes[]) => {
      if (res) {
        setBusData(res);
        setBusTimes(extractCloseBusTimes(res));
      }
      // Fetch from API...
      fetch(
        `https://github.com/kota113/SfcBusSchedules/blob/main${jsonPaths[depStation][arrStation]}?raw=true`
      )
        .then(res => res.json())
        .then((apiRes: BusTimeApiRes[]) => {
          storeJsonData(`bus-${jsonPaths[depStation][arrStation]}`, apiRes).then();
          setBusData(apiRes);
          setBusTimes(extractCloseBusTimes(apiRes));
        })
        .catch(err => console.error(err));
    });
  }, [dep, station]);

  useEffect(() => {
    if (busData) {
      const intervalId = setInterval(() => {
        const currentScheduleType: BusScheduleType = getCurrentScheduleType();
        // 休日は本館前行きのバスはない
        // todo: Yahoo!乗換案内からより正確なデータを取得する
        if (currentScheduleType === "holiday" && station === "sfcHonkan") return setBusTimes([]);
        setBusTimes(extractCloseBusTimes(busData));
      }, 60000); // Recalculate every minute
      return () => clearInterval(intervalId);
    }
  }, [busData]);

  return (
    <Card elevate size="$4" marginTop={"$2"} maxHeight={busTimes && busTimes.length === 0 ? 180 : 300} flex={1}>
      <Card.Header>
        <XStack justifyContent={"space-between"}>
          <YStack>
            <XStack>
              <Bus size={"$2.5"} marginRight={"$1"}/>
              <H4>バス</H4>
            </XStack>
            <Paragraph theme={"alt2"}>神奈川中央交通</Paragraph>
          </YStack>
          <Group orientation="horizontal">
            <Group.Item>
              <Button themeInverse={station === "sfc"} onPress={() => setStation("sfc")}>慶応大学</Button>
            </Group.Item>
            <Group.Item>
              <Button themeInverse={station === "sfcHonkan"} onPress={() => setStation("sfcHonkan")}>本館前</Button>
            </Group.Item>
          </Group>
        </XStack>
      </Card.Header>
      <YStack paddingHorizontal={"$4"} paddingBottom={"$4"} flex={1}>
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
          ) : <YStack justifyContent={"center"} flex={1}><H5 textAlign={"center"} color={"orangered"}
                                                                  fontWeight={"bold"}>本日のバスは終了しました</H5></YStack> :
          <Spinner size={"large"} height={200} color={"black"}/>}
      </YStack>
    </Card>
  );
}
