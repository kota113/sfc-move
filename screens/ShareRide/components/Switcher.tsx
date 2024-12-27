import React, {useRef, useState} from 'react';
import {Animated, Easing, Pressable, StyleSheet, Text, View,} from 'react-native';

interface SwitcherProps {
  paddingTop: number;
  firstLabel: string;
  secondLabel: string;
  onToggle?: (activeIndex: number) => void;
}

const Switcher: React.FC<SwitcherProps> = (
  {
    paddingTop,
    firstLabel,
    secondLabel,
    onToggle,
  }) => {
  // 0 -> first option, 1 -> second option
  const [activeIndex, setActiveIndex] = useState<number>(0);

  // Animated value to move the pill horizontally
  const translateXValue = useRef(new Animated.Value(0)).current;

  const handleToggle = (index: number) => {
    if (index === activeIndex) return;

    setActiveIndex(index);
    onToggle?.(index);

    // Animate the sliding pill
    Animated.timing(translateXValue, {
      toValue: index, // 0 or 1
      duration: 200,
      useNativeDriver: false,
      easing: Easing.bezier(0.4, 0.0, 0.2, 1),
    }).start();
  };

  // Interpolate translateXValue to slide the inner pill
  const pillTranslateX = translateXValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 100], // adjust to match 2 options
  });

  return (
    <View style={[styles.container, {paddingTop: paddingTop}]}>
      <View style={styles.switcherContainer}>
        {/* Animated 'pill' that slides left-right */}
        <Animated.View
          style={[
            styles.movingPill,
            {
              transform: [{translateX: pillTranslateX}],
            },
          ]}
        />
        {/* Pressable areas for each option */}
        <Pressable
          style={styles.option}
          onPress={() => handleToggle(0)}
        >
          <Text
            style={[
              styles.optionText,
              activeIndex === 0 && styles.activeOptionText,
            ]}
          >
            {firstLabel}
          </Text>
        </Pressable>
        <Pressable
          style={styles.option}
          onPress={() => handleToggle(1)}
        >
          <Text
            style={[
              styles.optionText,
              activeIndex === 1 && styles.activeOptionText,
            ]}
          >
            {secondLabel}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

export default Switcher;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "absolute",
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  switcherContainer: {
    width: 200,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#000', // black background
    flexDirection: 'row',
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  movingPill: {
    position: 'absolute',
    width: '44%',
    marginLeft: '3%',
    marginRight: '3%',
    height: '80%',
    borderRadius: 24,
    backgroundColor: '#fff', // white background for the slider
    left: 0, // Starting position
  },
  option: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    color: '#dadada', // dim color for inactive
    fontSize: 16,
    fontWeight: '500',
  },
  activeOptionText: {
    color: '#000000', // white text for active
  },
});
