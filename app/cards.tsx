import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Typo } from '@/components/ui/Typo';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function CardsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Button
            label="Back"
            variant="secondary"
            icon={<Ionicons name="arrow-back" size={20} color="#1C1C1E" />}
            onPress={() => router.back()}
            style={{ width: 100, marginBottom: 16 }}
          />
          <Typo variant="h1">Card Components</Typo>
        </View>

        <View style={styles.showcase}>
          <View style={styles.section}>
            <Typo variant="caption" color="#FF3B30">Elevated (default)</Typo>
            <Card variant="elevated">
              <Typo variant="h2">Elevated Card</Typo>
              <Typo variant="body">This card has a subtle shadow for depth.</Typo>
            </Card>
          </View>

          <View style={styles.section}>
            <Typo variant="caption" color="#FF3B30">Outlined</Typo>
            <Card variant="outlined">
              <Typo variant="h2">Outlined Card</Typo>
              <Typo variant="body">This card uses a border instead of a shadow.</Typo>
            </Card>
          </View>

          <View style={styles.section}>
            <Typo variant="caption" color="#FF3B30">Filled</Typo>
            <Card variant="filled">
              <Typo variant="h2">Filled Card</Typo>
              <Typo variant="body">This card has a grey background fill.</Typo>
            </Card>
          </View>

          <View style={styles.section}>
            <Typo variant="caption" color="#FF3B30">Pressable Card</Typo>
            <Card variant="elevated" onPress={() => {}}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Ionicons name="finger-print" size={24} color="#FF3B30" />
                <View style={{ flex: 1 }}>
                  <Typo variant="h2" style={{ fontSize: 18 }}>Tap Me</Typo>
                  <Typo variant="caption">This card responds to press events</Typo>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
              </View>
            </Card>
          </View>

          <View style={styles.section}>
            <Typo variant="caption" color="#FF3B30">Custom Padding</Typo>
            <Card variant="outlined" padding={24}>
              <Typo variant="body">This card has 24px padding instead of the default 16px.</Typo>
            </Card>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F8' },
  content: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 },
  header: { marginBottom: 32 },
  showcase: { gap: 24 },
  section: { gap: 8 },
});
