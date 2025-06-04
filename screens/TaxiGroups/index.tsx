import * as React from 'react';
import {useEffect, useRef, useState} from 'react';
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {Button, Card, Group, H4, Input, Paragraph, Text, XStack, YStack} from "tamagui";
import {ChevronLeft, Minus, Plus, Users} from "@tamagui/lucide-icons";
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from "../../types/navigation";
import {GestureHandlerRootView} from "react-native-gesture-handler";
import {ActivityIndicator, FlatList, RefreshControl} from "react-native";
import {track} from "@amplitude/analytics-react-native";
import {
  createTaxiGroup,
  fetchTaxiGroups,
  getUserTaxiGroup,
  isUserRegistered,
  joinTaxiGroup,
  leaveTaxiGroup,
  markTaxiGroupAsCompleted,
  MAX_PEOPLE_PER_TAXI,
  supabase,
  TaxiGroup
} from "../../services/api";

export default function TaxiGroups({navigation}: NativeStackScreenProps<RootStackParamList>) {
  const styles = useSafeAreaInsets();
  const [taxiGroups, setTaxiGroups] = useState<TaxiGroup[]>([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupPeopleCount, setNewGroupPeopleCount] = useState(1);
  const [newGroupMemo, setNewGroupMemo] = useState('');
  const [newGroupDepFrom, setNewGroupDepFrom] = useState<"station" | "sfc">("station");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [joining, setJoining] = useState(false);
  const [creating, setCreating] = useState(false);
  const [userGroup, setUserGroup] = useState<TaxiGroup | null>(null);
  const [completing, setCompleting] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [depFrom, setDepFrom] = useState<'station' | 'sfc'>('station');
  const [autoRefreshing, setAutoRefreshing] = useState(false);

  // Reference to track if data is currently being loaded
  const isLoadingRef = useRef(false);

  // Function to load taxi groups from Supabase
  const loadTaxiGroups = async () => {
    // Prevent multiple simultaneous data fetches
    if (isLoadingRef.current) return;

    isLoadingRef.current = true;
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
      isLoadingRef.current = false;
    }
  };

  // Function to handle pull-to-refresh
  const onRefresh = async () => {
    // Don't start refreshing if already loading data
    if (isLoadingRef.current) return;

    setRefreshing(true);
    try {
      await loadTaxiGroups();
    } finally {
      setRefreshing(false);
    }
  };

  // Load taxi groups when the component mounts
  useEffect(() => {
    setLoading(true);
    isUserRegistered().then(res => {
      if (!res) navigation.replace('TaxiGroupsOnboarding')
      else {
        // Set loading ref to true to prevent duplicate loading from realtime subscription
        isLoadingRef.current = true;
        loadTaxiGroups().then(() => {
          setLoading(false);
          isLoadingRef.current = false;
        });
      }
    })
    track("Taxi Groups Screen Opened");
  }, []);

  // Function to handle auto-refresh from Supabase Realtime
  const handleAutoRefresh = async () => {
    // Don't start auto-refreshing if already loading data
    if (isLoadingRef.current) return;

    setAutoRefreshing(true);
    try {
      await loadTaxiGroups();
    } finally {
      setAutoRefreshing(false);
    }
  };

  // Set up Supabase Realtime subscription
  useEffect(() => {
    // Create a channel for taxi groups and members
    const channel = supabase
      .channel('taxi-groups-changes')
      .on('postgres_changes', {
        event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'taxi_groups',
      }, () => {
        // Reload data when the taxi_groups table changes
        handleAutoRefresh().then();
      })
      .on('postgres_changes', {
        event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'taxi_group_members',
      }, () => {
        // Reload data when the taxi_group_members table changes
        handleAutoRefresh().then();
      })
      .subscribe();

    // Clean up subscription when component unmounts
    return () => {
      supabase.removeChannel(channel).then();
    };
  }, []);

  // Create a new taxi group
  const handleCreateTaxiGroup = async () => {
    setCreating(true);
    try {
      const newGroup = await createTaxiGroup(newGroupPeopleCount, newGroupMemo, newGroupDepFrom);
      if (newGroup) {
        // Refresh the groups list
        const groups = await fetchTaxiGroups();
        setTaxiGroups(groups);
        setUserGroup(newGroup); // Set the user's group to the newly created one
        setShowCreateGroup(false);
        setNewGroupPeopleCount(1);
        setNewGroupMemo('');
        setDepFrom(newGroupDepFrom); // Update the filter to match the new group's departure station
        setNewGroupDepFrom("station");
        track("Taxi Group Created", {peopleCount: newGroupPeopleCount, depFrom: newGroupDepFrom});
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
            <XStack alignItems="center" marginBottom={"$4"} marginTop={"$3"}>
              <H4 fontWeight={"normal"}>参加中のグループ</H4>
              {autoRefreshing && (
                <XStack marginLeft={"$2"} alignItems="center">
                  <ActivityIndicator size="small" color="black"/>
                  <Paragraph theme="alt2" marginLeft={"$1"} fontSize={"$2"}>自動更新中...</Paragraph>
                </XStack>
              )}
            </XStack>

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
                  <Paragraph theme="alt2" marginTop={"$2"}>
                    グループ作成者: {userGroup.hostName || "不明"}
                  </Paragraph>
                  <Paragraph theme="alt2" marginTop={"$2"}>
                    出発地点: {userGroup.depFrom === "station" ? "湘南台駅" : "SFC"}
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

            <XStack alignItems="center" marginBottom={"$4"}>
              <H4 fontWeight={"normal"}>募集中のグループ</H4>
              {autoRefreshing && (
                <XStack marginLeft={"$2"} alignItems="center">
                  <ActivityIndicator size="small" color="black"/>
                  <Paragraph theme="alt2" marginLeft={"$1"} fontSize={"$2"}>自動更新中...</Paragraph>
                </XStack>
              )}
            </XStack>


            <YStack justifyContent={"center"} width={"100%"} marginBottom={"$2.5"}>
              <Group orientation="horizontal" width={"100%"}>
                <Group.Item>
                  <Button width={"50%"} themeInverse={depFrom === 'sfc'}
                          onPress={() => setDepFrom('sfc')}>SFCから</Button>
                </Group.Item>
                <Group.Item>
                  <Button width={"50%"} themeInverse={depFrom === 'station'}
                          onPress={() => setDepFrom('station')}>湘南台駅から</Button>
                </Group.Item>
              </Group>
            </YStack>

            {/* Filter out the user's current group from the available groups and filter by departure station */}
            <FlatList
              data={taxiGroups.filter(group => (!userGroup || group.id !== userGroup.id) && group.depFrom === depFrom)}
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
                      <Paragraph theme="alt2" marginTop={"$1"}>
                        グループ作成者: {item.hostName || "不明"}
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
              ListEmptyComponent={(
                <YStack justifyContent="center" alignItems="center" flex={1}>
                  <Paragraph theme="alt2">現在募集中のグループはありません</Paragraph>
                  <Paragraph theme="alt2">新しいグループを作成してください</Paragraph>
                </YStack>
              )}
              keyExtractor={item => item.id}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={["black"]}
                  tintColor={"black"}
                />
              }
            />

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

            <Paragraph marginBottom={"$2"} size={"$5"}>
              出発地点
            </Paragraph>

            <XStack marginBottom={"$3"}>
              <Button
                flex={1}
                marginRight={"$2"}
                themeInverse={newGroupDepFrom === "station"}
                onPress={() => setNewGroupDepFrom("station")}
              >
                湘南台駅
              </Button>
              <Button
                flex={1}
                themeInverse={newGroupDepFrom === "sfc"}
                onPress={() => setNewGroupDepFrom("sfc")}
              >
                SFC
              </Button>
            </XStack>

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
