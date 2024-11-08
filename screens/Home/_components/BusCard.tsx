import {Card, H4, ListItem, Paragraph, Text, YStack} from "tamagui";
import {FlatList} from "react-native";
import {ChevronRight, ChevronsRight} from "@tamagui/lucide-icons";
import * as React from "react";
import {PointId} from "../../../types/points";

interface BusItem {
  destination: string;
  type: "express" | "local";
  time: Date;
}

export default function BusCard({dep, arr}: { dep: PointId, arr: PointId }) {
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
        />
      </YStack>
    </Card>
  )
}
