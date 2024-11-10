import React, {useEffect, useRef} from 'react';
import {Modalize} from 'react-native-modalize';
import {View} from 'react-native';
import {Label, Separator, Switch, XStack} from 'tamagui';

type PrefKey = 'includeEast';

interface BicycleCardPref {
  includeEast: boolean;
}

interface PrefDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  pref: BicycleCardPref;
  setPref: (pref: BicycleCardPref) => void;
}

const PrefDialog: React.FC<PrefDialogProps> = ({open, setOpen, pref, setPref}) => {
  const modalizeRef = useRef<Modalize>(null);

  function switchPref(key: PrefKey) {
    setPref({...pref, [key]: !pref[key]});
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
          <Label fontSize={18}>設定</Label>
        </XStack>
        <XStack alignItems="center" justifyContent="space-between">
          <Label paddingRight="$0" minWidth={90} size="$3">
            東口を含める
          </Label>
          <XStack justifyContent="flex-end">
            <Separator minHeight={20} vertical marginRight="$3"/>
            <Switch
              size="$3"
              checked={pref.includeEast}
              borderColor="#e6e6e6"
              onCheckedChange={() => switchPref('includeEast')}
            >
              <Switch.Thumb animation="quicker" theme="orange"/>
            </Switch>
          </XStack>
        </XStack>
      </View>
    </Modalize>
  );
};

export default PrefDialog;
