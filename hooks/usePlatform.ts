import { Platform } from "react-native";

export function useIsTV(): boolean {
  return Platform.isTV === true;
}

export function useIsiOS(): boolean {
  return Platform.OS === "ios" && !Platform.isTV;
}

export function useIsAndroid(): boolean {
  return Platform.OS === "android" && !Platform.isTV;
}
