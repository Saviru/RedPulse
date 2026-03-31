import React from "react";
import { Tabs } from "expo-router";
import { CustomTabBar } from "@/packages/ui/components/ui";
import { ScrollProvider } from "@/packages/ui/context/ScrollContext";

export default function HospitalTabsLayout() {
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
            tabBarIconName: "dashboard",
          } as any}
        />
        <Tabs.Screen
          name="manage-shop"
          options={{
            title: "Rewards",
            tabBarIconName: "redeem",
          } as any}
        />
        <Tabs.Screen
          name="requests"
          options={{
            title: "Requests",
            tabBarIconName: "bloodtype",
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
