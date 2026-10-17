import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { AppHeader } from '../../components/ui/AppHeader';
import { AppInput } from '../../components/ui/AppInput';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { palette, spacing, typography } from '../../constants/tokens';

const POPULAR_SEARCHES = ['Royal Enfield', 'iPhone 15', 'Swift Dzire', 'Driver Jobs', '2 BHK Flat'];

export default function SearchScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');

  return (
    <ScreenContainer scrollable>
      <AppHeader
        title="Search Marketplace"
        onBack={() => router.back()}
      />

      <View style={styles.searchContainer}>
        <AppInput
          placeholder={t('common.searchPlaceholder', 'Search cars, mobiles, jobs, electronics...')}
          value={query}
          onChangeText={setQuery}
          autoFocus
          clearButtonMode="while-editing"
          leftAccessory={<Text style={styles.searchIcon}>🔍</Text>}
        />
      </View>

      {/* Popular searches tags */}
      <View style={styles.popularSection}>
        <Text style={styles.sectionTitle}>Popular Searches</Text>
        <View style={styles.tagWrap}>
          {POPULAR_SEARCHES.map((item) => (
            <TouchableOpacity
              key={item}
              style={styles.tag}
              onPress={() => setQuery(item)}
            >
              <Text style={styles.tagText}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Card variant="subtle" style={styles.noticeCard}>
        <Badge label="Phase 0 Preview" variant="info" style={{ marginBottom: 6 }} />
        <Text style={styles.noticeTitle}>Full-Text & Faceted Search in Phase 1</Text>
        <Text style={styles.noticeText}>
          Search indexing (PostgreSQL / Elasticsearch), geo-distance radius filtering and sort orders will connect to backend search services in Phase 1.
        </Text>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    paddingTop: spacing.md,
  },
  searchIcon: {
    fontSize: 16,
  },
  popularSection: {
    marginVertical: spacing.lg,
  },
  sectionTitle: {
    ...typography.headline,
    color: palette.slate800,
    marginBottom: spacing.sm,
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: palette.pureWhite,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.slate200,
  },
  tagText: {
    ...typography.caption,
    color: palette.slate700,
  },
  noticeCard: {
    marginTop: spacing.xl,
    padding: spacing.lg,
  },
  noticeTitle: {
    ...typography.headline,
    color: palette.slate800,
    marginBottom: spacing.xs,
  },
  noticeText: {
    ...typography.bodySmall,
    color: palette.slate600,
    lineHeight: 18,
  },
});
