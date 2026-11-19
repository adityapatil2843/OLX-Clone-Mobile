import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { palette, radii, spacing } from '../../constants/tokens';
import { DisplayQuickReply } from '../../hooks/useQuickReplies';

export interface QuickRepliesBarProps {
  /**
   * List of translated quick reply suggestions to display.
   */
  suggestions: DisplayQuickReply[];

  /**
   * Callback invoked when a suggestion chip is tapped.
   */
  onSelect: (item: DisplayQuickReply) => void;

  /**
   * Optional dismissal callback to hide suggestions for the current session.
   */
  onDismiss?: () => void;

  /**
   * Test identifier for end-to-end and integration tests.
   */
  testID?: string;
}

export const QuickRepliesBar = memo(function QuickRepliesBar({
  suggestions,
  onSelect,
  onDismiss,
  testID,
}: QuickRepliesBarProps) {
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <View style={styles.container} testID={testID}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        contentContainerStyle={styles.scrollContent}
        accessibilityRole="toolbar"
        accessibilityLabel="Quick reply suggestions"
      >
        {suggestions.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.chip}
            onPress={() => onSelect(item)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={item.text}
            accessibilityHint="Pre-fills this message in the input field"
          >
            <Text style={styles.chipText} numberOfLines={1}>
              {item.text}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {onDismiss && (
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel="Dismiss suggestions"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.dismissText}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.pureWhite,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: palette.slate100,
  },
  scrollContent: {
    paddingRight: spacing.sm,
    gap: spacing.xs,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.full,
    backgroundColor: palette.slate50,
    borderWidth: 1,
    borderColor: palette.slate200,
    marginRight: spacing.xs,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: palette.slate700,
  },
  dismissButton: {
    padding: spacing.xs,
    marginLeft: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissText: {
    fontSize: 14,
    color: palette.slate400,
    fontWeight: '600',
  },
});

