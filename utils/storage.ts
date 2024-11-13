import AsyncStorage from "@react-native-async-storage/async-storage";

export const storeJsonData = async (key: string, value: object | Array<never>) => {
  const jsonValue = JSON.stringify(value);
  await AsyncStorage.setItem(key, jsonValue);
};

export const getData = async (key: string) => {
  const value = await AsyncStorage.getItem(key);
  try {
    return value ? JSON.parse(value) : null;
  } catch (e) {
    return value;
  }
};
