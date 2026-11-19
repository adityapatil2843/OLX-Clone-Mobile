import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { AppHeader } from './AppHeader';
import { ScreenContainer } from './ScreenContainer';
import { palette, spacing, typography } from '../../constants/tokens';

export type PolicySection = { title: string; body: string };

export function PolicyScreen({ title, intro, sections }: { title: string; intro: string; sections: PolicySection[] }) {
  const router = useRouter();
  return (
    <ScreenContainer>
      <AppHeader title={title} onBack={() => router.back()} left={<ArrowLeft size={24} color="#002f34" />} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>{intro}</Text>
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.heading}>{section.title}</Text>
            <Text style={styles.body}>{section.body}</Text>
          </View>
        ))}
        <Text style={styles.updated}>Last updated: 12 November 2026</Text>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  intro: { ...typography.bodyMedium, color: palette.slate600, lineHeight: 22, marginBottom: spacing.md },
  section: { marginBottom: spacing.md },
  heading: { ...typography.headline, color: '#002f34', marginBottom: spacing.xs },
  body: { ...typography.bodyMedium, color: palette.slate600, lineHeight: 21 },
  updated: { ...typography.bodySmall, color: palette.slate500, marginTop: spacing.md },
});
