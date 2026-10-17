import React from 'react';
import { View, Text, StyleSheet, ColorValue } from 'react-native';
import { palette } from '../../constants/tokens';

export type TabIconName = 'home' | 'reels' | 'create' | 'chats' | 'account';

export interface TabIconProps {
  name: TabIconName;
  focused: boolean;
  color?: ColorValue | string;
  size?: number;
}

export const TabIcon: React.FC<TabIconProps> = ({
  name,
  focused,
  color,
  size = 22,
}) => {
  // Render clean, modern glyph icons
  const renderGlyph = () => {
    switch (name) {
      case 'home':
        return '⌂';
      case 'reels':
        return '▶';
      case 'create':
        return '+';
      case 'chats':
        return '✉';
      case 'account':
        return '👤';
      default:
        return '●';
    }
  };

  if (name === 'create') {
    return (
      <View style={styles.createButton}>
        <Text style={styles.createGlyph}>+</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.glyph,
          {
            color,
            fontSize: size,
            fontWeight: focused ? '800' : '500',
          },
        ]}
      >
        {renderGlyph()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
  },
  glyph: {
    textAlign: 'center',
  },
  createButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.brand500,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.brand500,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  createGlyph: {
    fontSize: 22,
    fontWeight: '700',
    color: palette.pureWhite,
    marginTop: -2,
  },
});
