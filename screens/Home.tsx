import * as React from 'react'
import {FlatList, View} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {Button, Card, H4, ListItem, Paragraph, Text, XStack, YStack} from "tamagui";
import {
  AlertTriangle,
  ArrowRightLeft,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronsRight,
  Circle,
  LogOut,
  X
} from "@tamagui/lucide-icons";


interface BusItem {
  destination: string;
  type: "express" | "local";
  time: Date;
}


function BicycleCard() {
  return (
    <Card elevate size="$4" marginTop={"$4"}>
      <Card.Header padded>
        <XStack justifyContent={"space-between"}>
          <YStack>
            <H4>自転車</H4>
            <Paragraph theme={"alt2"}>Hello Cycling</Paragraph>
          </YStack>
          <XStack height={"$3"}>
            {/*<X color={"red"} alignSelf={"center"} marginRight={4} size={"$2"}/>*/}
            {/*<YStack justifyContent={"center"} backgroundColor={"red"} paddingHorizontal={"$2"} borderRadius={"$radius.3"} marginRight={"$2"}>*/}
            {/*  <Text fontSize={"$4"} fontWeight={"bold"} color={"white"}>返却不可</Text>*/}
            {/*</YStack>*/}
            {/*<YStack justifyContent={"center"} backgroundColor={"orange"} paddingHorizontal={"$2"} borderRadius={"$radius.3"} marginRight={"$2"}>*/}
            {/*  <Text fontSize={"$4"} fontWeight={"bold"} color={"white"}>返却予約推奨</Text>*/}
            {/*</YStack>*/}
            <YStack justifyContent={"center"} backgroundColor={"lightseagreen"} paddingHorizontal={"$2"} borderRadius={"$radius.3"} marginRight={"$2"}>
              <Text fontSize={"$4"} fontWeight={"bold"} color={"white"}>余裕あり</Text>
            </YStack>
            <H4 alignSelf={"center"}>15台</H4>
          </XStack>
        </XStack>
      </Card.Header>
      <YStack paddingHorizontal={"$4"} maxHeight={190}>
        <FlatList
          data={[
            {name: "慶應義塾大学 湘南藤沢キャンパス", remaining: 15},
          ]}
          renderItem={({ item }) => (
            <ListItem
              title={item.name}
              icon={item.remaining >= 4? <Check color={"lightseagreen"} size={"$2"}/>: <AlertTriangle color={"orange"} size={"$2"}/>}
              iconAfter={<Text fontSize={"$5"}>{item.remaining}台</Text>}
            />
          )}
          keyExtractor={(item, index) => index.toString()}
        />
        <XStack justifyContent={"center"} marginTop={"$1"}>
          <ChevronDown color={"gray"}/>
        </XStack>
        <Text textAlign={"center"} color={"gray"} marginBottom={"$2"}>返却可能ステーション</Text>
        <FlatList
          data={[
            {name: "湘南台駅西口 歩道", remaining: 4},
            {name: "ダイエー 湘南台店", remaining: 4},
            {name: "湘南台二丁目 ファミリーマート", remaining: 0},
          ]}
          renderItem={({ item }) => (
            <ListItem
              alignItems={"center"}
              title={item.name}
              icon={item.remaining >= 4? <Circle color={"lightseagreen"} size={"$2"}/>: item.remaining > 0? <AlertTriangle color={"orange"} size={"$2"}/>: <X color={"red"} size={"$2"}/>}
              iconAfter={<Text fontSize={"$5"} color={item.remaining <= 0? "red": undefined}>{item.remaining}台</Text>}
            />
          )}
          keyExtractor={(item, index) => index.toString()}
        />
      </YStack>
      <Card.Footer paddingHorizontal={"$4"} paddingBottom={"$4"} paddingTop={"$3"}>
        <XStack flex={1} />
        <Button borderRadius="$10" iconAfter={<LogOut/>}>
          アプリを開く
        </Button>
      </Card.Footer>
    </Card>
  )
}


function BusCard() {
  return (
    <Card elevate size="$4" marginTop={"$3"}>
      <Card.Header>
        <H4>バス</H4>
        <Paragraph theme={"alt2"}>神奈川中央交通</Paragraph>
      </Card.Header>
      <YStack paddingHorizontal={"$4"} paddingBottom={"$4"} maxHeight={220}>
        <FlatList
          data={[
            {destination: "湘南台", type: "express", time: new Date()},
            {destination: "湘南台", type: "local", time: new Date()},
            {destination: "湘南台", type: "local", time: new Date()},
            {destination: "湘南台", type: "express", time: new Date()},
            {destination: "湘南台", type: "local", time: new Date()},
            {destination: "湘南台", type: "local", time: new Date()},
            {destination: "湘南台", type: "express", time: new Date()},
          ]}
          renderItem={({ item }: {item: BusItem}) => (
            <ListItem
              title={`${item.destination} 行き`}
              subTitle={item.type === "express"? "急行": "普通"}
              icon={item.type === "express"? <ChevronsRight backgroundColor={"orange"} borderRadius={"$radius.1"} size={"$2"} />: <ChevronRight backgroundColor={"lightseagreen"} borderRadius={"$radius.1"} size={"$2"} />}
              iconAfter={<Text fontSize={"$6"}>{item.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>}
            />
          )}
          keyExtractor={(item, index) => index.toString()}
        />
      </YStack>
    </Card>
  )
}


export default function Home() {
  const styles = useSafeAreaInsets();
  return (
    <View style={{...styles, backgroundColor: "white", height: "100%", width: "100%"}}>
      <XStack paddingHorizontal={"$5"} paddingTop={"$3"} alignItems={"center"} justifyContent={"space-between"}>
        <XStack>
          <Text fontSize={"$8"} marginVertical={"auto"}>湘南台駅</Text>
          <Text fontSize={"$8"} color={"gray"} marginHorizontal={"$2"}>から</Text>
          <Text fontSize={"$8"} marginVertical={"auto"}>SFC</Text>
        </XStack>
        <XStack>
          <Button icon={<ArrowRightLeft/>}>
            逆方向
          </Button>
        </XStack>
      </XStack>
      <YStack paddingHorizontal={15}>
        <BusCard/>
        <BicycleCard/>
      </YStack>
    </View>
  );
}
