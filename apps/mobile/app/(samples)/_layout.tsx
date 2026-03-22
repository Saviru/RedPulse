import { Stack } from "expo-router";
import { useThemeColor } from "@/packages/ui/hooks";

export default function SamplesLayout() {
  const { colors } = useThemeColor();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
