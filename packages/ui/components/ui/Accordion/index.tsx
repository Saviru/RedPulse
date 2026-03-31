import React, { useState, useRef } from "react";
import { View, Text, TouchableOpacity, Animated, LayoutAnimation, Platform, UIManager } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { styles } from "./Accordion.styles";
import { AccordionProps } from "./Accordion.types";
import { useThemeColor } from "@/packages/ui/hooks";

// LayoutAnimation on Android new architecture is enabled by default or no-op
// Removed setup to prevent warnings.


export const Accordion = ({ title, content, style }: AccordionProps) => {
  const [expanded, setExpanded] = useState(false);
  const { colors } = useThemeColor();

  const toggleAccordion = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }, style]}>
      <TouchableOpacity
        style={styles.header}
        onPress={toggleAccordion}
        activeOpacity={0.7}
      >
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <MaterialIcons
          name={expanded ? "remove" : "add"}
          size={24}
          color={colors.text}
        />
      </TouchableOpacity>
      {expanded && (
        <View style={styles.contentContainer}>
          <Text style={[styles.content, { color: colors.text }]}>
            {content}
          </Text>
        </View>
      )}
    </View>
  );
};
