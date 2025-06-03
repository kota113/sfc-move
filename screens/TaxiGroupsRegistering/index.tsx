import {GestureHandlerRootView} from "react-native-gesture-handler";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {Paragraph, Text, XStack, YStack} from "tamagui";
import {Alert, TextInput, TouchableOpacity} from "react-native"
import {useState} from "react";
import {NativeStackScreenProps} from "@react-navigation/native-stack";
import {RootStackParamList} from "../../types/navigation";
import {track} from "@amplitude/analytics-react-native";
import {registerUser} from "../../services/api"

export default function TaxiGroupsRegistering({navigation}: NativeStackScreenProps<RootStackParamList>) {
  const styles = useSafeAreaInsets();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  function onRegister() {
    if (!email.endsWith('@keio.jp')) {
      Alert.alert("利用にはkeio.jpで終わるアドレスが必要です。")
      return
    } else if (username.length < 2) {
      Alert.alert("有効な名前を入力してください")
      return
    }
    registerUser(email, username).then(() => {
      track("User registered");
      navigation.navigate("TaxiGroups")
    })
  }
  return (
    <GestureHandlerRootView style={{
      paddingTop: styles.top,
      paddingBottom: styles.bottom,
      backgroundColor: "white",
      height: "100%",
      width: "100%"
    }}>
      <YStack flex={1} justifyContent={"center"} alignItems={"center"}>
        <YStack width={"70%"}>
          <Paragraph theme={"alt"} marginBottom={"$2"}>名前を入力</Paragraph>
          <TextInput style={{borderRadius: 10, backgroundColor: "#e3e3e3", paddingHorizontal: 15, fontSize: 20}} onChangeText={setUsername}/>
          <Paragraph theme={"alt2"} marginTop={"$1"}>相乗りする他のユーザーに公開されます</Paragraph>
        </YStack>
        <YStack width={"70%"} marginTop={"$7"}>
          <Paragraph theme={"alt"} marginBottom={"$2"}>keio.jpアドレスを入力</Paragraph>
          <TextInput style={{borderRadius: 10, backgroundColor: "#e3e3e3", paddingHorizontal: 15, fontSize: 13}} onChangeText={setEmail}/>
          <Paragraph theme={"alt2"} marginTop={"$1"}>他のユーザーには公開されません</Paragraph>
        </YStack>
      </YStack>
      <XStack  justifyContent={"center"} paddingBottom={"$8"}>
        <TouchableOpacity
          style={{paddingVertical: 18, paddingHorizontal: 90, borderRadius: 30, backgroundColor: "black"}}
          onPress={onRegister}
        >
          <Text color={"white"} fontWeight={"bold"} fontSize={"$5"}>完了</Text>
        </TouchableOpacity>
      </XStack>
    </GestureHandlerRootView>
  )
}
