import {GestureHandlerRootView} from "react-native-gesture-handler";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {H1, H2, H3, Image, Paragraph, Text, XStack, YStack} from "tamagui";
import {TouchableOpacity} from 'react-native';
import {NativeStackScreenProps} from "@react-navigation/native-stack";
import {RootStackParamList} from "../../types/navigation";

export default function TaxiGroupOnboarding({navigation}: NativeStackScreenProps<RootStackParamList>) {
  const styles = useSafeAreaInsets();

  return (
    <GestureHandlerRootView style={{
      paddingTop: styles.top,
      paddingBottom: styles.bottom,
      backgroundColor: "white",
      height: "100%",
      width: "100%"
    }}>
      <YStack paddingHorizontal={"$4"} paddingVertical={"$8"} justifyContent={"space-between"} flex={1}>
        <YStack alignItems={"center"} justifyContent={"center"} flex={1}>
          <Image source={require('../../assets/taxiGroupingFeatureHero.png')} width={400} height={250} borderRadius={25}/>
          <YStack alignItems={"center"} marginTop={"$7"}>
            <Text fontSize={"$9"} fontWeight={"bold"}>タクシーより安く</Text>
            <Text fontSize={"$9"} fontWeight={"bold"}>バスより速く</Text>
          </YStack>
          <Paragraph marginTop={"$6"} width={"80%"} textAlign={"center"}>タクシーを相乗りして、長い列を避けてお得に移動しよう！</Paragraph>
          <Paragraph width={"80%"} textAlign={"center"}>ユーザー名の登録が必要です。</Paragraph>
        </YStack>
        <XStack justifyContent={"center"}>
          <TouchableOpacity
            style={{paddingVertical: 18, paddingHorizontal: 90, borderRadius: 30, backgroundColor: "black"}}
            onPress={() => navigation.replace("TaxiGroupsRegistering")}
          >
            <Text color={"white"} fontWeight={"bold"} fontSize={"$5"}>次へ</Text>
          </TouchableOpacity>
        </XStack>
      </YStack>
    </GestureHandlerRootView>
  )
}
