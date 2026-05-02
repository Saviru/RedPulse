import React from "react";
import { Tabs } from "expo-router";
import { CustomTabBar } from "@/packages/ui/components/ui";
import { ScrollProvider } from "@/packages/ui/context/ScrollContext";

export default function OrgTabsLayout() {
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
          name="fundraising"
          options={{
            title: "Fundraising",
            tabBarIconName: "volunteer-activism",
          } as any}
        />
        <Tabs.Screen
          name="activity"
          options={{
            title: "Donations",
            tabBarIconName: "volunteer-activism",
            href: null,
          } as any}
        />
        <Tabs.Screen
          name="campaigns"
          options={{
            title: "Campaigns",
            tabBarIconName: "event",
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
