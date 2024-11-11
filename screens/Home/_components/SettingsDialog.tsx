import React, {useEffect, useRef} from 'react';
import {Modalize} from 'react-native-modalize';
import {View} from 'react-native';
import {Label, Separator, Switch, XStack} from 'tamagui';
import {AppSettings, SettingsKey} from "../../../types/settings";

interface SettingsDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  settings: AppSettings;
  setSettings: (settings: AppSettings) => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({open, setOpen, settings, setSettings}) => {
  const modalizeRef = useRef<Modalize>(null);

  function switchPref(key: SettingsKey) {
    setSettings({...settings, [key]: !settings[key]});
  }

  useEffect(() => {
    if (open) {
      modalizeRef.current?.open();
    } else {
      modalizeRef.current?.close();
    }
  }, [open]);

  function handleClose() {
    setOpen(false);
  }

  return (
    <Modalize
      ref={modalizeRef}
      onClosed={handleClose}
      adjustToContentHeight
      handlePosition="inside"
      modalStyle={{paddingHorizontal: 20}}
    >
      <View style={{paddingTop: 20, paddingBottom: 30}}>
        <XStack justifyContent="space-between" alignItems="center" marginBottom={20}>
          <Label fontSize={18}>アプリ設定</Label>
        </XStack>
        <XStack alignItems="center" justifyContent="space-between">
          <Label paddingRight="$0" minWidth={90} size="$3">
            位置情報に基づいて行先を提案
          </Label>
          <XStack justifyContent="flex-end">
            <Separator minHeight={20} vertical marginRight="$3"/>
            <Switch
              size="$3"
              checked={settings.locationBasedSuggestEnabled}
              borderColor="#e6e6e6"
              onCheckedChange={() => switchPref('locationBasedSuggestEnabled')}
            >
              <Switch.Thumb animation="quicker" theme="orange"/>
            </Switch>
          </XStack>
        </XStack>
      </View>
    </Modalize>
  );
};

export default SettingsDialog;
