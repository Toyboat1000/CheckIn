import { Tabs, useRouter } from "expo-router";

import { StyleSheet, View } from "react-native";

import { BottomTabBar, BottomTabBarProps } from "expo-router/js-tabs";

import { useAppData } from "@/context/AppDataContext";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect } from "react";

export default function TabLayout() {
  const { people, selectedPersonId, addCheckup, isLoading } = useAppData();
  const router = useRouter();

  const selectedPerson = people.find(
    (person) => person.id === selectedPersonId,
  );
  useEffect(() => {
    if (!isLoading && !selectedPerson) {
      router.replace("/profile");
    }
  }, [isLoading, selectedPerson, router]);

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <FloatingTabBar {...props} />}
    >
      <Tabs.Screen
        name="reports"
        options={{
          title: "Reports",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "document-text" : "document-text-outline"}
              size={size}
              color={color as string}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="(home)"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={size}
              color={color as string}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="trends"
        options={{
          title: "Trends",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "bar-chart" : "bar-chart-outline"}
              size={size}
              color={color as string}
            />
          ),
        }}
      />
    </Tabs>
  );
}

function FloatingTabBar(props: BottomTabBarProps) {
  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <View style={styles.dock}>
        <BottomTabBar {...props} style={styles.innerBar} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: "center",
  },

  dock: {
    width: "70%",
    height: 60,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#ffffff",
    backgroundColor: "#9b4dfa",
    overflow: "hidden",
  },

  innerBar: {
    flex: 1,
    backgroundColor: "transparent",
  },
});
