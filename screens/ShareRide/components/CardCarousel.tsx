import * as React from "react";
import {Dimensions, View} from "react-native";
import Carousel, {ICarouselInstance,} from "react-native-reanimated-carousel";
import {Button, Card, H3, Paragraph, Text, XStack} from "tamagui";
import {Car, CarTaxiFront, ChevronRight} from "@tamagui/lucide-icons";

const width = Dimensions.get("window").width;

interface RideOfferItem {
  time: Date,
  type: "taxi" | "car",
  hostUserId: string,
  // todo: Userオブジェクトにする
  destination: string,
  capacity: number,
  passengerCount: number
}

export default function CardCarousel({data}: { data: RideOfferItem[] }) {
  const ref = React.useRef<ICarouselInstance>(null);

  const cardHeight = width / 2;

  return (
    <View style={{position: "absolute", zIndex: 1, bottom: 0}}>
      <Carousel
        ref={ref}
        width={width}
        mode={"parallax"}
        height={cardHeight}
        data={data}
        onProgressChange={() => {
          // todo: something here

        }}
        renderItem={({item}) => {
          // todo: バス時刻と共通の処理なのでutilsにまとめる
          const remainingTime = item.time.getTime() - new Date().getTime();
          const timeStr = remainingTime <= 300000 ? `あと${Math.max(0, Math.floor(remainingTime / 60000))}分` :
            item.time.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit"
            })
          return (
            <Card elevate size="$5" bordered height={cardHeight}>
              <Card.Header padded>
                <XStack justifyContent={"space-between"}>
                  <XStack>
                    {item.type == "taxi" ? <CarTaxiFront size={37} marginRight={7}/> : <Car size={37} marginRight={7}/>}
                    <Text fontSize={25} fontWeight={"bold"}>{timeStr}</Text>
                  </XStack>
                  <H3>200円</H3>
                </XStack>
                <Paragraph theme="alt">{item.type == "taxi" ? "タクシー" : "学生の車"}</Paragraph>
                <Paragraph theme="alt2">{item.hostUserId}</Paragraph>
              </Card.Header>
              <Card.Footer padded>
                <XStack flex={1}/>
                <Button borderRadius="$10" fontSize={18} size={"$5"}>
                  乗車
                  <ChevronRight/>
                </Button>
              </Card.Footer>
            </Card>
          )
        }}
      />
    </View>
  );
}
