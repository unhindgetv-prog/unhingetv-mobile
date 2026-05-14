/**
 * useTVRemote — handles D-pad / Siri Remote / Fire TV remote events
 * Works on Apple TV (tvOS) and Android TV / Fire TV.
 *
 * TVEventHandler / HWKeyEvent only exist in the react-native-tvos fork; on
 * stock react-native @types they are not exported. We resolve them off the
 * runtime module via `require` to dodge the type error — Platform.isTV is
 * false on stock RN anyway, so the import is dead code there.
 */
import { useEffect } from "react";
import { Platform } from "react-native";

type TVKey =
  | "up" | "down" | "left" | "right"
  | "select" | "menu" | "playPause" | "rewind" | "fastForward";

type TVRemoteHandlers = Partial<Record<TVKey, () => void>>;

interface HWKeyEventShape {
  eventType: TVKey | string;
}

interface TVEventHandlerShape {
  enable(component: unknown, cb: (cmp: unknown, evt: HWKeyEventShape) => void): void;
  disable(): void;
}

export function useTVRemote(handlers: TVRemoteHandlers, enabled = true) {
  useEffect(() => {
    if (!Platform.isTV || !enabled) return;

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const RN = require("react-native") as {
      TVEventHandler?: new () => TVEventHandlerShape;
    };
    const TVEventHandlerCtor = RN.TVEventHandler;
    if (!TVEventHandlerCtor) return;

    const handler = new TVEventHandlerCtor();
    handler.enable(null, (_cmp: unknown, evt: HWKeyEventShape) => {
      if (!evt) return;
      const key = evt.eventType as TVKey;
      handlers[key]?.();
    });

    return () => {
      handler.disable();
    };
  }, [handlers, enabled]);
}
