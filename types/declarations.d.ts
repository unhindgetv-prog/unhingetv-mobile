// Ambient module declarations for packages that ship without TypeScript types.

// @mux/mux-data-react-native-video ships untyped JS. It exports a HOC that
// wraps a Video component with Mux Data QoE instrumentation.
declare module "@mux/mux-data-react-native-video" {
  import type { ComponentType } from "react";
  // The HOC adds a `muxOptions` prop for QoE configuration on top of the
  // wrapped component's own props.
  const muxReactNativeVideo: <P>(
    Video: ComponentType<P>
  ) => ComponentType<P & { muxOptions?: Record<string, unknown> }>;
  export default muxReactNativeVideo;
}
