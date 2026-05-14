import { Tabs } from "expo-router";
import { Platform, View } from "react-native";
import { Home, Film, Search, User } from "lucide-react-native";
import { Colors, Fonts } from "../../constants/theme";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#050505",
          borderTopColor: Colors.cardBorder,
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 88 : 68,
          paddingBottom: Platform.OS === "ios" ? 26 : 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: Colors.redAccent,
        tabBarInactiveTintColor: "rgba(255,255,255,0.4)",
        tabBarLabelStyle: {
          fontFamily: Fonts.barlow,
          fontSize: 10,
          fontWeight: "700",
          letterSpacing: 1.8,
          textTransform: "uppercase",
          marginTop: 2,
        },
        tabBarIconStyle: { marginBottom: -2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused, size }) => (
            <TabIcon focused={focused}>
              <Home color={color} size={size - 3} strokeWidth={focused ? 2.4 : 2} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="shows"
        options={{
          title: "Shows",
          tabBarIcon: ({ color, focused, size }) => (
            <TabIcon focused={focused}>
              <Film color={color} size={size - 3} strokeWidth={focused ? 2.4 : 2} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color, focused, size }) => (
            <TabIcon focused={focused}>
              <Search color={color} size={size - 3} strokeWidth={focused ? 2.4 : 2} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          tabBarIcon: ({ color, focused, size }) => (
            <TabIcon focused={focused}>
              <User color={color} size={size - 3} strokeWidth={focused ? 2.4 : 2} />
            </TabIcon>
          ),
        }}
      />
    </Tabs>
  );
}

function TabIcon({ children, focused }: { children: React.ReactNode; focused: boolean }) {
  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      {children}
      {focused && (
        <View
          style={{
            width: 18,
            height: 2,
            backgroundColor: Colors.red,
            borderRadius: 1,
            marginTop: 4,
            shadowColor: Colors.red,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 4,
            elevation: 3,
          }}
        />
      )}
    </View>
  );
}
