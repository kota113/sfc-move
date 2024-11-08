import {Text, YStack} from "tamagui";
import * as React from "react";

export const VacantChip = () => (
  <YStack justifyContent={"center"} backgroundColor={"lightseagreen"} paddingHorizontal={"$2"}
          borderRadius={"$radius.3"} marginRight={"$2"}>
    <Text fontSize={"$4"} fontWeight={"bold"} color={"white"}>余裕あり</Text>
  </YStack>
)

export const ReturnWarningChip = () => (
  <YStack justifyContent={"center"} backgroundColor={"orange"} paddingHorizontal={"$2"} borderRadius={"$radius.3"}
          marginRight={"$2"}>
    <Text fontSize={"$4"} fontWeight={"bold"} color={"white"}>返却予約推奨</Text>
  </YStack>
)

export const RentalWarningChip = () => (
  <YStack justifyContent={"center"} backgroundColor={"orange"} paddingHorizontal={"$2"} borderRadius={"$radius.3"}
          marginRight={"$2"}>
    <Text fontSize={"$4"} fontWeight={"bold"} color={"white"}>車両予約推奨</Text>
  </YStack>
)

export const CannotReturnChip = () => (
  <YStack justifyContent={"center"} backgroundColor={"red"} paddingHorizontal={"$2"} borderRadius={"$radius.3"}
          marginRight={"$2"}>
    <Text fontSize={"$4"} fontWeight={"bold"} color={"white"}>返却不可</Text>
  </YStack>
)

export const CannotRentChip = () => (
  <YStack justifyContent={"center"} backgroundColor={"red"} paddingHorizontal={"$2"} borderRadius={"$radius.3"}
          marginRight={"$2"}>
    <Text fontSize={"$4"} fontWeight={"bold"} color={"white"}>レンタル不可</Text>
  </YStack>
)
