import {Button, Card, H4, ListItem, Paragraph, Spinner, Text, XStack, YStack} from "tamagui";
import {FlatList} from "react-native";
import {AlertTriangle, Bike, ChevronDown, Circle, LogOut, RefreshCw, Settings2, X} from "@tamagui/lucide-icons";
import * as React from "react";
import {useEffect} from "react";
import * as Linking from 'expo-linking';
import {PointId} from "../../../types/points";
import {ApiResponse} from "../../../types/hello-cycling";
import {CannotRentChip, CannotReturnChip, RentalWarningChip, ReturnWarningChip, VacantChip} from "./BicycleChips";
import {getData, storeJsonData} from "../../../utils/storage";
import PrefDialog from "./PrefDialog";
import {track} from "@amplitude/analytics-react-native";

interface StationItem {
  name: string;
  remaining: number;
}

type PrefKey = "includeEast";

type BicycleCardPref = Record<PrefKey, boolean>;

function calculateAvailableStations(apiRes: ApiResponse, dep: PointId, includeEast: boolean) {
  const depStations: StationItem[] = [];
  const arrStations: StationItem[] = [];
  // combine west and east
  const shonandaiStations = includeEast ? apiRes.stations.shonandai_west.concat(apiRes.stations.shonandai_east) : apiRes.stations.shonandai_west;
  if (dep == "shonandai") {
    shonandaiStations.forEach(station => {
      depStations.push({
        name: station.name,
        remaining: station.num_bikes_available
      });
    })
    apiRes.stations.sfc.forEach(station => {
      arrStations.push({
        name: station.name,
        remaining: station.num_docks_available
      });
    })
  } else {
    apiRes.stations.sfc.forEach(station => {
      depStations.push({
        name: station.name,
        remaining: station.num_bikes_available
      });
    })
    shonandaiStations.forEach(station => {
      arrStations.push({
        name: station.name,
        remaining: station.num_docks_available
      });
    })
  }
  // sort by remaining bikes
  depStations.sort((a, b) => b.remaining - a.remaining);
  arrStations.sort((a, b) => b.remaining - a.remaining);
  return {depStations, arrStations};
}

const StationList = ({stations}: { stations: StationItem[] }) => (
  <>
    {stations.length > 1 ?
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
      :
      <ListItem
        alignItems={"center"}
        title={stations[0].name}
        icon={stations[0].remaining >= 4 ? <Circle color={"lightseagreen"} size={"$2"}/> : stations[0].remaining > 0 ?
          <AlertTriangle color={"orange"} size={"$2"}/> : <X color={"red"} size={"$2"}/>}
        iconAfter={<Text fontSize={"$5"}
                         color={stations[0].remaining <= 0 ? "red" : undefined}>{stations[0].remaining}台</Text>}
      />
    }
  </>
)


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
  const [depStations, setDepStations] = React.useState<StationItem[]>();
  const [arrStations, setArrStations] = React.useState<StationItem[]>();
  const [rentAvailableTotal, setRentAvailableTotal] = React.useState<number>();
  const [returnAvailableTotal, setReturnAvailableTotal] = React.useState<number>();
  const [availableBikes, setAvailableBikes] = React.useState<number>();
  const [openPrefDialog, setOpenPrefDialog] = React.useState(false);
  const [pref, setPref] = React.useState<BicycleCardPref>();

  function clearAllStates() {
    setRentAvailableTotal(undefined);
    setReturnAvailableTotal(undefined);
    setAvailableBikes(undefined);
    setArrStations(undefined);
    setDepStations(undefined);
  }

  async function updateData(includeEast: boolean) {
    try {
      // fetch data from API
      const response = await fetch("https://sfcmove-functions.kota113.com/api/hello-cycling");
      const apiRes: ApiResponse = await response.json();
      if (apiRes) {
        const {depStations, arrStations} = calculateAvailableStations(apiRes, dep, includeEast);
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
    getData(`bicycle-pref`).then((res: BicycleCardPref) => {
      let pref: BicycleCardPref = {includeEast: false}
      if (res) {
        pref = res;
      }
      setPref(pref)
      clearAllStates();
      updateData(pref.includeEast).then();
    });
  }, [dep, arr]);
  useEffect(() => {
    const interval = setInterval(() => {
      if (pref) {
        updateData(pref.includeEast).then();
      }
    }, 60000); // 60000 ms = 1 minute
    return () => clearInterval(interval);
  }, [pref, dep, arr]);
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
    // memo: BicycleCardもmaxHeightを値指定、flex={1}にした方がいいかも。
    <>
      <Card elevate size="$4" marginTop={"$4"} maxHeight={"55%"}>
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
                <XStack>
                  <H4 alignSelf={"center"} color={"gray"}>残り</H4>
                  <H4 alignSelf={"center"} color={availableBikes <= 0 ? "gray" : undefined}>{availableBikes}台</H4>
                </XStack> :
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
                onPress={() => {
                  clearAllStates();
                  updateData(pref?.includeEast || false).then();
                  track("BicycleCard Refreshed", {
                    availableBikes: availableBikes
                  });
                }}
              />
              <Button
                marginLeft={"$1.5"}
                icon={<Settings2/>}
                onPress={() => setOpenPrefDialog(true)}
              />
            </XStack>
            <Button
              borderRadius="$10"
              iconAfter={<LogOut/>}
              onPress={() => Linking.openURL("https://www.hellocycling.jp/app/openapp")}
            >
              レンタル
            </Button>
          </XStack>
        </Card.Footer>
      </Card>
      {pref !== undefined &&
          <PrefDialog open={openPrefDialog} setOpen={setOpenPrefDialog} pref={pref} setPref={(pref) => {
            setPref(pref);
            storeJsonData(`bicycle-pref`, pref).then();
            clearAllStates();
            updateData(pref.includeEast).then();
          }}/>
      }
    </>
  )
}
