import {Button, Card, H4, ListItem, Paragraph, Spinner, Text, XStack, YStack} from "tamagui";
import {FlatList} from "react-native";
import {AlertTriangle, Bike, ChevronDown, Circle, LogOut, RefreshCw, X} from "@tamagui/lucide-icons";
import * as React from "react";
import {useEffect} from "react";
import * as Linking from 'expo-linking';
import {PointId} from "../../../types/points";
import {ApiResponse} from "../../../types/hello-cycling";
import {CannotRentChip, CannotReturnChip, RentalWarningChip, ReturnWarningChip, VacantChip} from "./BicycleChips";

interface StationItem {
  name: string;
  remaining: number;
}

function calculateAvailableStations(apiRes: ApiResponse, dep: PointId) {
  const depStations: StationItem[] = [];
  const arrStations: StationItem[] = [];
  if (dep == "shonandai") {
    apiRes.stations.shonandai_west.forEach(station => {
      depStations.push({
        name: station.name,
        remaining: station.num_bikes_rentalable
      });
    })
    apiRes.stations.sfc.forEach(station => {
      arrStations.push({
        name: station.name,
        remaining: station.num_bikes_parkable
      });
    })
  } else {
    apiRes.stations.sfc.forEach(station => {
      depStations.push({
        name: station.name,
        remaining: station.num_bikes_rentalable
      });
    })
    apiRes.stations.shonandai_west.forEach(station => {
      arrStations.push({
        name: station.name,
        remaining: station.num_bikes_parkable
      });
    })
  }
  // sort by remaining bikes
  depStations.sort((a, b) => b.remaining - a.remaining);
  arrStations.sort((a, b) => b.remaining - a.remaining);
  return {depStations, arrStations};
}

const StationList = ({stations}: { stations: StationItem[] }) => (
  <FlatList
    data={stations}
    renderItem={({item}) => (
      <ListItem
        alignItems={"center"}
        title={item.name}
        icon={item.remaining >= 4 ? <Circle color={"lightseagreen"} size={"$2"}/> : item.remaining > 0 ?
          <AlertTriangle color={"orange"} size={"$2"}/> : <X color={"red"} size={"$2"}/>}
        iconAfter={<Text fontSize={"$5"}
                         color={item.remaining <= 0 ? "red" : undefined}>{item.remaining}台</Text>}
      />
    )}
    keyExtractor={(_item, index) => index.toString()}
  />
)

// const LastUpdatedAtTooltip = ({lastUpdatedAt}: { lastUpdatedAt: Date }) => (
//   <Tooltip>
//     <Tooltip.Trigger>
//       <Button icon={<Info/>}/>
//     </Tooltip.Trigger>
//     <Tooltip.Content
//       enterStyle={{x: 0, y: -5, opacity: 0, scale: 0.9}}
//       exitStyle={{x: 0, y: -5, opacity: 0, scale: 0.9}}
//       scale={1}
//       x={0}
//       y={0}
//       opacity={1}
//       animation={[
//         'quick',
//         {
//           opacity: {
//             overshootClamping: true,
//           },
//         },
//       ]}
//     >
//       <Tooltip.Arrow/>
//       <Paragraph size="$2" lineHeight="$1">
//         最終更新: {lastUpdatedAt.toLocaleTimeString(["ja"], {
//         hour: '2-digit',
//         minute: '2-digit'
//       })}
//       </Paragraph>
//     </Tooltip.Content>
//   </Tooltip>
// )

function calculateAvailableBikes(depStations: StationItem[], arrStations: StationItem[]) {
  let rentAvailableTotal = 0;
  depStations.forEach(station => {
    rentAvailableTotal += station.remaining;
  })
  let returnAvailableTotal = 0;
  arrStations.forEach(station => {
    returnAvailableTotal += station.remaining;
  })
  return {rentAvailableTotal, returnAvailableTotal};
}

export default function BicycleCard({dep, arr}: { dep: PointId, arr: PointId }) {
  const [lastUpdatedAt, setLastUpdatedAt] = React.useState<Date>();
  const [depStations, setDepStations] = React.useState<StationItem[]>();
  const [arrStations, setArrStations] = React.useState<StationItem[]>();
  const [rentAvailableTotal, setRentAvailableTotal] = React.useState<number>();
  const [returnAvailableTotal, setReturnAvailableTotal] = React.useState<number>();
  const [availableBikes, setAvailableBikes] = React.useState<number>();

  async function updateData() {
    setLastUpdatedAt(undefined);
    setRentAvailableTotal(undefined);
    setReturnAvailableTotal(undefined);
    setAvailableBikes(undefined);
    setArrStations(undefined);
    setDepStations(undefined);
    try {
      // fetch data from API
      const response = await fetch("https://sfcmove-functions.alpaca131.workers.dev/api/hello-cycling");
      const apiRes: ApiResponse = await response.json();
      if (apiRes) {
        setLastUpdatedAt(new Date(apiRes.lastUpdatedAt));
        const {depStations, arrStations} = calculateAvailableStations(apiRes, dep);
        setDepStations(depStations);
        setArrStations(arrStations);
        const availabilities = calculateAvailableBikes(depStations, arrStations);
        setRentAvailableTotal(availabilities.rentAvailableTotal);
        setReturnAvailableTotal(availabilities.returnAvailableTotal);
        setAvailableBikes(Math.min(availabilities.rentAvailableTotal, availabilities.returnAvailableTotal));
      }
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    updateData().then();
  }, [dep, arr]);
  const getChip = () => {
    if (availableBikes && availableBikes >= 4) {
      return <VacantChip/>
    } else if (rentAvailableTotal !== undefined && rentAvailableTotal <= 0) {
      return <CannotRentChip/>;
    } else if (returnAvailableTotal !== undefined && returnAvailableTotal <= 0) {
      return <CannotReturnChip/>
    } else if (returnAvailableTotal !== undefined && returnAvailableTotal <= 3) {
      return <ReturnWarningChip/>
    } else if (rentAvailableTotal !== undefined && rentAvailableTotal <= 3) {
      return <RentalWarningChip/>
    }
    return null;
  }
  return (
    <Card elevate size="$4" marginTop={"$4"}>
      <Card.Header padded>
        <XStack justifyContent={"space-between"}>
          <YStack>
            <XStack>
              <Bike size={"$2.5"} marginRight={"$1"}/>
              <H4>自転車</H4>
            </XStack>
            <Paragraph theme={"alt2"}>Hello Cycling</Paragraph>
          </YStack>
          <XStack height={"$3"}>
            {getChip()}
            {availableBikes !== undefined ?
              <H4 alignSelf={"center"} color={availableBikes <= 0 ? "red" : undefined}>{availableBikes}台</H4> :
              <Spinner size={"large"} color={"black"}/>}
          </XStack>
        </XStack>
      </Card.Header>
      <YStack paddingHorizontal={"$4"} maxHeight={200}>
        {depStations ? <StationList stations={depStations}/> : <Spinner size={"large"} color={"black"}/>}
        <XStack justifyContent={"center"} marginTop={"$1"}>
          <ChevronDown color={"gray"}/>
        </XStack>
        <Text textAlign={"left"} color={"gray"} marginBottom={"$2"} marginLeft={"$3"}>返却可能台数</Text>
        {arrStations ? <StationList stations={arrStations}/> : <Spinner size={"large"} color={"black"}/>}
      </YStack>
      <Card.Footer paddingHorizontal={"$4"} paddingBottom={"$4"} paddingTop={"$3"}>
        <XStack flex={1} justifyContent={"space-between"}>
          <XStack flex={1} justifyContent={"flex-start"}>
            <Button
              icon={<RefreshCw/>}
              onPress={updateData}
            />
          </XStack>
          <Button
            borderRadius="$10"
            iconAfter={<LogOut/>}
            onPress={() => Linking.openURL("https://www.hellocycling.jp/app/openapp")}
          >
            アプリを開く
          </Button>
        </XStack>
      </Card.Footer>
    </Card>
  )
}
