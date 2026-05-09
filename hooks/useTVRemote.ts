/**
 * useTVRemote — handles D-pad / Siri Remote / Fire TV remote events
 * Works on Apple TV (tvOS) and Android TV / Fire TV
 */
import { useEffect } from "react";
import { TVEventHandler, HWKeyEvent, Platform } from "react-native";

type TVKey = "up" | "down" | "left" | "right" | "select" | "menu" | "playPause" | "rewind" | "fastForward";

type TVRemoteHandlers = Partial<Record<TVKey, () => void>>;

export function useTVRemote(handlers: TVRemoteHandlers, enabled = true) {
  useEffect(() => {
    if (!Platform.isTV || !enabled) return;

    const handler = new TVEventHandler();
    handler.enable(null, (_cmp: any, evt: HWKeyEvent) => {
      if (!evt) return;
      const key = evt.eventType as TVKey;
      handlers[key]?.();
    });

    return () => {
      handler.disable();
    };
  }, [handlers, enabled]);
}
