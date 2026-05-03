import React from "react";
import { Tabs } from "expo-router";
import { CustomTabBar } from "@/packages/ui/components/ui";
import { ScrollProvider } from "@/packages/ui/context/ScrollContext";

export default function UserTabsLayout() {
  return (
    <ScrollProvider>
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            tabBarIconName: "home",
          } as any}
        />
        <Tabs.Screen
          name="rewards"
          options={{
            title: "Rewards",
            tabBarIconName: "stars",
          } as any}
        />
        <Tabs.Screen
          name="shop"
          options={{
            title: "Shop",
            tabBarIconName: "shopping-bag",
          } as any}
        />
        <Tabs.Screen
          name="alerts"
          options={{
            title: "Alerts",
            tabBarIconName: "notifications",
          } as any}
        />
        <Tabs.Screen
          name="request"
          options={{
            title: "Request",
            tabBarIconName: "add-circle",
          } as any}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIconName: "person",
          } as any}
        />
      </Tabs>
    </ScrollProvider>
  );
}
