import {Button, Card, Group, H4, H5, ListItem, Paragraph, Spinner, Text, XStack, YStack} from "tamagui";
import {FlatList} from "react-native";
import {Bus, ChevronRight, ChevronsRight} from "@tamagui/lucide-icons";
import * as React from "react";
import {useEffect, useState} from "react";
import {PointId} from "../../../types/points";
import {FlatBusEntry} from "../../../types/busTime";
import {getCurrentScheduleType, getDirection, loadEntries, NormalizedBusItem, toUpcoming} from "../../../services/api/bus";

type BusItem = NormalizedBusItem;

type SfcBusStop = "sfc" | "sfcHonkan"

export default function BusCard({dep, arr, isAtHonkan}: { dep: PointId; arr: PointId, isAtHonkan: boolean }) {
  const [busTimes, setBusTimes] = React.useState<BusItem[] | undefined>([]);
  const [entries, setEntries] = React.useState<FlatBusEntry[] | undefined>(undefined);
  const [station, setStation] = useState<SfcBusStop>(isAtHonkan ? "sfcHonkan" : "sfc");

  useEffect(() => {
    setStation(isAtHonkan ? "sfcHonkan" : "sfc");
  }, [isAtHonkan]);

  useEffect(() => {
    setBusTimes(undefined);
    setEntries(undefined);
    const currentScheduleType = getCurrentScheduleType();
    // 休日は本館前行きのバスはない
    if (currentScheduleType === "holiday" && station === "sfcHonkan") {
      setBusTimes([]);
      setEntries([]);
      return;
    }
    const direction = getDirection(dep);
    loadEntries(direction, currentScheduleType)
      .then((apiEntries) => {
        setEntries(apiEntries);
        setBusTimes(toUpcoming(apiEntries, {direction, station, arr}));
      })
      .catch(err => {
        console.error(err);
        setBusTimes([]);
        setEntries([]);
      });
  }, [dep, arr, station]);

  useEffect(() => {
    if (entries) {
      const intervalId = setInterval(() => {
        const currentScheduleType = getCurrentScheduleType();
        // 休日は本館前行きのバスはない
        if (currentScheduleType === "holiday" && station === "sfcHonkan") return setBusTimes([]);
        const direction = getDirection(dep);
        setBusTimes(toUpcoming(entries, {direction, station, arr}));
      }, 60000); // Recalculate every minute
      return () => clearInterval(intervalId);
    }
  }, [entries]);

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
          {dep !== "shonandai" && (
            <Group orientation="horizontal">
              <Group.Item>
                <Button backgroundColor={station == "sfc" ? "#232323" : undefined}
                        color={station == "sfc" ? "white" : undefined}
                        onPress={() => setStation("sfc")}>慶応大学</Button>
              </Group.Item>
              <Group.Item>
                <Button backgroundColor={station == "sfcHonkan" ? "#232323" : undefined}
                        color={station == "sfcHonkan" ? "white" : undefined}
                        onPress={() => setStation("sfcHonkan")}>本館前</Button>
              </Group.Item>
            </Group>
          )}
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
