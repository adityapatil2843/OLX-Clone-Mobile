import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ViewStyle,
  StatusBar,
  ScrollViewProps,
  Platform,
} from 'react-native';
import { SafeAreaView, Edge, useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, spacing } from '../../constants/tokens';

export interface ScreenContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  edges?: Edge[];
  backgroundColor?: string;
  statusBarStyle?: 'dark-content' | 'light-content';
  statusBarTranslucent?: boolean;
  scrollViewProps?: ScrollViewProps;
  hasBottomTab?: boolean;
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  scrollable = false,
  style,
  contentContainerStyle,
  edges,
  backgroundColor = palette.slate50,
  statusBarStyle = 'dark-content',
  statusBarTranslucent = false,
  scrollViewProps,
  hasBottomTab = false,
}) => {
  const insets = useSafeAreaInsets();

  // If inside bottom tabs, don't double inset the bottom.
  // If standalone screen without bottom tabs, ensure bottom safe area is respected for gesture bar & 3-button bar.
  const resolvedEdges: Edge[] = edges ?? (hasBottomTab ? ['top', 'left', 'right'] : ['top', 'left', 'right', 'bottom']);

  return (
    <SafeAreaView
      edges={resolvedEdges}
      style={[
        styles.container,
        { backgroundColor },
        statusBarTranslucent && Platform.OS === 'android' ? { paddingTop: insets.top } : null,
        style,
      ]}
    >
      <StatusBar
        barStyle={statusBarStyle}
        backgroundColor={statusBarTranslucent ? 'transparent' : backgroundColor}
        translucent={statusBarTranslucent}
      />
      {scrollable ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scrollContent,
            hasBottomTab ? { paddingBottom: spacing.xl } : null,
            contentContainerStyle,
          ]}
          {...scrollViewProps}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.fixedContent, contentContainerStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  fixedContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
});
