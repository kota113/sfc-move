import {getDistance} from 'geolib';
import {LocationObject} from "expo-location";
import {PointId} from "../types/points";
import {track} from "@amplitude/analytics-react-native";

export default function handleLocation(location: LocationObject, setDep: (dep: PointId) => void, setArr: (arr: PointId) => void) {
  const sfc = {latitude: 35.387615518299015, longitude: 139.42843437194827};
  const distance = getDistance(
    {latitude: location.coords.latitude, longitude: location.coords.longitude},
    sfc
  );

  let dep: PointId;
  let arr: PointId;
  if (distance < 550) { // Setting the threshold for being "near"
    dep = "sfc";
    arr = "shonandai";
  } else {
    dep = "shonandai";
    arr = "sfc";
  }
  setDep(dep);
  setArr(arr);

  // amplitude tracking
  track("Fetched current position", {
    dep: dep,
    arr: arr,
  });
}
