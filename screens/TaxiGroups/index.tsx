import * as React from 'react';
import {useEffect, useState} from 'react';
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {Button, Card, H4, Input, Paragraph, Text, XStack, YStack} from "tamagui";
import {ChevronLeft, Minus, Plus, Users} from "@tamagui/lucide-icons";
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from "../../types/navigation";
import {GestureHandlerRootView} from "react-native-gesture-handler";
import {ActivityIndicator, FlatList} from "react-native";
import {track} from "@amplitude/analytics-react-native";
import {
  createTaxiGroup,
  fetchTaxiGroups,
  getUserTaxiGroup,
  joinTaxiGroup,
  leaveTaxiGroup,
  markTaxiGroupAsCompleted,
  MAX_PEOPLE_PER_TAXI,
  TaxiGroup
} from "../../services/api";

export default function TaxiGroups() {
  const styles = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [taxiGroups, setTaxiGroups] = useState<TaxiGroup[]>([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupPeopleCount, setNewGroupPeopleCount] = useState(1);
  const [newGroupMemo, setNewGroupMemo] = useState('');
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [creating, setCreating] = useState(false);
  const [userGroup, setUserGroup] = useState<TaxiGroup | null>(null);
  const [completing, setCompleting] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // Load taxi groups from Supabase
  useEffect(() => {
    const loadTaxiGroups = async () => {
      setLoading(true);
      try {
        // Get the user's current group
        const currentGroup = await getUserTaxiGroup();
        setUserGroup(currentGroup);

        // Get all taxi groups
        const groups = await fetchTaxiGroups();
        setTaxiGroups(groups);
      } catch (error) {
        console.error('Error loading taxi groups:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTaxiGroups();
    track("Taxi Groups Screen Opened");
  }, []);

  // Create a new taxi group
  const handleCreateTaxiGroup = async () => {
    setCreating(true);
    try {
      const newGroup = await createTaxiGroup(newGroupPeopleCount, newGroupMemo);
      if (newGroup) {
        // Refresh the groups list
        const groups = await fetchTaxiGroups();
        setTaxiGroups(groups);
        setUserGroup(newGroup); // Set the user's group to the newly created one
        setShowCreateGroup(false);
        setNewGroupPeopleCount(1);
        setNewGroupMemo('');
        track("Taxi Group Created", {peopleCount: newGroupPeopleCount});
      }
    } catch (error) {
      console.error('Error creating taxi group:', error);
    } finally {
      setCreating(false);
    }
  };

  // Join an existing taxi group
  const handleJoinTaxiGroup = async (groupId: string) => {
    setJoining(true);
    try {
      const success = await joinTaxiGroup(groupId);
      if (success) {
        // Refresh the groups list and user's group
        const groups = await fetchTaxiGroups();
        setTaxiGroups(groups);
        const currentGroup = await getUserTaxiGroup();
        setUserGroup(currentGroup);
        track("Joined Taxi Group", {groupId});
      }
    } catch (error) {
      console.error('Error joining taxi group:', error);
    } finally {
      setJoining(false);
    }
  };

  // Mark a taxi group as completed
  const handleCompleteGroup = async (groupId: string) => {
    setCompleting(true);
    try {
      const success = await markTaxiGroupAsCompleted(groupId);
      if (success) {
        // Refresh the groups list and user's group
        const groups = await fetchTaxiGroups();
        setTaxiGroups(groups);
        setUserGroup(null); // Clear the user's group since it's now completed
        track("Completed Taxi Group", {groupId});
      }
    } catch (error) {
      console.error('Error completing taxi group:', error);
    } finally {
      setCompleting(false);
    }
  };

  // Leave a taxi group
  const handleLeaveGroup = async (groupId: string) => {
    setLeaving(true);
    try {
      const success = await leaveTaxiGroup(groupId);
      if (success) {
        // Refresh the groups list and user's group
        const groups = await fetchTaxiGroups();
        setTaxiGroups(groups);
        setUserGroup(null); // Clear the user's group since they've left
        track("Left Taxi Group", {groupId});
      }
    } catch (error) {
      console.error('Error leaving taxi group:', error);
    } finally {
      setLeaving(false);
    }
  };

  // Format date to display time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
  };

  return (
    <GestureHandlerRootView style={{
      paddingTop: styles.top,
      paddingBottom: styles.bottom,
      backgroundColor: "white",
      height: "100%",
      width: "100%"
    }}>
      <XStack paddingHorizontal={"$5"} paddingTop={"$3"} paddingBottom={"$3"} alignItems={"center"}>
        <ChevronLeft size={25} color={"black"} onPress={() => navigation.goBack()}/>
        <Text fontSize={"$8"} marginLeft={"$4"}>タクシー相乗り</Text>
      </XStack>

      <YStack paddingHorizontal={"$5"} flex={1}>
        {loading ? (
          <YStack justifyContent="center" alignItems="center" flex={1}>
            <ActivityIndicator size="large" color="black"/>
            <Paragraph theme="alt2" marginTop={"$4"}>読み込み中...</Paragraph>
          </YStack>
        ) : !showCreateGroup ? (
          <>
            <H4 marginBottom={"$4"} fontWeight={"normal"} marginTop={"$3"}>参加中のグループ</H4>

            {userGroup ? (
              <Card marginBottom={"$5"} padding={"$4"} backgroundColor={"$blue2"}>
                <YStack>
                  <XStack alignItems="center" marginBottom={"$2"}>
                    <Users size={"$1"} marginRight={"$2"}/>
                    <Text fontSize={"$6"} fontWeight="bold">
                      {userGroup.peopleCount} / {userGroup.maxPeople} 人
                    </Text>
                  </XStack>
                  <Paragraph theme="alt2">
                    作成時間: {formatTime(userGroup.createdAt)}
                  </Paragraph>
                  {userGroup.memo && (
                    <Paragraph marginTop={"$2"}>
                      メモ: {userGroup.memo}
                    </Paragraph>
                  )}
                  <Paragraph theme="alt2" marginTop={"$2"}>
                    あなたはこのグループに参加しています
                  </Paragraph>

                  {/* Show complete button only if user is the host */}
                  {userGroup.isUserHost ? (
                    <Button
                      marginTop={"$3"}
                      theme="destructive"
                      disabled={completing}
                      onPress={() => handleCompleteGroup(userGroup.id)}
                    >
                      {completing ? '処理中...' : 'グループを完了する'}
                    </Button>
                  ) : (
                    /* Show leave button only if user is not the host */
                    <Button
                      marginTop={"$3"}
                      theme="destructive"
                      disabled={leaving}
                      onPress={() => handleLeaveGroup(userGroup.id)}
                    >
                      {leaving ? '処理中...' : 'グループを退出する'}
                    </Button>
                  )}
                </YStack>
              </Card>
            ) : (
              <Paragraph theme="alt2" marginBottom={"$4"}>
                あなたは現在どのグループにも参加していません
              </Paragraph>
            )}

            <H4 marginBottom={"$4"} fontWeight={"normal"}>募集中のグループ</H4>

            {/* Filter out the user's current group from the available groups */}
            {taxiGroups.filter(group => !userGroup || group.id !== userGroup.id).length === 0 ? (
              <YStack justifyContent="center" alignItems="center" flex={1}>
                <Paragraph theme="alt2">現在アクティブなグループはありません</Paragraph>
                <Paragraph theme="alt2">新しいグループを作成してください</Paragraph>
              </YStack>
            ) : (
              <FlatList
                data={taxiGroups.filter(group => !userGroup || group.id !== userGroup.id)}
                renderItem={({item}) => (
                  <Card marginBottom={"$3"} padding={"$4"}>
                    <XStack justifyContent="space-between" alignItems="center">
                      <YStack>
                        <XStack alignItems="center">
                          <Users size={"$1"} marginRight={"$2"}/>
                          <Text fontSize={"$6"} fontWeight="bold">
                            {item.peopleCount} / {item.maxPeople} 人
                          </Text>
                        </XStack>
                        <Paragraph theme="alt2" marginTop={"$1"}>
                          作成時間: {formatTime(item.createdAt)}
                        </Paragraph>
                        {item.memo && (
                          <Paragraph marginTop={"$1"}>
                            メモ: {item.memo}
                          </Paragraph>
                        )}
                      </YStack>
                      <Button
                        disabled={item.peopleCount >= item.maxPeople || userGroup !== null || joining}
                        onPress={() => handleJoinTaxiGroup(item.id)}
                      >
                        {joining ? '処理中...' : '参加する'}
                      </Button>
                    </XStack>
                  </Card>
                )}
                keyExtractor={item => item.id}
              />
            )}

            <Button
              position="absolute"
              bottom={20}
              alignSelf="center"
              size="$5"
              icon={<Plus/>}
              disabled={userGroup !== null}
              onPress={() => setShowCreateGroup(true)}
            >
              新しいグループを作成
            </Button>
          </>
        ) : (
          <YStack padding={"$4"} flex={1}>
            <H4 marginBottom={"$5"}>新しいグループを作成</H4>

            <Paragraph marginBottom={"$2"} size={"$5"}>
              現在の人数
            </Paragraph>

            <XStack marginBottom={"$3"}>
              <Button
                disabled={newGroupPeopleCount <= 1}
                onPress={() => setNewGroupPeopleCount(prev => Math.max(1, prev - 1))}
                marginRight={"$2"}
              >
                <Minus size={16}/>
              </Button>
              <Button marginRight={"$2"} disabled>
                <Paragraph>{newGroupPeopleCount} 人</Paragraph>
              </Button>
              <Button
                disabled={newGroupPeopleCount >= MAX_PEOPLE_PER_TAXI}
                onPress={() => setNewGroupPeopleCount(prev => Math.min(MAX_PEOPLE_PER_TAXI, prev + 1))}
              >
                <Plus size={16}/>
              </Button>
            </XStack>

            <Paragraph theme="alt2" marginBottom={"$3"}>
              タクシー1台に乗れる最大人数は {MAX_PEOPLE_PER_TAXI} 人です
            </Paragraph>

            <Input
              placeholder="メモ（例: 湘南台駅のタクシー乗り場にいます）"
              value={newGroupMemo}
              onChangeText={setNewGroupMemo}
              marginBottom={"$4"}
            />

            <XStack>
              <Button
                flex={1}
                marginRight={"$2"}
                theme="alt2"
                onPress={() => {
                  setShowCreateGroup(false);
                  setNewGroupPeopleCount(1);
                  setNewGroupMemo('');
                }}
              >
                キャンセル
              </Button>
              <Button
                flex={1}
                theme="active"
                disabled={creating}
                onPress={handleCreateTaxiGroup}
              >
                {creating ? '作成中...' : '作成する'}
              </Button>
            </XStack>
          </YStack>
        )}
      </YStack>
    </GestureHandlerRootView>
  );
}
