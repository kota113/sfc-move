import {AlertDialog, Button, Text, XStack, YStack} from "tamagui";

export function FirstLaunchDialog(
  {open, setOpen, enableLocationBasedSuggestion}:
    {
      open: boolean,
      setOpen: (open: boolean) => void,
      enableLocationBasedSuggestion: () => void
    }) {
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay
          key="overlay"
          animation="quick"
          opacity={0.5}
          enterStyle={{opacity: 0}}
          exitStyle={{opacity: 0}}
        />
        <AlertDialog.Content
          bordered
          elevate
          key="content"
          animation={[
            'quick',
            {
              opacity: {
                overshootClamping: true,
              },
            },
          ]}
          enterStyle={{x: 0, y: -20, opacity: 0, scale: 0.9}}
          exitStyle={{x: 0, y: 10, opacity: 0, scale: 0.95}}
        >
          <YStack maxHeight={165} flex={1} justifyContent={"space-between"}>
            <AlertDialog.Title fontSize={"$8"}>位置情報の利用</AlertDialog.Title>
            <AlertDialog.Description>
              <YStack>
                <Text fontSize={16}>現在地から行き先を設定しますか？</Text>
                <Text fontSize={16}>設定からいつでも変更できます。</Text>
              </YStack>
            </AlertDialog.Description>

            <XStack gap="$3" marginTop={10} justifyContent="flex-end">
              <AlertDialog.Cancel asChild>
                <Button>いいえ</Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button theme="active" onPress={enableLocationBasedSuggestion}>はい</Button>
              </AlertDialog.Action>
            </XStack>
          </YStack>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog>
  )
}
