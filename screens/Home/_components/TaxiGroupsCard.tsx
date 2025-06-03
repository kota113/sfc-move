import * as React from 'react';
import {Card, H4, XStack} from "tamagui";
import {CarTaxiFront, ChevronRight} from "@tamagui/lucide-icons";
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from "../../../types/navigation";
import {track} from "@amplitude/analytics-react-native";


export default function TaxiGroupsCard() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handlePress = () => {
    track("Taxi Groups Card Pressed");
    navigation.navigate("TaxiGroups");
  };

  return (
    <Card elevate size="$4" marginTop={"$2"} onPress={handlePress}>
      <Card.Header>
        <XStack justifyContent={"space-between"} alignItems={"center"}>
          <XStack>
            <CarTaxiFront size={"$2.5"} marginRight={"$2"}/>
            <H4>タクシー相乗り</H4>
          </XStack>
          <ChevronRight/>
        </XStack>
      </Card.Header>
    </Card>
  );
}
